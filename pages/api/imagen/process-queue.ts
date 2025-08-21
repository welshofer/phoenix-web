import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getNextPendingJob, 
  updateJobStatus,
  ImageGenerationJob 
} from '@/lib/firebase/image-queue';
import { IMAGE_STYLES } from '@/lib/constants/image-styles';
import { withCircuitBreaker } from '@/lib/imagen/circuit-breaker';
import { uploadMultipleImages, generateImagePath, dataUrlToBase64 } from '@/lib/firebase/storage';

/**
 * Process image generation queue
 * This endpoint should be called periodically (e.g., by a cron job or client polling)
 */

const PROJECT_ID = 'phoenix-web-app';
const LOCATION = 'us-central1';
const MODEL = 'imagegeneration@006';

async function getAccessToken(): Promise<string> {
  try {
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token || '';
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw new Error('Authentication failed');
  }
}

async function generateImageVariants(
  description: string,
  style: string
): Promise<{ imageUrls: string[], error?: string }> {
  try {
    const accessToken = await getAccessToken();
    const stylePrompt = IMAGE_STYLES[style as keyof typeof IMAGE_STYLES] || IMAGE_STYLES.photorealistic;
    const prompt = `${description}, ${stylePrompt}`;
    
    console.log('Generating image variants for queue job, style:', style);
    
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;
    
    const requestBody = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 3,
        aspectRatio: '16:9',
      }
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI error:', errorText);
      throw new Error(`Image generation failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.predictions || result.predictions.length === 0) {
      throw new Error('No images generated');
    }
    
    // Get base64 strings
    const base64Images = result.predictions
      .map((pred: any) => pred.bytesBase64Encoded)
      .filter(Boolean);
    
    // Upload to Firebase Storage
    const basePath = generateImagePath(
      job.presentationId, 
      job.slideId, 
      job.id
    ).replace(/\.png$/, ''); // Remove extension for base path
    
    const imageUrls = await uploadMultipleImages(base64Images, basePath);
    
    return { imageUrls };
  } catch (error) {
    console.error('Error generating images:', error);
    return { 
      imageUrls: [], 
      error: error instanceof Error ? error.message : 'Failed to generate images' 
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get next job from queue
    const job = await getNextPendingJob();
    
    if (!job) {
      return res.status(200).json({ 
        success: true, 
        message: 'No pending jobs',
        processed: 0 
      });
    }
    
    console.log(`Processing image job ${job.id} for slide ${job.slideId}`);
    
    // Mark job as processing
    await updateJobStatus(job.id, 'processing');
    
    // Generate images with circuit breaker protection
    let imageUrls: string[] = [];
    let error: string | undefined;
    
    try {
      const result = await withCircuitBreaker(
        () => generateImageVariants(job.description, job.style),
        { imageUrls: [], error: 'Circuit breaker open - service unavailable' }
      );
      imageUrls = result.imageUrls;
      error = result.error;
    } catch (circuitError) {
      error = circuitError instanceof Error ? circuitError.message : 'Circuit breaker error';
      console.error('Circuit breaker error:', circuitError);
    }
    
    if (error || imageUrls.length === 0) {
      const retryCount = (job.retryCount || 0) + 1;
      const maxRetries = 3;
      
      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        const backoffDelay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
        
        await updateJobStatus(job.id, 'pending', {
          error: error || 'No images generated',
          retryCount,
          // Add a retry timestamp for delayed processing
          retryAfter: new Date(Date.now() + backoffDelay),
        });
        
        console.log(`Job ${job.id} will retry (attempt ${retryCount}/${maxRetries}) after ${backoffDelay}ms`);
        
        return res.status(200).json({
          success: false,
          jobId: job.id,
          error: error || 'No images generated',
          willRetry: true,
          retryCount,
          retryAfter: backoffDelay,
        });
      } else {
        // Max retries exceeded, mark as permanently failed
        await updateJobStatus(job.id, 'failed', {
          error: `${error || 'No images generated'} (max retries exceeded)`,
          retryCount,
        });
        
        return res.status(200).json({
          success: false,
          jobId: job.id,
          error: error || 'No images generated',
          maxRetriesExceeded: true,
        });
      }
    }
    
    // Mark as completed with image URLs
    await updateJobStatus(job.id, 'completed', {
      imageUrls,
      heroIndex: 0, // Default first image as hero
    });
    
    // Also update the presentation slide with the new images
    // This would require updating the slide in the presentation document
    // For now, we'll rely on real-time listeners to update the UI
    
    console.log(`Completed job ${job.id}: ${imageUrls.length} variants generated`);
    
    return res.status(200).json({
      success: true,
      jobId: job.id,
      slideId: job.slideId,
      variantCount: imageUrls.length,
      processed: 1,
    });
    
  } catch (error) {
    console.error('Error processing queue:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process queue',
    });
  }
}