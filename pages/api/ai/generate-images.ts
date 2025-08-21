import type { NextApiRequest, NextApiResponse } from 'next';
import {
  queueImageGeneration,
  getImageGenerationStatus,
  cancelImageGeneration,
} from '@/lib/server/imagen';
import { ImageStyle, IMAGE_STYLES, ImagePriority } from '@/lib/constants/image-styles';

/**
 * API endpoint for async image generation with Imagen 4.0
 * Matches the macOS implementation
 */

interface GenerateImagesRequest {
  presentationId: string;
  userId: string;
  images: Array<{
    slideId: string;
    description: string;
    style?: ImageStyle;
    priority?: ImagePriority;
  }>;
}

interface GenerateImagesResponse {
  success: boolean;
  requestIds?: string[];
  error?: string;
}

interface StatusRequest {
  presentationId: string;
}

interface StatusResponse {
  success: boolean;
  status?: {
    total: number;
    completed: number;
    processing: number;
    failed: number;
    queued: number;
    percentComplete: number;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle different methods
  switch (req.method) {
    case 'POST':
      return handleGenerateImages(req, res);
    case 'GET':
      return handleGetStatus(req, res);
    case 'DELETE':
      return handleCancelGeneration(req, res);
    default:
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
  }
}

/**
 * Handle POST - Queue image generation requests
 */
async function handleGenerateImages(
  req: NextApiRequest,
  res: NextApiResponse<GenerateImagesResponse>
) {
  try {
    const { presentationId, userId, images } = req.body as GenerateImagesRequest;
    
    if (!presentationId || !userId || !images || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }
    
    // Queue all image generation requests
    const requestIds = await Promise.all(
      images.map(async (image) => {
        return await queueImageGeneration(
          presentationId,
          image.slideId,
          userId,
          image.description,
          image.style,
          image.priority || ImagePriority.NORMAL
        );
      })
    );
    
    return res.status(200).json({
      success: true,
      requestIds,
    });
    
  } catch (error) {
    console.error('Error queueing image generation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to queue image generation',
    });
  }
}

/**
 * Handle GET - Get generation status
 */
async function handleGetStatus(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  try {
    const { presentationId } = req.query as { presentationId: string };
    
    if (!presentationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing presentation ID',
      });
    }
    
    const status = await getImageGenerationStatus(presentationId);
    
    return res.status(200).json({
      success: true,
      status: {
        ...status,
        percentComplete: status.total > 0 
          ? Math.round((status.completed / status.total) * 100)
          : 0,
      },
    });
    
  } catch (error) {
    console.error('Error getting status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get generation status',
    });
  }
}

/**
 * Handle DELETE - Cancel pending generations
 */
async function handleCancelGeneration(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { presentationId } = req.query as { presentationId: string };
    
    if (!presentationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing presentation ID',
      });
    }
    
    await cancelImageGeneration(presentationId);
    
    return res.status(200).json({
      success: true,
      message: 'Pending image generations cancelled',
    });
    
  } catch (error) {
    console.error('Error cancelling generation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel generation',
    });
  }
}

// Export available styles for client
export async function getAvailableStyles(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const styles = Object.keys(IMAGE_STYLES).map(key => ({
    id: key,
    name: key.replace(/([A-Z])/g, ' $1').trim(),
    prompt: IMAGE_STYLES[key as ImageStyle],
  }));
  
  return res.status(200).json({
    success: true,
    styles,
  });
}