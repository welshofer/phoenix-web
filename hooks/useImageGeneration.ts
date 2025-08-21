import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  QuerySnapshot,
  DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ImageStyle } from '@/lib/constants/image-styles';

export interface ImageGenerationStatus {
  total: number;
  completed: number;
  processing: number;
  failed: number;
  queued: number;
  percentComplete: number;
}

export interface ImageRequest {
  slideId: string;
  description: string;
  style?: ImageStyle;
  priority?: number;
}

export interface GeneratedImage {
  slideId: string;
  imageUrl: string;
  status: 'completed' | 'processing' | 'queued' | 'failed';
  error?: string;
}

export function useImageGeneration(presentationId: string | null) {
  const [status, setStatus] = useState<ImageGenerationStatus>({
    total: 0,
    completed: 0,
    processing: 0,
    failed: 0,
    queued: 0,
    percentComplete: 0,
  });
  
  const [images, setImages] = useState<Map<string, GeneratedImage>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates for image generation
  useEffect(() => {
    if (!presentationId) return;

    const q = query(
      collection(db, 'imageRequests'),
      where('presentationId', '==', presentationId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const newImages = new Map<string, GeneratedImage>();
        let completed = 0;
        let processing = 0;
        let failed = 0;
        let queued = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const image: GeneratedImage = {
            slideId: data.slideId,
            imageUrl: data.imageUrl || '',
            status: data.status,
            error: data.error,
          };
          
          newImages.set(data.slideId, image);

          switch (data.status) {
            case 'completed': completed++; break;
            case 'processing': processing++; break;
            case 'failed': failed++; break;
            case 'queued': queued++; break;
          }
        });

        setImages(newImages);
        
        const total = snapshot.size;
        setStatus({
          total,
          completed,
          processing,
          failed,
          queued,
          percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
        });
      },
      (error) => {
        console.error('Error listening to image generation:', error);
        setError('Failed to track image generation');
      }
    );

    return () => unsubscribe();
  }, [presentationId]);

  // Generate images for a presentation
  const generateImages = useCallback(async (
    userId: string,
    requests: ImageRequest[]
  ) => {
    if (!presentationId) {
      setError('No presentation ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentationId,
          userId,
          images: requests,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate images');
      }

      return data.requestIds;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate images';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [presentationId]);

  // Cancel pending image generations
  const cancelGeneration = useCallback(async () => {
    if (!presentationId) return;

    try {
      const response = await fetch(`/api/ai/generate-images?presentationId=${presentationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel generation');
      }
    } catch (err) {
      console.error('Error cancelling generation:', err);
      setError('Failed to cancel generation');
    }
  }, [presentationId]);

  // Get image for a specific slide
  const getImageForSlide = useCallback((slideId: string): GeneratedImage | undefined => {
    return images.get(slideId);
  }, [images]);

  return {
    status,
    images,
    loading,
    error,
    generateImages,
    cancelGeneration,
    getImageForSlide,
    isGenerating: status.processing > 0 || status.queued > 0,
  };
}