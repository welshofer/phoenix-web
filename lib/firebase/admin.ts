import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
function initializeAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // For Google Cloud environments (App Engine, Cloud Run, Cloud Functions)
  // The SDK will use Application Default Credentials automatically
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GAE_APPLICATION || process.env.FUNCTIONS_EMULATOR) {
    return initializeApp();
  }

  // For local development with service account
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      return initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (error) {
      console.error('Failed to parse service account key:', error);
    }
  }

  // For Vercel or other environments, use individual env vars
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  // Default initialization for Firebase/Google Cloud environments
  return initializeApp();
}

const adminApp = initializeAdmin();
export const auth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

// Helper function to verify ID tokens
export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
}

// Helper function to get user by UID
export async function getUser(uid: string) {
  try {
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Helper function to create custom token
export async function createCustomToken(uid: string, claims?: object) {
  try {
    const customToken = await auth.createCustomToken(uid, claims);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw error;
  }
}