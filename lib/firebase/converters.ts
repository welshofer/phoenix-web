import {
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
  FirestoreDataConverter
} from 'firebase/firestore';
import { User } from '@/lib/models/user';
import { Presentation } from '@/lib/models/presentation';
import { Slide } from '@/lib/models/slide';

function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

export const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return {
      ...user,
      createdAt: dateToTimestamp(user.createdAt),
      lastLoginAt: dateToTimestamp(user.lastLoginAt)
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): User {
    const data = snapshot.data(options);
    return {
      ...data,
      uid: snapshot.id,
      createdAt: data.createdAt ? timestampToDate(data.createdAt) : new Date(),
      lastLoginAt: data.lastLoginAt ? timestampToDate(data.lastLoginAt) : new Date()
    } as User;
  }
};

export const presentationConverter: FirestoreDataConverter<Presentation> = {
  toFirestore(presentation: Presentation): DocumentData {
    const { id, ...data } = presentation;
    return {
      ...data,
      createdAt: dateToTimestamp(presentation.createdAt),
      updatedAt: dateToTimestamp(presentation.updatedAt),
      lastAccessedAt: presentation.lastAccessedAt 
        ? dateToTimestamp(presentation.lastAccessedAt) 
        : null
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Presentation {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      createdAt: data.createdAt ? timestampToDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? timestampToDate(data.updatedAt) : new Date(),
      lastAccessedAt: data.lastAccessedAt 
        ? timestampToDate(data.lastAccessedAt) 
        : undefined,
      collaborators: data.collaborators || [],
      slideCount: data.slideCount || 0
    } as Presentation;
  }
};

export const slideConverter: FirestoreDataConverter<Slide> = {
  toFirestore(slide: Slide): DocumentData {
    const { id, ...data } = slide;
    return {
      ...data,
      createdAt: dateToTimestamp(slide.createdAt),
      updatedAt: dateToTimestamp(slide.updatedAt)
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Slide {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      createdAt: data.createdAt ? timestampToDate(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? timestampToDate(data.updatedAt) : new Date(),
      imageAssets: data.imageAssets || []
    } as Slide;
  }
};