import type { NextApiRequest, NextApiResponse } from 'next';
import { updateJobStatus } from '@/lib/firebase/image-queue';

/**
 * Retry failed image generation jobs
 * Resets job status to pending so it can be processed again
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID required' });
  }

  try {
    // Reset job to pending status
    await updateJobStatus(jobId, 'pending', {
      error: undefined,
      retryCount: 0,
      startedAt: undefined,
      completedAt: undefined,
    });

    console.log(`Job ${jobId} reset for retry`);

    return res.status(200).json({
      success: true,
      jobId,
      message: 'Job queued for retry',
    });
  } catch (error) {
    console.error('Error retrying job:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retry job',
    });
  }
}