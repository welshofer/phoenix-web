import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from './config';
import {
  getUserDoc,
  getUserPresentationsCollection,
  getUserPresentationDoc,
  getPresentationSlidesCollection,
  getPresentationSlideDoc
} from './collections';
import { User } from '@/lib/models/user';
import { Presentation } from '@/lib/models/presentation';
import { Slide, SlideType } from '@/lib/models/slide';

// User operations
export async function createUserProfile(user: User): Promise<void> {
  const userRef = getUserDoc(user.uid);
  await setDoc(userRef, {
    ...user,
    createdAt: new Date(),
    lastLoginAt: new Date(),
    preferences: user.preferences || {},
    stats: {
      totalPresentations: 0,
      totalSlides: 0,
      totalViews: 0,
      storageUsed: 0
    }
  });
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
): Promise<void> {
  const userRef = getUserDoc(userId);
  await updateDoc(userRef, {
    ...updates,
    lastLoginAt: serverTimestamp()
  });
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const userRef = getUserDoc(userId);
  const snapshot = await getDoc(userRef);
  return snapshot.exists() ? snapshot.data() : null;
}

// Presentation operations
export async function createPresentation(
  userId: string,
  title: string,
  description?: string
): Promise<string> {
  const presentationsRef = getUserPresentationsCollection(userId);
  const newPresentation: Omit<Presentation, 'id'> = {
    title,
    description,
    owner: userId,
    collaborators: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    slideCount: 0,
    settings: {
      theme: 'default',
      aspectRatio: '16:9',
      transitionEffect: 'fade',
      showSlideNumbers: true
    },
    isPublic: false,
    tags: []
  };
  
  const docRef = await addDoc(presentationsRef, newPresentation);
  
  // Update user stats
  const userRef = getUserDoc(userId);
  await updateDoc(userRef, {
    'stats.totalPresentations': increment(1)
  });
  
  // Create a default title slide
  await createSlide(userId, docRef.id, {
    type: SlideType.TITLE,
    content: {
      heading: title,
      subheading: description || 'Click to edit subtitle'
    },
    order: 0
  });
  
  return docRef.id;
}

export async function getUserPresentations(userId: string): Promise<Presentation[]> {
  const presentationsRef = getUserPresentationsCollection(userId);
  const q = query(presentationsRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

export async function getPresentation(
  userId: string,
  presentationId: string
): Promise<Presentation | null> {
  const presentationRef = getUserPresentationDoc(userId, presentationId);
  const snapshot = await getDoc(presentationRef);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function updatePresentation(
  userId: string,
  presentationId: string,
  updates: Partial<Presentation>
): Promise<void> {
  const presentationRef = getUserPresentationDoc(userId, presentationId);
  await updateDoc(presentationRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deletePresentation(
  userId: string,
  presentationId: string
): Promise<void> {
  const batch = writeBatch(db);
  
  // Delete all slides
  const slidesRef = getPresentationSlidesCollection(userId, presentationId);
  const slidesSnapshot = await getDocs(slidesRef);
  slidesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // Delete presentation
  const presentationRef = getUserPresentationDoc(userId, presentationId);
  batch.delete(presentationRef);
  
  // Update user stats
  const userRef = getUserDoc(userId);
  batch.update(userRef, {
    'stats.totalPresentations': increment(-1),
    'stats.totalSlides': increment(-slidesSnapshot.size)
  });
  
  await batch.commit();
}

// Slide operations
export async function createSlide(
  userId: string,
  presentationId: string,
  slideData: Omit<Slide, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const slidesRef = getPresentationSlidesCollection(userId, presentationId);
  const newSlide = {
    ...slideData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const docRef = await addDoc(slidesRef, newSlide);
  
  // Update presentation slide count
  const presentationRef = getUserPresentationDoc(userId, presentationId);
  await updateDoc(presentationRef, {
    slideCount: increment(1),
    updatedAt: serverTimestamp()
  });
  
  // Update user stats
  const userRef = getUserDoc(userId);
  await updateDoc(userRef, {
    'stats.totalSlides': increment(1)
  });
  
  return docRef.id;
}

export async function getPresentationSlides(
  userId: string,
  presentationId: string
): Promise<Slide[]> {
  const slidesRef = getPresentationSlidesCollection(userId, presentationId);
  const q = query(slidesRef, orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

export async function updateSlide(
  userId: string,
  presentationId: string,
  slideId: string,
  updates: Partial<Slide>
): Promise<void> {
  const slideRef = getPresentationSlideDoc(userId, presentationId, slideId);
  await updateDoc(slideRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
  
  // Update presentation's updatedAt
  const presentationRef = getUserPresentationDoc(userId, presentationId);
  await updateDoc(presentationRef, {
    updatedAt: serverTimestamp()
  });
}

export async function deleteSlide(
  userId: string,
  presentationId: string,
  slideId: string
): Promise<void> {
  const batch = writeBatch(db);
  
  // Delete slide
  const slideRef = getPresentationSlideDoc(userId, presentationId, slideId);
  batch.delete(slideRef);
  
  // Update presentation slide count
  const presentationRef = getUserPresentationDoc(userId, presentationId);
  batch.update(presentationRef, {
    slideCount: increment(-1),
    updatedAt: serverTimestamp()
  });
  
  // Update user stats
  const userRef = getUserDoc(userId);
  batch.update(userRef, {
    'stats.totalSlides': increment(-1)
  });
  
  await batch.commit();
}

export async function reorderSlides(
  userId: string,
  presentationId: string,
  slideOrders: { slideId: string; newOrder: number }[]
): Promise<void> {
  const batch = writeBatch(db);
  
  slideOrders.forEach(({ slideId, newOrder }) => {
    const slideRef = getPresentationSlideDoc(userId, presentationId, slideId);
    batch.update(slideRef, {
      order: newOrder,
      updatedAt: serverTimestamp()
    });
  });
  
  // Update presentation's updatedAt
  const presentationRef = getUserPresentationDoc(userId, presentationId);
  batch.update(presentationRef, {
    updatedAt: serverTimestamp()
  });
  
  await batch.commit();
}