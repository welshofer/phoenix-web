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
} from 'firebase/firestore';
import { db } from './config';
import { Slide } from '@/lib/models/slide';

export interface PresentationMetadata {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  userId: string;
  topic: string;
  slideCount: number;
  tone: string;
  goal: string;
  audience: string;
  style?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  lastViewedAt?: Timestamp | Date;
  isPublic?: boolean;
  tags?: string[];
  thumbnail?: string;
}

export interface PresentationSection {
  title: string;
  slides: any[]; // Using any for flexibility with AI-generated content
}

export interface PresentationDocument {
  metadata: PresentationMetadata;
  sections: PresentationSection[];
  slides?: Slide[]; // For converted slides
  settings?: {
    theme?: string;
    colorScheme?: string;
    fontFamily?: string;
    animations?: boolean;
  };
}

const PRESENTATIONS_COLLECTION = 'presentations';

/**
 * Save a new presentation to Firestore
 */
export async function savePresentation(
  presentation: Omit<PresentationDocument, 'metadata'> & {
    metadata: Omit<PresentationMetadata, 'id' | 'createdAt' | 'updatedAt'>
  }
): Promise<string> {
  try {
    const presentationId = doc(collection(db, PRESENTATIONS_COLLECTION)).id;
    
    const presentationDoc: PresentationDocument = {
      ...presentation,
      metadata: {
        ...presentation.metadata,
        id: presentationId,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      },
    };

    await setDoc(
      doc(db, PRESENTATIONS_COLLECTION, presentationId),
      presentationDoc
    );

    // Presentation saved successfully
    return presentationId;
  } catch (error) {
    console.error('Error saving presentation:', error);
    throw new Error('Failed to save presentation');
  }
}

/**
 * Get a presentation by ID
 */
export async function getPresentation(
  presentationId: string
): Promise<PresentationDocument | null> {
  try {
    const docRef = doc(db, PRESENTATIONS_COLLECTION, presentationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Update last viewed timestamp
      await updateDoc(docRef, {
        'metadata.lastViewedAt': serverTimestamp(),
      });
      
      return docSnap.data() as PresentationDocument;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting presentation:', error);
    throw new Error('Failed to load presentation');
  }
}

/**
 * Get all presentations for a user
 */
export async function getUserPresentations(
  userId: string,
  limitCount: number = 20
): Promise<PresentationDocument[]> {
  try {
    const q = query(
      collection(db, PRESENTATIONS_COLLECTION),
      where('metadata.userId', '==', userId),
      orderBy('metadata.createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const presentations: PresentationDocument[] = [];

    querySnapshot.forEach((doc) => {
      presentations.push(doc.data() as PresentationDocument);
    });

    return presentations;
  } catch (error) {
    console.error('Error getting user presentations:', error);
    // Return empty array if query fails (e.g., no index)
    return [];
  }
}

/**
 * Update presentation metadata
 */
export async function updatePresentationMetadata(
  presentationId: string,
  updates: Partial<PresentationMetadata>
): Promise<void> {
  try {
    const docRef = doc(db, PRESENTATIONS_COLLECTION, presentationId);
    
    const updateData: any = {
      'metadata.updatedAt': serverTimestamp(),
    };

    // Add metadata updates with proper nesting
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updateData[`metadata.${key}`] = value;
      }
    });

    await updateDoc(docRef, updateData);
    // Presentation metadata updated successfully
  } catch (error) {
    console.error('Error updating presentation metadata:', error);
    throw new Error('Failed to update presentation');
  }
}

/**
 * Update presentation slides
 */
export async function updatePresentationSlides(
  presentationId: string,
  slides: Slide[]
): Promise<void> {
  try {
    const docRef = doc(db, PRESENTATIONS_COLLECTION, presentationId);
    
    await updateDoc(docRef, {
      slides,
      'metadata.updatedAt': serverTimestamp(),
      'metadata.slideCount': slides.length,
    });

    // Presentation slides updated successfully
  } catch (error) {
    console.error('Error updating presentation slides:', error);
    throw new Error('Failed to update slides');
  }
}

/**
 * Update a single slide in a presentation
 */
export async function updateSlide(
  presentationId: string,
  slideIndex: number,
  slideUpdate: Partial<Slide>
): Promise<void> {
  try {
    const presentation = await getPresentation(presentationId);
    if (!presentation || !presentation.slides) {
      throw new Error('Presentation not found');
    }

    const updatedSlides = [...presentation.slides];
    updatedSlides[slideIndex] = {
      ...updatedSlides[slideIndex],
      ...slideUpdate,
      updatedAt: new Date(),
    };

    await updatePresentationSlides(presentationId, updatedSlides);
  } catch (error) {
    console.error('Error updating slide:', error);
    throw new Error('Failed to update slide');
  }
}

