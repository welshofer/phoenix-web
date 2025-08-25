import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';

export interface ImageGenerationJob {
  id: string;
  presentationId: string;
  slideId: string;
  objectId?: string; // ID of the specific image object in the slide
  imageIndex?: number; // Index of the image object (for THREE_IMAGES)
  description: string;
  style: string;
  fullPrompt?: string; // Complete prompt sent to Imagen (description + style)
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  imageUrls?: string[]; // Array of variant URLs
  heroIndex?: number; // Which variant is the hero
  error?: string;
  createdAt: Timestamp | Date;
  startedAt?: Timestamp | Date;
  completedAt?: Timestamp | Date;
  retryCount?: number;
}

const IMAGE_QUEUE_COLLECTION = 'imageGenerationQueue';

/**
 * Queue an image generation job
 */
export async function queueImageGeneration(
  job: Omit<ImageGenerationJob, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  try {
    const jobId = doc(collection(db, IMAGE_QUEUE_COLLECTION)).id;
    
    // Clean up undefined fields to avoid Firestore errors
    const cleanJob = { ...job };
    if (cleanJob.objectId === undefined) delete cleanJob.objectId;
    if (cleanJob.imageIndex === undefined) delete cleanJob.imageIndex;
    
    const jobDoc: ImageGenerationJob = {
      ...cleanJob,
      id: jobId,
      status: 'pending',
      createdAt: serverTimestamp() as Timestamp,
      retryCount: 0,
    };

    await setDoc(doc(db, IMAGE_QUEUE_COLLECTION, jobId), jobDoc);
    
    // Image generation job queued successfully
    return jobId;
  } catch (error) {
    console.error('Error queuing image generation:', error);
    throw new Error('Failed to queue image generation');
  }
}

/**
 * Queue multiple image generation jobs for a presentation
 */
export async function queuePresentationImages(
  presentationId: string,
  images: Array<{
    slideId: string;
    objectId?: string;
    imageIndex?: number;
    description: string;
    style: string;
    priority?: number;
  }>
): Promise<string[]> {
  // Queueing presentation images
  const jobIds: string[] = [];
  
  for (const image of images) {
    // Queueing image for slide
    const jobId = await queueImageGeneration({
      presentationId,
      slideId: image.slideId,
      objectId: image.objectId,
      imageIndex: image.imageIndex,
      description: image.description,
      style: image.style,
      priority: image.priority || 1,
    });
    jobIds.push(jobId);
  }
  
  // Jobs queued successfully
  return jobIds;
}

/**
 * Get next pending job from queue
 */
export async function getNextPendingJob(): Promise<ImageGenerationJob | null> {
  try {
    // Simplified query - just get pending jobs ordered by creation time
    const q = query(
      collection(db, IMAGE_QUEUE_COLLECTION),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // No pending jobs found in queue
      return null;
    }
    
    const doc = snapshot.docs[0];
    // Found pending job
    return { ...doc.data(), id: doc.id } as ImageGenerationJob;
  } catch (error) {
    console.error('Error getting next job - likely missing index:', error);
    
    // Fallback: Try without ordering if index is missing
    try {
      const fallbackQuery = query(
        collection(db, IMAGE_QUEUE_COLLECTION),
        where('status', '==', 'pending'),
        limit(1)
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      
      if (fallbackSnapshot.empty) {
        // No pending jobs found (fallback query)
        return null;
      }
      
      const doc = fallbackSnapshot.docs[0];
      // Found pending job (fallback)
      return { ...doc.data(), id: doc.id } as ImageGenerationJob;
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      return null;
    }
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string,
  status: ImageGenerationJob['status'],
  updates?: Partial<ImageGenerationJob>
): Promise<void> {
  try {
    const updateData: any = {
      status,
      ...updates,
    };
    
    if (status === 'processing') {
      updateData.startedAt = serverTimestamp();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completedAt = serverTimestamp();
    }
    
    await updateDoc(doc(db, IMAGE_QUEUE_COLLECTION, jobId), updateData);
  } catch (error) {
    console.error('Error updating job status:', error);
    throw new Error('Failed to update job status');
  }
}

/**
 * Listen to image generation updates for a presentation
 */
export function subscribeToImageUpdates(
  presentationId: string,
  onUpdate: (jobs: ImageGenerationJob[]) => void
): () => void {
  // Setting up image updates subscription
  
  const q = query(
    collection(db, IMAGE_QUEUE_COLLECTION),
    where('presentationId', '==', presentationId)
  );
  
  const unsubscribe = onSnapshot(q, 
    (snapshot) => {
      // Image updates snapshot received
      const jobs: ImageGenerationJob[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Job status update received
        jobs.push({ ...data, id: doc.id } as ImageGenerationJob);
      });
      // Calling onUpdate with jobs
      onUpdate(jobs);
    },
    (error) => {
      console.error('Firestore subscription error:', error);
    }
  );
  
  return unsubscribe;
}

/**
 * Get all jobs for a presentation
 */
export async function getPresentationImageJobs(
  presentationId: string
): Promise<ImageGenerationJob[]> {
  try {
    console.log('Fetching image jobs for presentation:', presentationId);
    
    // Simple query without orderBy to avoid index issues
    const q = query(
      collection(db, IMAGE_QUEUE_COLLECTION),
      where('presentationId', '==', presentationId)
    );
    
    const snapshot = await getDocs(q);
    const jobs: ImageGenerationJob[] = [];
    
    snapshot.forEach((doc) => {
      jobs.push({ ...doc.data(), id: doc.id } as ImageGenerationJob);
    });
    
    console.log(`Found ${jobs.length} image jobs for presentation ${presentationId}`);
    return jobs;
  } catch (error) {
    console.error('getPresentationImageJobs error:', error);
    return [];
  }
}

/**
 * Clean up old completed/failed jobs
 */
export async function cleanupOldJobs(daysOld: number = 7): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const q = query(
      collection(db, IMAGE_QUEUE_COLLECTION),
      where('status', 'in', ['completed', 'failed']),
      where('completedAt', '<', cutoffDate)
    );
    
    const snapshot = await getDocs(q);
    let deletedCount = 0;
    
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
      deletedCount++;
    }
    
    // Cleaned up old image generation jobs
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old jobs:', error);
    return 0;
  }
}