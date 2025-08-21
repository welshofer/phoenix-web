import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getNextPendingJob, 
  updateJobStatus,
  ImageGenerationJob 
} from '@/lib/firebase/image-queue';
import { IMAGE_STYLES } from '@/lib/constants/image-styles';
import { withCircuitBreaker } from '@/lib/imagen/circuit-breaker';
import { uploadMultipleImages, generateImagePath, dataUrlToBase64 } from '@/lib/firebase/storage';
import { imagenRateLimiter } from '@/lib/imagen/rate-limiter';

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
  job: ImageGenerationJob
): Promise<{ imageUrls: string[], fullPrompt: string, error?: string, shouldRetry?: boolean }> {
  try {
    // Check rate limiter before making request
    const waitTime = imagenRateLimiter.getWaitTimeMs();
    if (waitTime > 0) {
      console.log(`Rate limiter: waiting ${waitTime}ms before request`);
      return {
        imageUrls: [],
        fullPrompt: '',
        error: `Rate limited - waiting ${Math.ceil(waitTime / 1000)}s`,
        shouldRetry: true
      };
    }
    
    // Try to consume a token
    if (!imagenRateLimiter.consumeToken()) {
      return {
        imageUrls: [],
        fullPrompt: '',
        error: 'Rate limit exceeded - no tokens available',
        shouldRetry: true
      };
    }
    
    const accessToken = await getAccessToken();
    const stylePrompt = IMAGE_STYLES[job.style as keyof typeof IMAGE_STYLES] || IMAGE_STYLES.photorealistic;
    const prompt = `${job.description}, ${stylePrompt}`;
    
    console.log('Generating image variants for queue job, style:', job.style);
    
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;
    
    const requestBody = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 3,
        aspectRatio: '16:9',
      }
    };
    
    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Imagen API response: ${response.status} in ${responseTime}ms`);
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const retryMs = retryAfter ? parseInt(retryAfter) * 1000 : undefined;
      
      imagenRateLimiter.handleRateLimitError(retryMs);
      
      const errorText = await response.text().catch(() => 'Rate limited');
      console.error('Rate limited by Imagen API:', errorText);
      
      return {
        imageUrls: [],
        fullPrompt: prompt,
        error: 'Rate limited by API - will retry with backoff',
        shouldRetry: true
      };
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI error:', errorText);
      throw new Error(`Image generation failed: ${response.status}`);
    }
    
    // Success - notify rate limiter
    imagenRateLimiter.handleSuccess();
    
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
    
    return { imageUrls, fullPrompt: prompt };
  } catch (error) {
    console.error('Error generating images:', error);
    return { 
      imageUrls: [], 
      fullPrompt: '',
      error: error instanceof Error ? error.message : 'Failed to generate images',
      shouldRetry: false 
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
    let fullPrompt: string = '';
    let error: string | undefined;
    let shouldRetry: boolean = false;
    
    try {
      const result = await withCircuitBreaker(
        () => generateImageVariants(job),
        { imageUrls: [], fullPrompt: '', error: 'Circuit breaker open - service unavailable', shouldRetry: true }
      );
      imageUrls = result.imageUrls;
      fullPrompt = result.fullPrompt;
      error = result.error;
      shouldRetry = result.shouldRetry || false;
    } catch (circuitError) {
      error = circuitError instanceof Error ? circuitError.message : 'Circuit breaker error';
      shouldRetry = true;
      console.error('Circuit breaker error:', circuitError);
    }
    
    if (error || imageUrls.length === 0) {
      const retryCount = (job.retryCount || 0) + 1;
      const maxRetries = 5; // Increased from 3 to handle rate limiting better
      
      if (shouldRetry && retryCount < maxRetries) {
        // Calculate backoff delay with jitter
        const baseDelay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s, 16s, 32s
        const jitter = Math.random() * 1000; // Add 0-1s jitter
        const backoffDelay = Math.min(baseDelay + jitter, 60000); // Cap at 60s
        
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
        // Max retries exceeded or non-retryable error, mark as permanently failed
        await updateJobStatus(job.id, 'failed', {
          error: shouldRetry 
            ? `${error || 'No images generated'} (max retries exceeded)`
            : (error || 'Failed to generate images'),
          retryCount,
        });
        
        return res.status(200).json({
          success: false,
          jobId: job.id,
          error: error || 'No images generated',
          maxRetriesExceeded: shouldRetry,
        });
      }
    }
    
    // Mark as completed with image URLs and prompt
    await updateJobStatus(job.id, 'completed', {
      imageUrls,
      heroIndex: 0, // Default first image as hero
      fullPrompt, // Store the complete prompt used
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