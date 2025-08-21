import type { NextApiRequest, NextApiResponse } from 'next';
import { imagenRateLimiter } from '@/lib/imagen/rate-limiter';

/**
 * Continuous image queue processor
 * This endpoint processes multiple jobs and is designed to be called periodically
 */

const MAX_JOBS_PER_RUN = 1; // Process only 1 job per run to avoid rate limits
const MIN_PROCESSING_INTERVAL = 10000; // Minimum 10 seconds between jobs for strict rate limiting

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { maxJobs = MAX_JOBS_PER_RUN } = req.body;
  
  try {
    let processedCount = 0;
    const results = [];
    
    for (let i = 0; i < maxJobs; i++) {
      // Check rate limiter before processing
      const waitTime = imagenRateLimiter.getWaitTimeMs();
      if (waitTime > 0) {
        console.log(`Rate limiter requires ${waitTime}ms wait, skipping batch`);
        
        // If we need to wait more than 30 seconds, stop processing this batch
        if (waitTime > 30000) {
          break;
        }
        
        // Otherwise wait before processing
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Call the single job processor
      const response = await fetch(
        `${req.headers.origin || 'http://localhost:3001'}/api/imagen/process-queue`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      const result = await response.json();
      
      if (result.processed === 0) {
        // No more jobs to process
        break;
      }
      
      processedCount += result.processed || 0;
      results.push(result);
      
      // If job was rate limited, add extra delay
      if (result.willRetry && result.retryAfter) {
        const extraDelay = Math.min(result.retryAfter, 30000);
        console.log(`Job was rate limited, adding ${extraDelay}ms delay`);
        await new Promise(resolve => setTimeout(resolve, extraDelay));
      } else if (i < maxJobs - 1 && result.processed > 0) {
        // Normal interval between successful jobs
        await new Promise(resolve => setTimeout(resolve, MIN_PROCESSING_INTERVAL));
      }
    }
    
    return res.status(200).json({
      success: true,
      processedCount,
      results,
      message: processedCount > 0 
        ? `Processed ${processedCount} image generation jobs`
        : 'No pending jobs to process',
    });
    
  } catch (error) {
    console.error('Error in continuous processor:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed',
    });
  }
}