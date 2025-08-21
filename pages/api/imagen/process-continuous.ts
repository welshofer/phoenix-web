import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Continuous image queue processor
 * This endpoint processes multiple jobs and is designed to be called periodically
 */

const MAX_JOBS_PER_RUN = 5;
const PROCESSING_INTERVAL = 2000; // 2 seconds between jobs

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
      
      // Wait between jobs to avoid rate limiting
      if (i < maxJobs - 1 && result.processed > 0) {
        await new Promise(resolve => setTimeout(resolve, PROCESSING_INTERVAL));
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