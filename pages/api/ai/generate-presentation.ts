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

    // Verify Firebase auth token
    if (!idToken || !userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // TODO: Verify the idToken with Firebase Admin SDK
    // const decodedToken = await admin.auth().verifyIdToken(idToken);
    // if (decodedToken.uid !== userId) { ... }

    // Validate and sanitize input
    const validation = validateInput({ topic, slideCount, style });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', '),
      });
    }

    const { sanitized } = validation;

    // Check rate limits (optional - skip if Firestore is offline)
    let rateLimitCheck = { allowed: true, remaining: 100 };
    let dailyLimitCheck = { allowed: true, remaining: 100 };
    
    try {
      rateLimitCheck = await checkRateLimit(userId, 'free');
      if (!rateLimitCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: rateLimitCheck.reason || 'Rate limit exceeded',
          usage: {
            requestsRemaining: rateLimitCheck.remaining,
            slidesRemaining: 0,
          },
        });
      }

      dailyLimitCheck = await checkDailyLimits(userId, 'free', 'slides');
      if (sanitized.slideCount > dailyLimitCheck.remaining) {
        return res.status(429).json({
          success: false,
          error: `Daily limit exceeded. You can generate ${dailyLimitCheck.remaining} more slides today.`,
          usage: {
            slidesRemaining: dailyLimitCheck.remaining,
            requestsRemaining: rateLimitCheck.remaining,
          },
        });
      }
    } catch (error) {
      console.warn('Rate limiting check failed, proceeding without limits:', error);
    }

    // Generate presentation without retry wrapper for better performance
    const model = await getGeminiModel();
    
    const prompt = `Create a ${sanitized.slideCount}-slide ${sanitized.style} presentation about "${sanitized.topic}".

Return JSON:
{
  "title": "Title",
  "subtitle": "Subtitle",
  "slides": [
    {"type": "title", "heading": "text", "subheading": "text"},
    {"type": "bullets", "heading": "text", "bullets": ["item1", "item2"]},
    {"type": "content", "heading": "text", "body": "text"}
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    
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

    // Track usage (optional - skip if Firestore is offline)
    try {
      await trackUsage(userId, 'presentation', 1, {
        model: 'gemini-2.5-flash',
        slideCount: slides.length,
      });
      await trackUsage(userId, 'slides', slides.length);
    } catch (error) {
      console.warn('Usage tracking failed:', error);
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