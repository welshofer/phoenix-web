import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getNextPendingJob, 
  updateJobStatus,
  ImageGenerationJob 
} from '@/lib/firebase/image-queue';
import { IMAGE_STYLES } from '@/lib/constants/image-styles';
import { uploadMultipleImagesServer } from '@/lib/firebase/server-storage';
import { generateImagePath } from '@/lib/firebase/storage';

/**
 * Process image generation queue - SIMPLIFIED VERSION
 * Rate limit: 20 requests per minute = 1 request every 3 seconds
 * We'll be conservative and do 1 every 9 seconds
 */

const PROJECT_ID = 'phoenix-web-app';
const LOCATION = 'us-central1';
const MODEL = 'imagegeneration@006';

// Track last request time globally
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 9000; // 9 seconds between requests

// Prevent concurrent processing with timeout
let processingTimeout: NodeJS.Timeout | null = null;

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
    // Simple rate limiting - wait if needed
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`Waiting ${waitTime}ms before next request to respect rate limit`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Update last request time
    lastRequestTime = Date.now();
    
    // Get access token
    const accessToken = await getAccessToken();
    
    // Build prompt
    const stylePrompt = IMAGE_STYLES[job.style as keyof typeof IMAGE_STYLES] || IMAGE_STYLES.photorealistic;
    const prompt = `${job.description}, ${stylePrompt}`;
    
    console.log(`Processing job ${job.id}: ${prompt.substring(0, 100)}...`);
    
    // Call Vertex AI - EXACTLY like the working test endpoint
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;
    
    const requestBody = {
      instances: [
        {
          prompt: prompt,
        }
      ],
      parameters: {
        sampleCount: 3, // Generate 3 variants
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
      
      // If rate limited, we should retry
      if (response.status === 429) {
        return {
          imageUrls: [],
          fullPrompt: prompt,
          error: 'Rate limited - will retry',
          shouldRetry: true
        };
      }
      
      throw new Error(`Vertex AI returned ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.predictions || result.predictions.length === 0) {
      throw new Error('No images generated');
    }
    
    console.log(`Received ${result.predictions.length} predictions from Imagen`);
    
    // Extract base64 images
    const base64Images = result.predictions
      .map((prediction: any) => prediction.bytesBase64Encoded)
      .filter(Boolean);
    
    // Upload to Firebase Storage
    const storagePath = generateImagePath(job.presentationId, job.slideId, job.id);
    console.log(`Uploading ${base64Images.length} images to storage at ${storagePath}`);
    
    const imageUrls = await uploadMultipleImagesServer(base64Images, storagePath);
    console.log(`Successfully uploaded ${imageUrls.length} images to Firebase Storage`);
    
    return { 
      imageUrls, 
      fullPrompt: prompt 
    };
    
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

  // Check if already processing
  if (processingTimeout) {
    console.log('Already processing another job, skipping');
    return res.status(200).json({ 
      success: true, 
      message: 'Already processing',
      processed: 0 
    });
  }

  try {
    // Set processing timeout (clear after 30 seconds to prevent stuck locks)
    processingTimeout = setTimeout(() => {
      console.log('Processing timeout cleared');
      processingTimeout = null;
    }, 30000);
    
    // Get next job from queue
    const job = await getNextPendingJob();
    
    if (!job) {
      if (processingTimeout) {
        clearTimeout(processingTimeout);
        processingTimeout = null;
      }
      return res.status(200).json({ 
        success: true, 
        message: 'No pending jobs',
        processed: 0 
      });
    }
    
    console.log(`Processing image job ${job.id} for slide ${job.slideId}`);
    
    // Mark job as processing
    await updateJobStatus(job.id, 'processing');
    
    // Generate images - SIMPLE, no circuit breaker bullshit
    const result = await generateImageVariants(job);
    
    if (result.error || result.imageUrls.length === 0) {
      const retryCount = (job.retryCount || 0) + 1;
      const maxRetries = 3;
      
      if (result.shouldRetry && retryCount < maxRetries) {
        // Simple retry with delay
        await updateJobStatus(job.id, 'pending', {
          error: result.error || 'No images generated',
          retryCount,
        });
        
        console.log(`Job ${job.id} will retry (attempt ${retryCount}/${maxRetries})`);
        
        if (processingTimeout) {
          clearTimeout(processingTimeout);
          processingTimeout = null;
        }
        return res.status(200).json({
          success: false,
          jobId: job.id,
          error: result.error || 'No images generated',
          willRetry: true,
          retryCount,
        });
      } else {
        // Max retries exceeded, mark as failed
        await updateJobStatus(job.id, 'failed', {
          error: result.error || 'Failed to generate images',
          retryCount,
        });
        
        if (processingTimeout) {
          clearTimeout(processingTimeout);
          processingTimeout = null;
        }
        return res.status(200).json({
          success: false,
          jobId: job.id,
          error: result.error || 'No images generated',
          maxRetriesExceeded: true,
        });
      }
    }
    
    // Success! Mark as completed with image URLs and prompt
    await updateJobStatus(job.id, 'completed', {
      imageUrls: result.imageUrls,
      heroIndex: 0, // Default first image as hero
      fullPrompt: result.fullPrompt, // Store the complete prompt used
    });
    
    // Also update the presentation slide with the new images
    // This would require updating the slide in the presentation document
    // For now, we'll rely on real-time listeners to update the UI
    
    console.log(`Completed job ${job.id}: ${result.imageUrls.length} variants generated`);
    
    if (processingTimeout) {
      clearTimeout(processingTimeout);
      processingTimeout = null;
    }
    return res.status(200).json({
      success: true,
      jobId: job.id,
      slideId: job.slideId,
      variantCount: result.imageUrls.length,
      processed: 1,
    });
    
  } catch (error) {
    console.error('Error processing queue:', error);
    if (processingTimeout) {
      clearTimeout(processingTimeout);
      processingTimeout = null;
    }
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process queue',
    });
  }
}