/**
 * Update image in a slide
 */
export async function updateSlideImage(
  presentationId: string,
  slideId: string,
  imageData: {
    src: string;
    objectId?: string; // Specific object ID to update
    imageIndex?: number; // Specific index for multi-image slides
    variants?: string[];
    heroIndex?: number;
    generatedAt?: Date;
    generationPrompt?: string;
  }
): Promise<void> {
  try {
    const presentation = await getPresentation(presentationId);
    if (!presentation || !presentation.slides) {
      throw new Error('Presentation not found');
    }

    const updatedSlides = presentation.slides.map((slide: any) => {
      if (slide.id === slideId) {
        // Find and update the specific image object in the slide
        let imageCounter = 0;
        const updatedObjects = slide.objects?.map((obj: any) => {
          if (obj.type !== 'image') {
            return obj;
          }
          
          const currentImageIndex = imageCounter++;
          
          // Match by either objectId or imageIndex for image objects
          const shouldUpdate = (
            (imageData.objectId && obj.id === imageData.objectId) ||
            (imageData.imageIndex !== undefined && currentImageIndex === imageData.imageIndex) ||
            // Fallback: if no objectId or imageIndex, update first empty image
            (!imageData.objectId && imageData.imageIndex === undefined && !obj.src)
          );

          if (shouldUpdate) {
            console.log(`✅ Updating image object ${obj.id} with new src:`, imageData.src.substring(0, 50) + '...');
            return {
              ...obj,
              src: imageData.src,
              variants: imageData.variants,
              heroIndex: imageData.heroIndex || 0,
              generatedAt: imageData.generatedAt,
              generationPrompt: imageData.generationPrompt,
            };
          }
          return obj;
        });

        return {
          ...slide,
          objects: updatedObjects,
          updatedAt: new Date(),
        };
      }
      return slide;
    });

    await updatePresentationSlides(presentationId, updatedSlides);
    // Updated slide with generated image
  } catch (error) {
    console.error('Error updating slide image:', error);
    throw new Error('Failed to update slide image');
  }
}

/**
 * Delete a presentation
 */
export async function deletePresentation(
  presentationId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, PRESENTATIONS_COLLECTION, presentationId));
    // Presentation deleted successfully
  } catch (error) {
    console.error('Error deleting presentation:', error);
    throw new Error('Failed to delete presentation');
  }
}

/**
 * Get recent presentations (public or user's own)
 */
export async function getRecentPresentations(
  userId?: string,
  limitCount: number = 10
): Promise<PresentationDocument[]> {
  try {
    let q;
    
    if (userId) {
      // Get user's recent presentations
      q = query(
        collection(db, PRESENTATIONS_COLLECTION),
        where('metadata.userId', '==', userId),
        orderBy('metadata.lastViewedAt', 'desc'),
        limit(limitCount)
      );
    } else {
      // Get public presentations
      q = query(
        collection(db, PRESENTATIONS_COLLECTION),
        where('metadata.isPublic', '==', true),
        orderBy('metadata.createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const presentations: PresentationDocument[] = [];

    querySnapshot.forEach((doc) => {
      presentations.push(doc.data() as PresentationDocument);
    });

    return presentations;
  } catch (error) {
    console.error('Error getting recent presentations:', error);
    return [];
  }
}

/**
 * Search presentations by title or tags
 */
export async function searchPresentations(
  userId: string,
  searchTerm: string
): Promise<PresentationDocument[]> {
  try {
    // Note: This is a simple implementation. 
    // For better search, consider using Algolia or Elasticsearch
    const q = query(
      collection(db, PRESENTATIONS_COLLECTION),
      where('metadata.userId', '==', userId),
      orderBy('metadata.createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const presentations: PresentationDocument[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as PresentationDocument;
      const searchLower = searchTerm.toLowerCase();
      
      // Search in title, topic, and tags
      if (
        data.metadata.title.toLowerCase().includes(searchLower) ||
        data.metadata.topic?.toLowerCase().includes(searchLower) ||
        data.metadata.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      ) {
        presentations.push(data);
      }
    });

    return presentations;
  } catch (error) {
    console.error('Error searching presentations:', error);
    return [];
  }
}

/**
 * Duplicate a presentation
 */
export async function duplicatePresentation(
  presentationId: string,
  newTitle: string,
  userId: string
): Promise<string> {
  try {
    const original = await getPresentation(presentationId);
    if (!original) {
      throw new Error('Original presentation not found');
    }

    const duplicate = {
      ...original,
      metadata: {
        ...original.metadata,
        title: newTitle,
        userId,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        lastViewedAt: undefined,
      },
    };

    return await savePresentation(duplicate);
  } catch (error) {
    console.error('Error duplicating presentation:', error);
    throw new Error('Failed to duplicate presentation');
  }
}