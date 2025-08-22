import { Timestamp } from 'firebase/firestore';

export interface Presentation {
  id: string;
  title: string;
  description?: string;
  owner: string;
  collaborators?: string[];
  createdAt: Date;
  updatedAt: Date;
  slideCount: number;
  lastAccessedAt?: Date;
  settings?: PresentationSettings;
  thumbnail?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface PresentationSettings {
  theme?: string;
  typographySetId?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1';
  transitionEffect?: 'none' | 'fade' | 'slide';
  autoPlayDuration?: number;
  showSlideNumbers?: boolean;
  allowComments?: boolean;
}