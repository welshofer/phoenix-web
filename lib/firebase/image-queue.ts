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
    
    const jobDoc: ImageGenerationJob = {
      ...job,
      id: jobId,
      status: 'pending',
      createdAt: serverTimestamp() as Timestamp,
      retryCount: 0,
    };

    await setDoc(doc(db, IMAGE_QUEUE_COLLECTION, jobId), jobDoc);
    
    console.log('Image generation job queued:', jobId);
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
    description: string;
    style: string;
    priority?: number;
  }>
): Promise<string[]> {
  const jobIds: string[] = [];
  
  for (const image of images) {
    const jobId = await queueImageGeneration({
      presentationId,
      slideId: image.slideId,
      description: image.description,
      style: image.style,
      priority: image.priority || 1,
    });
    jobIds.push(jobId);
  }
  
  return jobIds;
}

/**
 * Get next pending job from queue
 */
export async function getNextPendingJob(): Promise<ImageGenerationJob | null> {
  try {
    const q = query(
      collection(db, IMAGE_QUEUE_COLLECTION),
      where('status', '==', 'pending'),
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'asc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { ...doc.data(), id: doc.id } as ImageGenerationJob;
  } catch (error) {
    console.error('Error getting next job:', error);
    return null;
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
  const q = query(
    collection(db, IMAGE_QUEUE_COLLECTION),
    where('presentationId', '==', presentationId)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const jobs: ImageGenerationJob[] = [];
    snapshot.forEach((doc) => {
      jobs.push({ ...doc.data(), id: doc.id } as ImageGenerationJob);
    });
    onUpdate(jobs);
  });
  
  return unsubscribe;
}

/**
 * Get all jobs for a presentation
 */
export async function getPresentationImageJobs(
  presentationId: string
): Promise<ImageGenerationJob[]> {
  try {
    const q = query(
      collection(db, IMAGE_QUEUE_COLLECTION),
      where('presentationId', '==', presentationId),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const jobs: ImageGenerationJob[] = [];
    
    snapshot.forEach((doc) => {
      jobs.push({ ...doc.data(), id: doc.id } as ImageGenerationJob);
    });
    
    return jobs;
  } catch (error) {
    console.error('Error getting presentation jobs:', error);
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
    
    console.log(`Cleaned up ${deletedCount} old image generation jobs`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old jobs:', error);
    return 0;
  }
}