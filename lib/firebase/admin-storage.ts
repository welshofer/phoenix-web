import { getStorage } from 'firebase-admin/storage';
import { adminApp } from './admin';

/**
 * Upload base64 images to Firebase Storage using Admin SDK
 * This works on the server-side without authentication issues
 */
export async function uploadMultipleImagesAdmin(
  images: string[],
  basePath: string
): Promise<string[]> {
  try {
    const bucket = getStorage(adminApp).bucket();
    const uploadPromises = images.map(async (base64, index) => {
      const path = `${basePath}/variant_${index}.png`;
      const file = bucket.file(path);
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64, 'base64');
      
      // Upload the buffer
      await file.save(buffer, {
        metadata: {
          contentType: 'image/png',
        },
        public: true, // Make the file publicly accessible
      });
      
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
      return publicUrl;
    });
    
    return Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading images with admin SDK:', error);
    throw new Error('Failed to upload images');
  }
}

/**
 * Generate a storage path for presentation images
 */
export function generateImagePath(
  presentationId: string,
  slideId: string,
  imageId: string
): string {
  return `presentations/${presentationId}/slides/${slideId}/${imageId}`;
}