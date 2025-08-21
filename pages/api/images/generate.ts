import type { NextApiRequest, NextApiResponse } from 'next';
import { getVertexAI, withRetry } from '@/lib/server/vertex-ai';
import { checkRateLimit, trackUsage, checkDailyLimits } from '@/lib/server/rate-limiter';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * API Route: /api/images/generate
 * Generates images for presentation slides using Vertex AI
 */

interface GenerateImageRequest {
  prompt: string;
  style?: 'professional' | 'creative' | 'minimal' | 'technical';
  aspectRatio?: '16:9' | '4:3' | '1:1';
  userId: string;
  idToken: string;
  presentationId?: string;
  slideId?: string;
}

interface GenerateImageResponse {
  success: boolean;
  data?: {
    url: string;
    prompt: string;
    generatedAt: Date;
  };
  error?: string;
  usage?: {
    imagesRemaining: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateImageResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const {
      prompt,
      style = 'professional',
      aspectRatio = '16:9',
      userId,
      idToken,
      presentationId,
      slideId,
    } = req.body as GenerateImageRequest;

    // Validate authentication
    if (!idToken || !userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Validate prompt
    if (!prompt || prompt.length < 3 || prompt.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Prompt must be between 3 and 500 characters',
      });
    }

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(userId, 'free');
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: rateLimitCheck.reason || 'Rate limit exceeded',
      });
    }

    // Check daily image generation limit
    const dailyLimitCheck = await checkDailyLimits(userId, 'free', 'images');
    if (!dailyLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: dailyLimitCheck.reason || 'Daily image limit reached',
        usage: {
          imagesRemaining: 0,
        },
      });
    }

    // Enhance prompt based on style
    const stylePrompts = {
      professional: 'clean, modern, business-appropriate, high contrast',
      creative: 'artistic, vibrant, imaginative, unique',
      minimal: 'minimalist, simple, clean lines, lots of whitespace',
      technical: 'technical diagram, schematic, detailed, precise',
    };

    const enhancedPrompt = `Create a presentation slide image: ${prompt}. 
Style: ${stylePrompts[style]}. 
Aspect ratio: ${aspectRatio}. 
No text overlay, suitable for professional presentations.`;

    // Generate image with Vertex AI
    let imageUrl: string;
    
    try {
      imageUrl = await withRetry(async () => {
        const vertex = await getVertexAI();
        
        // Use Imagen model for image generation
        const model = vertex.preview.getGenerativeModel({
          model: 'imagegeneration@006', // Latest Imagen model
        });
        
        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [{
              text: enhancedPrompt,
            }],
          }],
          generationConfig: {
            candidateCount: 1,
            maxOutputTokens: 2048,
          },
        });
        
        const response = result.response;
        
        // Extract base64 image from response
        if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
          const imageData = response.candidates[0].content.parts[0].inlineData;
          const base64 = imageData.data;
          const mimeType = imageData.mimeType || 'image/png';
          
          // Convert base64 to blob
          const buffer = Buffer.from(base64, 'base64');
          const blob = new Blob([buffer], { type: mimeType });
          
          // Upload to Firebase Storage
          const fileName = `presentations/${presentationId || 'general'}/${slideId || uuidv4()}.png`;
          const storageRef = ref(storage, fileName);
          
          await uploadBytes(storageRef, blob, {
            contentType: mimeType,
            customMetadata: {
              userId,
              prompt: prompt.substring(0, 100),
              generatedAt: new Date().toISOString(),
            },
          });
          
          // Get download URL
          return await getDownloadURL(storageRef);
        }
        
        throw new Error('No image generated');
      });
    } catch (error) {
      console.error('Image generation failed, using fallback:', error);
      
      // Fallback to a gradient placeholder
      imageUrl = await generatePlaceholderImage(prompt, style, aspectRatio);
    }

    // Track usage
    await trackUsage(userId, 'image', 1, {
      presentationId,
      slideId,
      model: 'imagegeneration@006',
    });

    return res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        prompt: enhancedPrompt,
        generatedAt: new Date(),
      },
      usage: {
        imagesRemaining: dailyLimitCheck.remaining - 1,
      },
    });

  } catch (error) {
    console.error('Image generation error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to generate image',
    });
  }
}

/**
 * Generate a placeholder image when AI generation fails
 */
async function generatePlaceholderImage(
  prompt: string,
  style: string,
  aspectRatio: string
): Promise<string> {
  // Use a gradient based on style
  const gradients = {
    professional: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    creative: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    minimal: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)',
    technical: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  };
  
  const dimensions = {
    '16:9': { width: 1920, height: 1080 },
    '4:3': { width: 1600, height: 1200 },
    '1:1': { width: 1080, height: 1080 },
  };
  
  const dim = dimensions[aspectRatio as keyof typeof dimensions] || dimensions['16:9'];
  const gradient = gradients[style as keyof typeof gradients] || gradients.professional;
  
  // Create SVG placeholder
  const svg = `
    <svg width="${dim.width}" height="${dim.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${dim.width}" height="${dim.height}" fill="url(#gradient)"/>
      <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="48" font-family="Arial" opacity="0.8">
        ${prompt.substring(0, 50)}
      </text>
    </svg>
  `;
  
  // Convert to base64 data URL
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: false,
  },
};