import { collection, CollectionReference, doc, DocumentReference } from 'firebase/firestore';
import { db } from './config';
import { User } from '@/lib/models/user';
import { Presentation } from '@/lib/models/presentation';
import { Slide } from '@/lib/models/slide';
import { userConverter, presentationConverter, slideConverter } from './converters';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  PRESENTATIONS: 'presentations',
  SLIDES: 'slides'
} as const;

// Typed collection references
export function getUsersCollection(): CollectionReference<User> {
  return collection(db, COLLECTIONS.USERS).withConverter(userConverter);
}

export function getUserDoc(userId: string): DocumentReference<User> {
  return doc(db, COLLECTIONS.USERS, userId).withConverter(userConverter);
}

export function getUserPresentationsCollection(userId: string): CollectionReference<Presentation> {
  return collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PRESENTATIONS)
    .withConverter(presentationConverter);
}

export function getUserPresentationDoc(
  userId: string, 
  presentationId: string
): DocumentReference<Presentation> {
  return doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PRESENTATIONS, presentationId)
    .withConverter(presentationConverter);
}

export function getPresentationSlidesCollection(
  userId: string,
  presentationId: string
): CollectionReference<Slide> {
  return collection(
    db, 
    COLLECTIONS.USERS, 
    userId, 
    COLLECTIONS.PRESENTATIONS, 
    presentationId, 
    COLLECTIONS.SLIDES
  ).withConverter(slideConverter);
}

export function getPresentationSlideDoc(
  userId: string,
  presentationId: string,
  slideId: string
): DocumentReference<Slide> {
  return doc(
    db,
    COLLECTIONS.USERS,
    userId,
    COLLECTIONS.PRESENTATIONS,
    presentationId,
    COLLECTIONS.SLIDES,
    slideId
  ).withConverter(slideConverter);
}