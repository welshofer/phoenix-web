import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize admin app if not already initialized
if (!getApps().length) {
  // Use application default credentials (from gcloud auth)
  initializeApp({
    credential: applicationDefault(),
    projectId: 'phoenix-web-app',
  });
}

// Export the admin Firestore instance
export const adminDb = getFirestore();