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
const MIN_REQUEST_INTERVAL = 20000; // 20 seconds between requests (very conservative for quota)

// Prevent concurrent processing with timeout
let processingTimeout: NodeJS.Timeout | null = null;

// Track consecutive failures for exponential backoff
let consecutiveFailures = 0;

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
    // Enhanced rate limiting with exponential backoff
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    // Calculate wait time with exponential backoff for failures
    const baseInterval = MIN_REQUEST_INTERVAL;
    const backoffMultiplier = Math.min(Math.pow(2, consecutiveFailures), 8); // Max 8x backoff
    const requiredInterval = baseInterval * backoffMultiplier;
    
    if (timeSinceLastRequest < requiredInterval) {
      const waitTime = requiredInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms (backoff multiplier: ${backoffMultiplier}x)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Update last request time
    lastRequestTime = Date.now();
    
    // Get access token
    const accessToken = await getAccessToken();
    
    // Build prompt - sanitize to avoid Google's overzealous censorship
    let sanitizedDescription = job.description
      .replace(/\b(kill|death|dead|die|dying|blood|violent|violence|war|fight|battle|weapon|gun|bomb|terrorist|terror|attack|destroy)\b/gi, '')
      .replace(/\b(naked|nude|sex|sexual)\b/gi, '')
      .trim();
    
    // If sanitization removed too much, use a generic prompt
    if (sanitizedDescription.length < 10) {
      sanitizedDescription = `Professional business image related to ${job.presentationId.substring(0, 8)}`;
    }
    
    const stylePrompt = IMAGE_STYLES[job.style as keyof typeof IMAGE_STYLES] || IMAGE_STYLES.photorealistic;
    const prompt = `${sanitizedDescription}, ${stylePrompt}`;
    
    console.log('Sanitized prompt:', prompt.substring(0, 100) + '...');
    
    // Processing job with Imagen
    
    // Call Vertex AI - EXACTLY like the working test endpoint
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;
    
    const requestBody = {
      instances: [
        {
          prompt: prompt,
        }
      ],
      parameters: {
        sampleCount: 2, // Reduced to 2 variants to conserve quota
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
      
      // If rate limited, we should retry with increased backoff
      if (response.status === 429) {
        consecutiveFailures++;
        console.log(`Rate limited (429). Increasing backoff to ${Math.pow(2, consecutiveFailures)}x`);
        return {
          imageUrls: [],
          fullPrompt: prompt,
          error: 'Rate limited - will retry with increased delay',
          shouldRetry: true
        };
      }
      
      // Other errors - don't increase backoff
      throw new Error(`Vertex AI returned ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.predictions || result.predictions.length === 0) {
      throw new Error('No images generated');
    }
    
    // Received predictions from Imagen
    
    // Extract base64 images
    const base64Images = result.predictions
      .map((prediction: any) => prediction.bytesBase64Encoded)
      .filter(Boolean);
    
    // Upload to Firebase Storage
    const storagePath = generateImagePath(job.presentationId, job.slideId, job.id);
    // Uploading images to storage
    
    const imageUrls = await uploadMultipleImagesServer(base64Images, storagePath);
    // Successfully uploaded images to Firebase Storage
    
    // Reset consecutive failures on success
    consecutiveFailures = 0;
    
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
    // Already processing another job, skipping
    return res.status(200).json({ 
      success: true, 
      message: 'Already processing',
      processed: 0 
    });
  }

  try {
    // Set processing timeout (clear after 30 seconds to prevent stuck locks)
    processingTimeout = setTimeout(() => {
      // Processing timeout cleared
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
    
    // Processing image job for slide
    
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
        
        // Job will retry
        
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
    
    // Update the presentation slide with the new images
    try {
      const { updateSlideImage } = await import('@/lib/firebase/presentations');
      await updateSlideImage(job.presentationId, job.slideId, {
        src: result.imageUrls[0], // Use the first generated image
        objectId: job.objectId, // Pass the specific object ID
        imageIndex: job.imageIndex, // Pass the image index
        variants: result.imageUrls,
        heroIndex: 0,
        generatedAt: new Date(),
        generationPrompt: result.fullPrompt,
      });
      // Updated slide with generated images
    } catch (updateError) {
      console.error('Failed to update slide with images:', updateError);
      // Don't fail the job, images are saved in the queue
    }
    
    // Completed job with variants generated
    
    // IMPORTANT: Continue processing more jobs!
    // Recursively call ourselves to process the next job
    const nextJob = await getNextPendingJob();
    if (nextJob) {
      // Found another job to process, continuing
      // Process next job after a delay based on backoff state
      const nextDelay = consecutiveFailures > 0 ? 10000 : 5000; // 10s if we had failures, 5s otherwise
      console.log(`Scheduling next job in ${nextDelay}ms`);
      setTimeout(async () => {
        try {
          const response = await fetch(`http://localhost:${process.env.PORT || '3001'}/api/imagen/process-queue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!response.ok) {
            console.error('Failed to continue processing:', response.status);
          }
        } catch (err) {
          console.error('Failed to trigger next job:', err);
        }
      }, nextDelay); // Dynamic delay based on failure state
    } else {
      // No more jobs in queue
    }
    
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
      hasMore: !!nextJob,
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