import type { NextApiRequest, NextApiResponse } from 'next';
import { ImageStyle, IMAGE_STYLES } from '@/lib/constants/image-styles';

/**
 * Direct image generation using Vertex AI REST API
 * No SDK bullshit, just direct HTTP calls
 */

const PROJECT_ID = 'phoenix-web-app';
const LOCATION = 'us-central1';
const MODEL = 'imagegeneration@006'; // Imagen 2 model that actually works

interface GenerateImageRequest {
  description: string;
  style?: ImageStyle;
}

async function getAccessToken(): Promise<string> {
  // For server-side, we read the token from environment or use service account
  // For now, we'll use the ADC (Application Default Credentials)
  try {
    // In production, you'd use a service account key file
    // For development, we use the gcloud auth token
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

  try {
    const { description, style = 'photorealistic' } = req.body as GenerateImageRequest;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Get access token
    const accessToken = await getAccessToken();
    
    // Get the style prompt
    const stylePrompt = IMAGE_STYLES[style] || IMAGE_STYLES.photorealistic;
    
    // Combine description with style
    const prompt = `${description}, ${stylePrompt}`;
    
    console.log('Generating image with Imagen 2, prompt:', prompt.substring(0, 100) + '...');
    
    // Call Vertex AI REST API directly
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;
    
    const requestBody = {
      instances: [
        {
          prompt: prompt,
        }
      ],
      parameters: {
        sampleCount: 3, // Generate 3 variants
        aspectRatio: '16:9',
        // safetyFilterLevel: 'block_some',
        // personGeneration: 'allow_adult',
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
      const errorText = await response.text();
      console.error('Vertex AI error:', errorText);
      throw new Error(`Vertex AI returned ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    // Extract images from response - we now get 3 variants
    if (!result.predictions || result.predictions.length === 0) {
      throw new Error('No images generated');
    }
    
    // Process all variants
    console.log(`Received ${result.predictions.length} predictions from Imagen 2`);
    
    const imageUrls = result.predictions.map((prediction: any, index: number) => {
      if (!prediction.bytesBase64Encoded) {
        console.warn(`No image data for variant ${index + 1}`);
        return null;
      }
      console.log(`Variant ${index + 1}: Image data present (${prediction.bytesBase64Encoded.length} chars)`);
      return `data:image/png;base64,${prediction.bytesBase64Encoded}`;
    }).filter(Boolean);
    
    console.log(`Successfully processed ${imageUrls.length} image variants out of ${result.predictions.length} predictions`);
    
    return res.status(200).json({
      success: true,
      imageUrls, // Array of 3 image URLs
      imageUrl: imageUrls[0], // Keep backward compatibility
      prompt: prompt,
      model: MODEL,
      variantCount: imageUrls.length,
    });
    
  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image',
    });
  }
}