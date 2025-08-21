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
    if (!presentationId) return;

    // Load initial jobs
    getPresentationImageJobs(presentationId).then(jobs => {
      updateState(jobs);
    });

    // Subscribe to real-time updates
    const unsubscribe = subscribeToImageUpdates(presentationId, (jobs) => {
      updateState(jobs);
      
      // Trigger queue processing if there are pending jobs
      const hasPending = jobs.some(job => job.status === 'pending');
      if (hasPending) {
        triggerQueueProcessing();
      }
    });

    return () => unsubscribe();
  }, [presentationId]);

  const updateState = (jobs: ImageGenerationJob[]) => {
    const pendingCount = jobs.filter(j => j.status === 'pending').length;
    const processingCount = jobs.filter(j => j.status === 'processing').length;
    const completedCount = jobs.filter(j => j.status === 'completed').length;
    const failedCount = jobs.filter(j => j.status === 'failed').length;
    
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