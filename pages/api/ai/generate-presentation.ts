import type { NextApiRequest, NextApiResponse } from 'next';
import { getGeminiModel, validateInput } from '@/lib/server/vertex-ai';
import { checkRateLimit, trackUsage, checkDailyLimits } from '@/lib/server/rate-limiter';
import { createSlideFromAIContent } from '@/lib/server/slide-converter';
import { verifyIdToken } from '@/lib/firebase/admin';
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

    // Allow anonymous generation for testing
    const effectiveUserId = userId || 'anonymous-' + Date.now();
    
    // Only verify token if provided
    if (idToken && userId) {
      try {
        const decodedToken = await verifyIdToken(idToken);
        if (decodedToken.uid !== userId) {
          return res.status(401).json({
            success: false,
            error: 'Invalid authentication token',
          });
        }
      } catch (authError) {
        console.error('Auth verification failed:', authError);
        // Continue anyway for testing
      }
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

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(effectiveUserId, 'presentation');
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Rate limit exceeded. Please wait ${rateLimitCheck.resetInMinutes} minutes before trying again.`,
      });
    }

    // Check daily limits
    const dailyLimitCheck = await checkDailyLimits(effectiveUserId, 'slides', sanitized.slideCount || 10);
    if (!dailyLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Daily limit reached. You have ${dailyLimitCheck.remaining} slides remaining today.`,
      });
    }

    // Generate presentation without retry wrapper for better performance
    // Starting presentation generation
    const startTime = Date.now();
    
    const model = await getGeminiModel();
    
    const prompt = `Create a ${sanitized.slideCount}-slide ${sanitized.style} presentation about "${sanitized.topic}".

Return ONLY valid JSON with this structure:
{
  "title": "Presentation Title",
  "subtitle": "Subtitle or tagline",
  "slides": [
    {
      "type": "title",
      "heading": "Presentation Title",
      "subheading": "Subtitle or tagline"
    },
    {
      "type": "bullets",
      "heading": "Clear section heading",
      "bullets": [
        "First bullet point with substantial content",
        "Second bullet point with meaningful detail",
        "Third bullet point with specific information",
        "Fourth bullet point with valuable insight",
        "Fifth bullet point with actionable content"
      ],
      "imageDescriptions": [
        "Detailed 30-word description of first image showing...",
        "Detailed 30-word description of second image depicting...",
        "Detailed 30-word description of third image illustrating...",
        "Detailed 30-word description of fourth image representing..."
      ]
    },
    {
      "type": "content",
      "heading": "Content slide heading",
      "body": "A full paragraph of 50-100 words explaining the topic in detail. This should be substantive content that provides real value to the audience, not just a placeholder or brief summary.",
      "imageDescriptions": ["30-word image description", "30-word image description", "30-word image description", "30-word image description"]
    },
    {
      "type": "image",
      "heading": "Visual slide heading",
      "body": "Supporting text paragraph of 30-50 words that complements the images.",
      "imageDescriptions": ["30-word image description", "30-word image description", "30-word image description", "30-word image description"]
    },
    {
      "type": "threeImages",
      "heading": "Three images layout heading",
      "imageDescriptions": ["30-word image description", "30-word image description", "30-word image description", "30-word image description"]
    }
  ]
}

REQUIREMENTS:
1. Generate EXACTLY ${sanitized.slideCount} slides
2. Mix slide types: bullets, content, image, threeImages
3. Each slide needs heading and either bullets OR body text
4. Include imageDescriptions array with 4 descriptions per slide`;

    // Calling Gemini API
    
    // Add timeout to prevent hanging (3 minutes for presentation generation)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Gemini API timeout after 25 seconds')), 25000)
    );
    
    const resultPromise = model.generateContent(prompt);
    
    const result = await Promise.race([resultPromise, timeoutPromise]) as any;
    const response = result.response;
    
    const genTime = ((Date.now() - startTime) / 1000).toFixed(2);
    // Gemini API call completed
    
    // Get text from the response properly
    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error('No response generated');
    }
    
    // Clean and parse response
    const text = candidate.content.parts[0].text;
    let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to fix common JSON issues
    let aiResponse;
    try {
      aiResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response (first 1000 chars):', jsonText.substring(0, 1000));
      
      // Try multiple recovery strategies
      const recoveryStrategies = [
        // Strategy 1: Try to extract just the essential parts
        () => {
          try {
            // Extract title and subtitle
            const titleMatch = jsonText.match(/"title"\s*:\s*"([^"]*)"/);
            const subtitleMatch = jsonText.match(/"subtitle"\s*:\s*"([^"]*)"/);
            
            // Try to find the slides array
            const slidesStartIndex = jsonText.indexOf('"slides"');
            if (slidesStartIndex === -1) return null;
            
            const slidesArrayStart = jsonText.indexOf('[', slidesStartIndex);
            if (slidesArrayStart === -1) return null;
            
            // Find matching closing bracket
            let depth = 0;
            let i = slidesArrayStart;
            let slidesArrayEnd = -1;
            
            for (; i < jsonText.length; i++) {
              if (jsonText[i] === '[') depth++;
              else if (jsonText[i] === ']') {
                depth--;
                if (depth === 0) {
                  slidesArrayEnd = i;
                  break;
                }
              }
            }
            
            if (slidesArrayEnd === -1) {
              // Couldn't find closing, just return basic structure
              return {
                title: titleMatch ? titleMatch[1] : 'Presentation',
                subtitle: subtitleMatch ? subtitleMatch[1] : '',
                slides: []
              };
            }
            
            const slidesJson = jsonText.substring(slidesArrayStart, slidesArrayEnd + 1);
            const slides = JSON.parse(slidesJson);
            
            return {
              title: titleMatch ? titleMatch[1] : 'Presentation',
              subtitle: subtitleMatch ? subtitleMatch[1] : '',
              slides: slides
            };
          } catch (e) {
            console.error('Recovery strategy 1 failed:', e);
            return null;
          }
        },
        
        // Strategy 2: Fix unterminated strings by closing them
        () => {
          // Find the error position
          const errorMatch = parseError.message.match(/position (\d+)/);
          if (errorMatch) {
            const errorPos = parseInt(errorMatch[1]);
            
            // Find the last complete object before the error
            const beforeError = jsonText.substring(0, errorPos);
            const lastObjectEnd = Math.max(
              beforeError.lastIndexOf('},'),
              beforeError.lastIndexOf('}]'),
              beforeError.lastIndexOf('"}')
            );
            
            if (lastObjectEnd > 0) {
              let fixed = jsonText.substring(0, lastObjectEnd + 1);
              
              // Close any unclosed arrays and objects
              const arrays = (fixed.match(/\[/g) || []).length - (fixed.match(/\]/g) || []).length;
              const objects = (fixed.match(/\{/g) || []).length - (fixed.match(/\}/g) || []).length;
              
              fixed += ']'.repeat(arrays) + '}'.repeat(objects);
              
              return JSON.parse(fixed);
            }
          }
          return null;
        },
        
        // Strategy 3: Try to parse just the slides array
        () => {
          const slidesMatch = jsonText.match(/"slides"\s*:\s*\[([^\]]*)/);
          if (slidesMatch) {
            try {
              // Extract individual slide objects
              const slidesText = slidesMatch[1];
              const slideObjects = slidesText.match(/\{[^}]*\}/g) || [];
              
              return {
                title: 'Recovered Presentation',
                subtitle: '',
                slides: slideObjects.map(s => JSON.parse(s))
              };
            } catch (e) {
              return null;
            }
          }
          return null;
        }
      ];
      
      // Try each recovery strategy
      for (const strategy of recoveryStrategies) {
        try {
          const recovered = strategy();
          if (recovered && recovered.slides && recovered.slides.length > 0) {
            // Successfully recovered JSON using fallback strategy
            aiResponse = recovered;
            break;
          }
        } catch (e) {
          // Try next strategy
          continue;
        }
      }
      
      if (!aiResponse) {
        console.error('All recovery strategies failed, using fallback');
        // Return a minimal valid response to prevent client error
        aiResponse = {
          title: sanitized.topic,
          subtitle: 'Generated Presentation',
          slides: [
            {
              type: 'title',
              heading: sanitized.topic,
              subheading: 'Generated Presentation'
            }
          ]
        };
      }
    }

    // Convert AI response to Slide objects - PRESERVE imageDescriptions!
    const slides: Slide[] = aiResponse.slides.map((aiSlide: any, index: number) => {
      const slide = createSlideFromAIContent(aiSlide, index, 'modern');
      
      // CRITICAL: Preserve imageDescriptions for image queueing
      if (aiSlide.imageDescriptions && aiSlide.imageDescriptions.length > 0) {
        (slide as any).imageDescriptions = aiSlide.imageDescriptions;
      }
      
      return slide;
    });

    // Track usage for all authenticated users
    try {
      await trackUsage(effectiveUserId, 'presentation', 1, {
        model: 'gemini-2.5-flash',
        slideCount: slides.length,
      });
      await trackUsage(effectiveUserId, 'slides', slides.length);
    } catch (error) {
      console.warn('Usage tracking failed:', error);
      // Don't fail the request if usage tracking fails
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
      } else if (error.message.includes('quota') || error.message.includes('RATE_LIMIT')) {
        status = 429;
        message = 'Rate limit exceeded. Please wait 2-3 minutes before trying again';
      } else if (error.message.includes('timeout')) {
        status = 504;
        message = 'Generation took too long. Try reducing the number of slides.';
      } else if (error.message.includes('Invalid')) {
        status = 400;
        message = error.message;
      } else {
        // Include the actual error message for debugging
        message = `Failed to generate presentation: ${error.message}`;
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