import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { Slide } from '@/lib/models/slide';
import { Presentation } from '@/lib/models/presentation';
import { createPresentation, updatePresentation } from '@/lib/firebase/database';

/**
 * Hook for AI-powered presentation generation
 */

interface GeneratePresentationOptions {
  topic: string;
  slideCount?: number;
  style?: 'professional' | 'creative' | 'educational';
}

interface GenerateImageOptions {
  prompt: string;
  style?: 'professional' | 'creative' | 'minimal' | 'technical';
  aspectRatio?: '16:9' | '4:3' | '1:1';
  presentationId?: string;
  slideId?: string;
}

interface AIError {
  message: string;
  code?: string;
  details?: any;
}

interface AIUsage {
  slidesRemaining?: number;
  imagesRemaining?: number;
  requestsRemaining?: number;
}

export function useAI() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIError | null>(null);
  const [usage, setUsage] = useState<AIUsage>({});

  /**
   * Generate a complete presentation
   */
  const generatePresentation = useCallback(async (
    options: GeneratePresentationOptions
  ): Promise<{ presentation: Presentation; slides: Slide[] } | null> => {
    if (!user) {
      setError({ message: 'Authentication required', code: 'AUTH_REQUIRED' });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Get Firebase auth token
      const idToken = await user.getIdToken();

      // Call API endpoint
      const response = await fetch('/api/ai/generate-presentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...options,
          userId: user.uid,
          idToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate presentation');
      }

      // Update usage stats
      if (result.usage) {
        setUsage(result.usage);
      }

      // Create presentation in Firestore
      const presentationId = await createPresentation(
        user.uid,
        result.data.title,
        result.data.subtitle || `Generated presentation about ${options.topic}`
      );

      // Save slides to Firestore
      // In a real app, you'd save these slides to the database
      const slides = result.data.slides;

      // Update presentation with metadata
      await updatePresentation(user.uid, presentationId, {
        metadata: result.data.metadata,
        slideCount: slides.length,
      } as any);

      return {
        presentation: {
          id: presentationId,
          title: result.data.title,
          description: result.data.subtitle,
          owner: user.uid,
          collaborators: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          slideCount: slides.length,
        } as Presentation,
        slides,
      };
    } catch (err) {
      const error = err as Error;
      setError({
        message: error.message,
        code: 'GENERATION_FAILED',
        details: error,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Generate an image for a slide
   */
  const generateImage = useCallback(async (
    options: GenerateImageOptions
  ): Promise<string | null> => {
    if (!user) {
      setError({ message: 'Authentication required', code: 'AUTH_REQUIRED' });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...options,
          userId: user.uid,
          idToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate image');
      }

      // Update usage stats
      if (result.usage) {
        setUsage(prev => ({ ...prev, ...result.usage }));
      }

      return result.data.url;
    } catch (err) {
      const error = err as Error;
      setError({
        message: error.message,
        code: 'IMAGE_GENERATION_FAILED',
        details: error,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Generate placeholder image URL
   */
  const getPlaceholderImage = useCallback((
    text: string,
    options?: {
      width?: number;
      height?: number;
      bg?: string;
      color?: string;
    }
  ): string => {
    const params = new URLSearchParams({
      text,
      width: (options?.width || 1920).toString(),
      height: (options?.height || 1080).toString(),
      bg: options?.bg || '667eea',
      color: options?.color || 'ffffff',
    });

    return `/api/images/placeholder?${params.toString()}`;
  }, []);

  /**
   * Check usage limits
   */
  const checkUsage = useCallback(async (): Promise<AIUsage | null> => {
    if (!user) return null;

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/ai/usage', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage');
      }

      const data = await response.json();
      setUsage(data);
      return data;
    } catch (err) {
      console.error('Failed to check usage:', err);
      return null;
    }
  }, [user]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    usage,
    
    // Actions
    generatePresentation,
    generateImage,
    getPlaceholderImage,
    checkUsage,
    clearError,
    
    // Helpers
    isAuthenticated: !!user,
    canGenerate: usage.requestsRemaining ? usage.requestsRemaining > 0 : true,
    canGenerateSlides: usage.slidesRemaining ? usage.slidesRemaining > 0 : true,
    canGenerateImages: usage.imagesRemaining ? usage.imagesRemaining > 0 : true,
  };
}