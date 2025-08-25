import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Presentation } from '@/lib/models/presentation';
import { resilientFirestore } from '@/lib/firebase/error-recovery';
import { presentationCache } from '@/lib/cache/redis';
import { 
  getPresentations, 
  getPresentation, 
  createPresentation, 
  updatePresentation, 
  deletePresentation 
} from '@/lib/firebase/presentations';

// Query keys
const QUERY_KEYS = {
  all: ['presentations'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (userId: string) => [...QUERY_KEYS.lists(), userId] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
};

// Fetch all presentations for a user
export function usePresentations(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.list(userId),
    queryFn: async () => {
      // Try cache first
      const cacheKey = `presentations:${userId}`;
      const cached = await presentationCache.get(cacheKey);
      if (cached) {
        return cached as Presentation[];
      }

      // Fetch from database with error recovery
      const presentations = await getPresentations(userId);
      
      // Cache the result
      await presentationCache.set(cacheKey, presentations, 300); // 5 minutes
      
      return presentations;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch a single presentation
export function usePresentation(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: async () => {
      if (!id) throw new Error('No presentation ID');
      
      // Try cache first
      const cached = await presentationCache.get(id);
      if (cached) {
        return cached as Presentation;
      }

      // Fetch from database
      const presentation = await getPresentation(id);
      
      // Cache the result
      if (presentation) {
        await presentationCache.set(id, presentation);
      }
      
      return presentation;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Create presentation mutation
export function useCreatePresentation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPresentation,
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      
      // Update cache
      if (data.id) {
        queryClient.setQueryData(QUERY_KEYS.detail(data.id), data);
        presentationCache.set(data.id, data);
      }
    },
  });
}

// Update presentation mutation
export function useUpdatePresentation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Presentation> }) =>
      updatePresentation(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.detail(id) });
      
      // Snapshot the previous value
      const previousPresentation = queryClient.getQueryData(QUERY_KEYS.detail(id));
      
      // Optimistically update
      queryClient.setQueryData(QUERY_KEYS.detail(id), (old: any) => ({
        ...old,
        ...updates,
      }));
      
      return { previousPresentation };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousPresentation) {
        queryClient.setQueryData(QUERY_KEYS.detail(id), context.previousPresentation);
      }
    },
    onSuccess: (_data, { id }) => {
      // Invalidate cache
      presentationCache.invalidate(id);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

// Delete presentation mutation
export function useDeletePresentation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deletePresentation,
    onSuccess: (_data, id) => {
      // Remove from cache
      presentationCache.invalidate(id);
      queryClient.removeQueries({ queryKey: QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

// Prefetch presentation
export async function prefetchPresentation(queryClient: QueryClient, id: string) {
  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: async () => {
      const cached = await presentationCache.get(id);
      if (cached) return cached;
      
      const presentation = await getPresentation(id);
      if (presentation) {
        await presentationCache.set(id, presentation);
      }
      return presentation;
    },
    staleTime: 5 * 60 * 1000,
  });
}