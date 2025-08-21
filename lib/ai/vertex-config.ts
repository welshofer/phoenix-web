import { initializeApp, getApps, getApp } from 'firebase/app';
import { getVertexAI, getGenerativeModel } from '@firebase/vertexai';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const vertexApp = getApps().find(app => app.name === 'vertex-ai-app') || 
  initializeApp(firebaseConfig, 'vertex-ai-app');

const vertexAI = getVertexAI(vertexApp);

export function getGenerativeModelInstance() {
  return getGenerativeModel(vertexAI, { 
    model: 'gemini-2.0-flash-001',
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 8192,
    }
  });
}