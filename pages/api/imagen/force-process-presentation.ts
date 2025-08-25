import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { IMAGE_STYLES } from '@/lib/constants/image-styles';
import { uploadMultipleImagesServer } from '@/lib/firebase/server-storage';
import { generateImagePath } from '@/lib/firebase/storage';
import { updateSlideImage } from '@/lib/firebase/presentations';

const PROJECT_ID = 'phoenix-web-app';
const LOCATION = 'us-central1';
const MODEL = 'imagegeneration@006';

async function getAccessToken(): Promise<string> {
  try {
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token || '';
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw new Error('Authentication failed');
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { presentationId } = req.body;
  
  if (!presentationId) {
    return res.status(400).json({ error: 'presentationId is required' });
  }

  try {
    // Force processing all images for presentation
    
    // Get all pending jobs for this presentation
    const jobsQuery = query(
      collection(db, 'imageGenerationQueue'),
      where('presentationId', '==', presentationId),
      where('status', 'in', ['pending', 'processing'])
    );
    
    const jobsSnapshot = await getDocs(jobsQuery);
    const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Found jobs to process for presentation
    
    let processedCount = 0;
    const errors = [];
    
    for (const job of jobs) {
      try {
        // Processing job for slide
        
        // Mark as processing
        await updateDoc(doc(db, 'imageGenerationQueue', job.id), {
          status: 'processing',
          updatedAt: new Date()
        });
        
        // Get access token
        const accessToken = await getAccessToken();
        
        // Build prompt
        const stylePrompt = IMAGE_STYLES[job.style as keyof typeof IMAGE_STYLES] || IMAGE_STYLES.photorealistic;
        const prompt = `${job.description}, ${stylePrompt}`;
        
        // Generating image with Imagen
        
        // Call Vertex AI
        const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;
        
        const requestBody = {
          instances: [{ prompt: prompt }],
          parameters: {
            sampleCount: 3,
            aspectRatio: '16:9',
          }
        };
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          throw new Error(`Vertex AI error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.predictions || result.predictions.length === 0) {
          throw new Error('No images generated');
        }
        
        // Extract base64 images
        const base64Images = result.predictions
          .map((prediction: any) => prediction.bytesBase64Encoded)
          .filter(Boolean);
        
        // Upload to Firebase Storage
        const storagePath = generateImagePath(presentationId, job.slideId, job.id);
        const imageUrls = await uploadMultipleImagesServer(base64Images, storagePath);
        
        // Update job as completed
        await updateDoc(doc(db, 'imageGenerationQueue', job.id), {
          status: 'completed',
          imageUrls: imageUrls,
          heroIndex: 0,
          fullPrompt: prompt,
          updatedAt: new Date()
        });
        
        // Update the slide with the generated images
        await updateSlideImage(presentationId, job.slideId, {
          src: imageUrls[0],
          objectId: job.objectId,
          imageIndex: job.imageIndex,
          variants: imageUrls,
          heroIndex: 0,
          generatedAt: new Date(),
          generationPrompt: prompt,
        });
        
        // Successfully processed job
        processedCount++;
        
        // Rate limit - wait 3 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`Failed to process job ${job.id}:`, error);
        errors.push({ jobId: job.id, error: error instanceof Error ? error.message : 'Unknown error' });
        
        // Mark as failed
        await updateDoc(doc(db, 'imageGenerationQueue', job.id), {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Processing failed',
          updatedAt: new Date()
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Processed ${processedCount} of ${jobs.length} images`,
      processedCount,
      totalJobs: jobs.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Force processing error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process images'
    });
  }
}