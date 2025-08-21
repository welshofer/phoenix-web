import { storage } from './config';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Upload a base64 image to Firebase Storage
 * @param base64String - The base64 encoded image string
 * @param path - The storage path (e.g., 'presentations/123/slides/456/image.png')
 * @returns The download URL of the uploaded image
 */
export async function uploadBase64Image(
  base64String: string,
  path: string
): Promise<string> {
  try {
    // Create a storage reference
    const storageRef = ref(storage, path);
    
    // Upload the base64 string
    const snapshot = await uploadString(storageRef, base64String, 'base64');
    
    // Get the download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Upload multiple base64 images
 * @param images - Array of base64 strings
 * @param basePath - Base storage path
 * @returns Array of download URLs
 */
export async function uploadMultipleImages(
  images: string[],
  basePath: string
): Promise<string[]> {
  const uploadPromises = images.map((base64, index) => {
    const path = `${basePath}/variant_${index}.png`;
    return uploadBase64Image(base64, path);
  });
  
  return Promise.all(uploadPromises);
}

/**
 * Delete an image from storage
 * @param url - The storage URL or path
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    // If it's a full URL, extract the path
    let path = url;
    if (url.includes('firebasestorage.googleapis.com')) {
      // Extract path from URL
      const matches = url.match(/o\/(.*?)\?/);
      if (matches && matches[1]) {
        path = decodeURIComponent(matches[1]);
      }
    }
    
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - deletion errors shouldn't break the flow
  }
}

/**
 * Generate a storage path for presentation images
 */
export function generateImagePath(
  presentationId: string,
  slideId: string,
  imageId: string,
  variantIndex?: number
): string {
  const variant = variantIndex !== undefined ? `_v${variantIndex}` : '';
  return `presentations/${presentationId}/slides/${slideId}/${imageId}${variant}.png`;
}

/**
 * Convert data URL to base64 string
 */
export function dataUrlToBase64(dataUrl: string): string {
  // Remove the data:image/png;base64, prefix
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return base64;
}

/**
 * Check if a string is a data URL
 */
export function isDataUrl(str: string): boolean {
  return str.startsWith('data:image/');
}

/**
 * Convert base64 to blob for more efficient uploads
 */
export function base64ToBlob(base64: string, contentType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}