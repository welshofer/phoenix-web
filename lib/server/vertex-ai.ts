import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';

/**
 * Server-side Vertex AI client with proper authentication
 * This should only be used in API routes, not in client code
 */

let vertexClient: VertexAI | null = null;
let authClient: GoogleAuth | null = null;

/**
 * Initialize Vertex AI with proper authentication
 */
export async function getVertexAI(): Promise<VertexAI> {
  if (vertexClient) return vertexClient;

  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT;
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable is not set');
  }

  try {
    // Initialize Google Auth
    authClient = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      // Will use Application Default Credentials (ADC)
      // In order: GOOGLE_APPLICATION_CREDENTIALS, gcloud auth, metadata service
    });

    // Verify authentication
    const client = await authClient.getClient();
    await client.getAccessToken();

    // Initialize Vertex AI
    vertexClient = new VertexAI({
      project: projectId,
      location: location,
    });

    return vertexClient;
  } catch (error) {
    console.error('Failed to initialize Vertex AI:', error);
    throw new Error('Failed to authenticate with Google Cloud. Please check your credentials.');
  }
}

/**
 * Get Gemini model with safety settings
 */
export async function getGeminiModel(modelName: string = 'gemini-2.5-flash') {
  const vertex = await getVertexAI();
  
  return vertex.preview.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: 32768,  // Increased to handle 30+ slides with 4 image prompts each
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  });
}

/**
 * Retry logic for API calls
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${i + 1} failed:`, error);
      
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('auth')) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Generate image using Imagen (Vertex AI image generation)
 */
export async function generateImage(prompt: string): Promise<string> {
  const vertex = await getVertexAI();
  
  try {
    // Get the Imagen model
    const model = vertex.preview.getGenerativeModel({
      model: 'imagegeneration@002',
    });
    
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Create a professional presentation slide image: ${prompt}. Style: Clean, modern, business-appropriate, high contrast, minimal text.`,
        }],
      }],
    });
    
    const response = result.response;
    
    // Extract image data from response
    if (response.candidates && response.candidates[0]?.content?.parts?.[0]) {
      const imagePart = response.candidates[0].content.parts[0];
      if (imagePart.inlineData?.data) {
        // Return base64 image data
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      }
    }
    
    throw new Error('No image generated');
  } catch (error) {
    console.error('Image generation failed:', error);
    // Fallback to a placeholder
    return `/api/images/placeholder?text=${encodeURIComponent(prompt)}`;
  }
}

/**
 * Validate and sanitize user input
 */
export function validateInput(input: {
  topic?: string;
  slideCount?: number;
  style?: string;
}): {
  isValid: boolean;
  errors: string[];
  sanitized: {
    topic: string;
    slideCount: number;
    style: 'professional' | 'creative' | 'educational';
  };
} {
  const errors: string[] = [];
  
  // Validate topic
  const topic = input.topic?.trim() || '';
  if (!topic) {
    errors.push('Topic is required');
  } else if (topic.length > 200) {
    errors.push('Topic must be less than 200 characters');
  } else if (!/^[\w\s\-.,!?'"]+$/u.test(topic)) {
    errors.push('Topic contains invalid characters');
  }
  
  // Validate slide count
  const slideCount = Number(input.slideCount) || 10;
  if (slideCount < 3 || slideCount > 30) {
    errors.push('Slide count must be between 3 and 30');
  }
  
  // Validate style
  const validStyles = ['professional', 'creative', 'educational'];
  const style = validStyles.includes(input.style || '') 
    ? input.style as 'professional' | 'creative' | 'educational'
    : 'professional';
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      topic,
      slideCount,
      style,
    },
  };
}