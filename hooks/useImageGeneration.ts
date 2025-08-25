import { useState, useEffect } from 'react';
import { 
  subscribeToImageUpdates, 
  ImageGenerationJob,
  getPresentationImageJobs 
} from '@/lib/firebase/image-queue';

export interface ImageGenerationState {
  jobs: ImageGenerationJob[];
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  isGenerating: boolean;
}

export function useImageGeneration(presentationId: string | null) {
  const [state, setState] = useState<ImageGenerationState>({
    jobs: [],
    pendingCount: 0,
    processingCount: 0,
    completedCount: 0,
    failedCount: 0,
    isGenerating: false,
  });

  useEffect(() => {
    if (!presentationId) {
      // No presentationId provided
      return;
    }

    // Setting up image generation for presentation

    // Load initial jobs
    console.log('useImageGeneration: Loading jobs for presentation:', presentationId);
    getPresentationImageJobs(presentationId).then(jobs => {
      console.log('useImageGeneration: Initial jobs loaded:', jobs.length);
      updateState(jobs);
    }).catch(error => {
      console.error('useImageGeneration: Error loading initial jobs:', error);
    });

    // Subscribe to real-time updates
    const unsubscribe = subscribeToImageUpdates(presentationId, (jobs) => {
      // Real-time update received
      updateState(jobs);
      // Removed automatic queue triggering - let ImageGenerationProgress handle it
    });

    return () => {
      // Cleaning up subscription
      unsubscribe();
    };
  }, [presentationId]);

  const updateState = (jobs: ImageGenerationJob[]) => {
    const pendingCount = jobs.filter(j => j.status === 'pending').length;
    const processingCount = jobs.filter(j => j.status === 'processing').length;
    const completedCount = jobs.filter(j => j.status === 'completed').length;
    const failedCount = jobs.filter(j => j.status === 'failed').length;
    
    // Image generation state updated
    
    setState({
      jobs,
      pendingCount,
      processingCount,
      completedCount,
      failedCount,
      isGenerating: pendingCount > 0 || processingCount > 0,
    });
  };

  const triggerQueueProcessing = async () => {
    try {
      await fetch('/api/imagen/process-queue', { method: 'POST' });
    } catch (error) {
      console.error('Failed to trigger queue processing:', error);
    }
  };

  const getJobForSlide = (slideId: string): ImageGenerationJob | undefined => {
    return state.jobs.find(job => job.slideId === slideId);
  };

  const getCompletedImages = (): Map<string, string[]> => {
    const imageMap = new Map<string, string[]>();
    
    state.jobs
      .filter(job => job.status === 'completed' && job.imageUrls)
      .forEach(job => {
        imageMap.set(job.slideId, job.imageUrls!);
      });
    
    return imageMap;
  };

  return {
    ...state,
    getJobForSlide,
    getCompletedImages,
    triggerQueueProcessing,
  };
}