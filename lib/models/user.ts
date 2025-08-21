export interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  preferences?: UserPreferences;
  subscription?: SubscriptionTier;
  stats?: UserStats;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  defaultSlideType?: string;
  autoSave?: boolean;
  language?: string;
}

export interface UserStats {
  totalPresentations: number;
  totalSlides: number;
  totalViews?: number;
  storageUsed?: number;
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}