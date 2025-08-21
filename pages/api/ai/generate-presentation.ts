import type { NextApiRequest, NextApiResponse } from 'next';
import { getGeminiModel, validateInput } from '@/lib/server/vertex-ai';
import { checkRateLimit, trackUsage, checkDailyLimits } from '@/lib/server/rate-limiter';
import { createSlideFromAIContent } from '@/lib/server/slide-converter';
import { auth } from '@/lib/firebase/config';
import { Slide } from '@/lib/models/slide';

/**
 * API Route: /api/ai/generate-presentation
 * Generates a complete presentation using Vertex AI
 */

interface GeneratePresentationRequest {
  topic: string;
  slideCount?: number;
  style?: 'professional' | 'creative' | 'educational';
  userId: string;
  idToken: string; // Firebase auth token
}

interface GeneratePresentationResponse {
  success: boolean;
  data?: {
    title: string;
    subtitle?: string;
    slides: Slide[];
    metadata: {
      generatedAt: Date;
      topic: string;
      slideCount: number;
      style: string;
    };
  };
  error?: string;
  usage?: {
    slidesRemaining: number;
    requestsRemaining: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeneratePresentationResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Validate request body
    const { topic, slideCount, style, userId, idToken } = req.body as GeneratePresentationRequest;

    // Skip auth verification for now if no token provided
    // This allows both authenticated and anonymous usage
    const isAuthenticated = !!(idToken && userId);
    
    if (!isAuthenticated) {
      console.log('Processing request without authentication');
    }

    // Validate and sanitize input
    const validation = validateInput({ topic, slideCount, style });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', '),
      });
    }

    const { sanitized } = validation;

    // Skip rate limits for now - remove daily slide generation limits
    let rateLimitCheck = { allowed: true, remaining: 100 };
    let dailyLimitCheck = { allowed: true, remaining: 100 };

    // Generate presentation without retry wrapper for better performance
    console.log(`Starting generation: ${sanitized.slideCount} slides about "${sanitized.topic}"`);
    const startTime = Date.now();
    
    const model = await getGeminiModel();
    
    const prompt = `Create a ${sanitized.slideCount}-slide ${sanitized.style} presentation about "${sanitized.topic}".

For slides that would benefit from images (e.g., content slides, image_with_text), include an imageDescription field with a detailed description for AI image generation.

Return JSON:
{
  "title": "Title",
  "subtitle": "Subtitle",
  "slides": [
    {"type": "title", "heading": "text", "subheading": "text"},
    {"type": "bullets", "heading": "text", "bullets": ["item1", "item2"]},
    {"type": "content", "heading": "text", "body": "text", "imageDescription": "detailed description for image generation"},
    {"type": "image_with_text", "heading": "text", "body": "text", "imageDescription": "detailed description"}
  ]
}`;

    console.log('Calling Gemini API...');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Gemini API timeout after 30 seconds')), 30000)
    );
    
    const resultPromise = model.generateContent(prompt);
    
    const result = await Promise.race([resultPromise, timeoutPromise]) as any;
    const response = result.response;
    
    const genTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Gemini responded in ${genTime} seconds`);
    
    // Get text from the response properly
    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error('No response generated');
    }
    
    // Clean and parse response
    const text = candidate.content.parts[0].text;
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const aiResponse = JSON.parse(jsonText);

    // Convert AI response to Slide objects
    const slides: Slide[] = aiResponse.slides.map((aiSlide: any, index: number) =>
      createSlideFromAIContent(aiSlide, index, 'modern')
    );

    // Track usage only for authenticated users
    if (isAuthenticated && userId) {
      try {
        await trackUsage(userId, 'presentation', 1, {
          model: 'gemini-2.5-flash',
          slideCount: slides.length,
        });
        await trackUsage(userId, 'slides', slides.length);
      } catch (error) {
        console.warn('Usage tracking failed:', error);
      }
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      data: {
        title: aiResponse.title,
        subtitle: aiResponse.subtitle,
        slides,
        metadata: {
          generatedAt: new Date(),
          topic: sanitized.topic,
          slideCount: slides.length,
          style: sanitized.style,
        },
      },
      usage: {
        slidesRemaining: dailyLimitCheck.remaining - slides.length,
        requestsRemaining: rateLimitCheck.remaining,
      },
    });

  } catch (error) {
    console.error('Presentation generation error:', error);
    
    // Determine error type and status code
    let status = 500;
    let message = 'Failed to generate presentation';
    
    if (error instanceof Error) {
      if (error.message.includes('auth')) {
        status = 401;
        message = 'Authentication failed';
      } else if (error.message.includes('quota')) {
        status = 429;
        message = 'API quota exceeded';
      } else if (error.message.includes('Invalid')) {
        status = 400;
        message = error.message;
      }
    }
    
    return res.status(status).json({
      success: false,
      error: message,
    });
  }
}

// Configure API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    // Response time limit (important for AI generation)
    responseLimit: false,
    // Increase timeout for AI generation
    externalResolver: true,
  },
};