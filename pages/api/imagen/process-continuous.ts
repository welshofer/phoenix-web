import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Continuous image queue processor - SIMPLIFIED
 * Just process one job at a time, period.
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Just call the single job processor once
    const response = await fetch(
      `${req.headers.origin || 'http://localhost:3001'}/api/imagen/process-queue`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    const result = await response.json();
    
    return res.status(200).json({
      success: true,
      processedCount: result.processed || 0,
      result,
      message: result.processed > 0 
        ? 'Processed 1 image generation job'
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