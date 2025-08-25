import type { NextApiRequest, NextApiResponse } from 'next';
import { getPresentation } from '@/lib/firebase/presentations';
import { queuePresentationImages } from '@/lib/firebase/image-queue';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { presentationId, imageStyle = 'photorealistic' } = req.body;

  if (!presentationId) {
    return res.status(400).json({ error: 'presentationId is required' });
  }

  try {
    // Get the presentation
    const presentation = await getPresentation(presentationId);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    // Queue ALL image descriptions from ALL slides (4 per slide)
    const slides = presentation.slides || [];
    const imageRequests = [];
    
    for (const slide of slides) {
      // Skip title slide
      if (slide.type === 'title') continue;
      
      // Get ALL 4 image descriptions from the slide metadata
      const imageDescriptions = slide.imageDescriptions || [];
      
      // Queue all 4 images for this slide
      for (let i = 0; i < imageDescriptions.length; i++) {
        const request: any = {
          slideId: slide.id,
          imageIndex: i,
          description: imageDescriptions[i],
          style: imageStyle,
          priority: 1,
        };
        
        imageRequests.push(request);
        console.log(`Queuing image ${i + 1}/4 for slide ${slide.id}: ${imageDescriptions[i].substring(0, 50)}...`);
      }
      
      // Log what we're working with
      if (imageDescriptions.length === 4) {
        console.log(`✅ Slide ${slide.id}: Queuing all 4 image variants`);
      } else if (imageDescriptions.length > 0) {
        console.log(`📸 Slide ${slide.id}: Queuing ${imageDescriptions.length} images (target was 4)`);
      } else {
        console.warn(`⚠️ Slide ${slide.id}: No image descriptions found`);
      }
    }

    if (imageRequests.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: 'No images to generate',
        count: 0 
      });
    }

    // Queue the image generation jobs
    const jobIds = await queuePresentationImages(presentationId, imageRequests);
    
    // Queued image generation jobs for presentation
    
    // Start processing the queue - use a simple approach that works
    try {
      const { exec } = await import('child_process');
      const port = process.env.PORT || '3001';
      exec(`curl -X POST http://localhost:${port}/api/imagen/process-queue`, (error) => {
        if (error) {
          console.error('Failed to start queue processor via curl:', error);
        } else {
          // Queue processor started via curl
        }
      });
    } catch (err) {
      console.error('Failed to start queue processor:', err);
    }

    return res.status(200).json({
      success: true,
      message: `Queued ${jobIds.length} images for generation`,
      jobIds: jobIds,
      count: jobIds.length
    });
    
  } catch (error) {
    console.error('Error queueing images:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to queue images'
    });
  }
}