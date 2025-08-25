import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Initialize admin app if not already initialized
if (!getApps().length) {
  // Use application default credentials (from gcloud auth)
  initializeApp({
    credential: applicationDefault(),
    projectId: 'phoenix-web-app',
    storageBucket: 'phoenix-web-app-images',  // Actual GCS bucket that exists
  });
}

const storage = getStorage();
// Use the actual bucket that exists in GCS
const bucket = storage.bucket('phoenix-web-app-images');

/**
 * Upload base64 image to Firebase Storage from server-side
 * @param base64String - The base64 encoded image string
 * @param path - The storage path (e.g., 'presentations/123/slides/456/image.png')
 * @returns The public URL of the uploaded image
 */
export async function uploadBase64ImageServer(
  base64String: string,
  path: string
): Promise<string> {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64String, 'base64');
    
    // Get a reference to the file
    const file = bucket.file(path);
    
    // Upload the buffer
    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000',
      },
      // Don't use public: true with uniform bucket-level access
      validation: false,
    });
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
    
    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading image to storage:', error);
    console.error('Error details:', error.message, error.code);
    throw new Error(`Failed to upload image: ${error.message || error}`);
  }
}

/**
 * Upload multiple base64 images to Firebase Storage from server-side
 * @param images - Array of base64 strings
 * @param basePath - Base storage path
 * @returns Array of public URLs
 */
export async function uploadMultipleImagesServer(
  images: string[],
  basePath: string
): Promise<string[]> {
  const uploadPromises = images.map((base64, index) => {
    const path = `${basePath}/variant_${index}.png`;
    return uploadBase64ImageServer(base64, path);
  });
  
  return Promise.all(uploadPromises);
}

/**
 * Upload audio file to Firebase Storage
 * @param base64Audio - Base64 encoded audio
 * @param path - Storage path for the audio file
 * @returns Public URL of the uploaded audio
 */
export async function uploadAudioToStorage(
  base64Audio: string,
  path: string
): Promise<string> {
  try {
    const buffer = Buffer.from(base64Audio, 'base64');
    const file = bucket.file(path);
    
    await file.save(buffer, {
      metadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000',
      },
      validation: false,
    });
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading audio:', error);
    throw new Error(`Failed to upload audio: ${error.message || error}`);
  }
}

/**
 * Delete an image from storage
 * @param path - The storage path
 */
export async function deleteImageServer(path: string): Promise<void> {
  try {
    const file = bucket.file(path);
    await file.delete();
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - deletion errors shouldn't break the flow
  }
}