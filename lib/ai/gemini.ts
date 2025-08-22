import { VertexAI } from '@google-cloud/vertexai';
import { 
  Slide, 
  SlideType, 
  SlideObjectUnion,
  TextObject,
  ImageObject,
  ShapeObject 
} from '@/lib/models/slide';
import { v4 as uuidv4 } from 'uuid';
import { modernTemplate } from '@/lib/templates/modern';

/**
 * Vertex AI / Gemini Integration
 * Generates presentation content using Google's Gemini model
 */

// Initialize Vertex AI client
const vertex = new VertexAI({
  project: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT!,
  location: process.env.NEXT_PUBLIC_VERTEX_AI_LOCATION || 'us-central1',
});

// Get Gemini model
const model = vertex.preview.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 0.7,
    topP: 0.95,
  },
});

// Export for use in podcast generation
export const geminiModel = model;

// AI-generated slide structure
interface AISlideContent {
  // Core content for every slide
  title: string;
  subtitle: string;
  leftHeading: string;
  leftBullets: string[]; // 5-7 bullets
  rightHeading: string;
  rightBullets: string[]; // 5-7 bullets
  imagePrompts: string[]; // 4 image generation prompts
  quote: string;
  quoteAuthor: string;
  statistic: string;
  statisticUnit: string;
  bestSlideType: string;
  
  // Legacy fields for backwards compatibility
  type?: string;
  heading?: string;
  subheading?: string;
  bullets?: string[];
  body?: string;
  imageDescription?: string;
  citation?: string;
  leftContent?: string | string[];
  rightContent?: string | string[];
}

interface AIPresentationResponse {
  title: string;
  subtitle?: string;
  slides: AISlideContent[];
  suggestedTheme?: string;
  suggestedColorScheme?: string;
}

/**
 * Generate a complete presentation using AI
 */
export async function generatePresentation(
  topic: string,
  slideCount: number = 10,
  style: 'professional' | 'creative' | 'educational' = 'professional'
): Promise<AIPresentationResponse> {
  const prompt = `Generate a ${style} presentation about "${topic}" with EXACTLY ${slideCount} slides. YOU MUST PROVIDE EXACTLY ${slideCount} SLIDES - NO MORE, NO LESS.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "Main Presentation Title",
  "subtitle": "Presentation subtitle",
  "suggestedTheme": "modern|minimal|bold|elegant",
  "suggestedColorScheme": "blue|green|purple|orange|monochrome",
  "slides": [
    {
      "title": "Slide title (always provide)",
      "subtitle": "Slide subtitle (always provide)",
      "leftHeading": "Heading for left side content",
      "leftBullets": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5", "Bullet 6", "Bullet 7"],
      "rightHeading": "Heading for right side content",
      "rightBullets": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5", "Bullet 6", "Bullet 7"],
      "imagePrompts": [
        "Detailed prompt for image 1",
        "Detailed prompt for image 2",
        "Detailed prompt for image 3",
        "Detailed prompt for image 4"
      ],
      "quote": "A relevant and impactful quote",
      "quoteAuthor": "Author Name, Title/Organization",
      "statistic": "95",
      "statisticUnit": "percent increase in productivity",
      "bestSlideType": "twoColumn|bullets|image|imageWithText|quote|comparison|timeline|chart|content"
    }
  ]
}

CRITICAL REQUIREMENTS:
- YOU MUST GENERATE EXACTLY ${slideCount} SLIDES
- EVERY slide MUST have ALL fields filled with relevant content
- title and subtitle are REQUIRED for every slide
- leftBullets and rightBullets MUST each contain 5-7 items
- imagePrompts MUST contain exactly 4 detailed image generation prompts
- Each image prompt should be detailed enough for AI image generation (describe scene, style, mood, colors)
- quote and quoteAuthor should be relevant to the slide's content
- statistic should be a meaningful number related to the slide topic
- statisticUnit should explain what the statistic represents
- bestSlideType should recommend the optimal layout for this content

Content Guidelines:
- First slide should focus on introducing the topic
- Create comprehensive, information-rich content for each slide
- Ensure bullets are substantive and informative (not just keywords)
- Make statistics specific and impactful
- Choose quotes that add authority or emotional resonance
- Image prompts should be varied: diagrams, photos, illustrations, infographics
- Maintain logical flow and progression throughout the presentation
- Balance different types of content across slides

IMPORTANT: Generate EXACTLY ${slideCount} slides, not ${slideCount - 1} or ${slideCount + 1}. Count them to ensure you have exactly ${slideCount}.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean up response (remove markdown code blocks if present)
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse and validate response
    const presentation = JSON.parse(jsonText) as AIPresentationResponse;
    
    // Ensure we have the requested number of slides
    if (presentation.slides.length !== slideCount) {
      console.warn(`AI generated ${presentation.slides.length} slides instead of ${slideCount}`);
    }
    
    return presentation;
  } catch (error) {
    console.error('Error generating presentation:', error);
    throw new Error('Failed to generate presentation content');
  }
}

/**
 * Convert AI-generated content to Slide objects with proper positioning
 */
export function createSlideFromAIContent(
  aiSlide: AISlideContent,
  order: number,
  templateId: string = 'modern'
): Slide {
  const slideId = uuidv4();
  const objects: SlideObjectUnion[] = [];
  
  // Get template layout for this slide type
  const template = modernTemplate; // You can make this dynamic
  const slideType = mapAITypeToSlideType(aiSlide.bestSlideType || aiSlide.type || 'content');
  const layout = template.layouts[slideType];
  
  // Create objects based on slide type and content
  switch (slideType) {
    case SlideType.TITLE:
      if (aiSlide.title || aiSlide.heading) {
        const titleZone = layout.zones.find(z => z.role === 'title');
        if (titleZone) {
          objects.push(createTextObject(
            aiSlide.title || aiSlide.heading || '',
            'title',
            titleZone.coordinates
          ));
        }
      }
      if (aiSlide.subtitle || aiSlide.subheading) {
        const subtitleZone = layout.zones.find(z => z.role === 'subtitle');
        if (subtitleZone) {
          objects.push(createTextObject(
            aiSlide.subtitle || aiSlide.subheading || '',
            'subtitle',
            subtitleZone.coordinates
          ));
        }
      }
      break;
      
    case SlideType.BULLETS:
      if (aiSlide.title || aiSlide.heading) {
        const headerZone = layout.zones.find(z => z.role === 'header');
        if (headerZone) {
          objects.push(createTextObject(
            aiSlide.title || aiSlide.heading || '',
            'header',
            headerZone.coordinates
          ));
        }
      }
      // Combine left and right bullets for single bullet list, or use legacy bullets
      let allBullets: string[] = [];
      if (aiSlide.leftBullets && aiSlide.leftBullets.length > 0) {
        allBullets = [...aiSlide.leftBullets];
      } else if (aiSlide.bullets && aiSlide.bullets.length > 0) {
        allBullets = aiSlide.bullets;
      }
      
      if (allBullets.length > 0) {
        const bulletsZone = layout.zones.find(z => z.role === 'bullets');
        if (bulletsZone) {
          const bulletHeight = bulletsZone.coordinates.height / allBullets.length;
          allBullets.forEach((bullet, index) => {
            objects.push(createTextObject(
              `• ${bullet}`,
              'bullets',
              {
                x: bulletsZone.coordinates.x + 40,
                y: bulletsZone.coordinates.y + (index * bulletHeight),
                width: bulletsZone.coordinates.width - 40,
                height: bulletHeight,
              }
            ));
          });
        }
      }
      break;
      
    case SlideType.IMAGE:
    case SlideType.IMAGE_WITH_TEXT:
      if (aiSlide.title || aiSlide.heading) {
        const headerZone = layout.zones.find(z => z.role === 'header');
        if (headerZone) {
          objects.push(createTextObject(
            aiSlide.title || aiSlide.heading || '',
            'header',
            headerZone.coordinates
          ));
        }
      }
      // Use first image prompt from the array, or fall back to imageDescription
      const imagePrompt = (aiSlide.imagePrompts && aiSlide.imagePrompts.length > 0) 
        ? aiSlide.imagePrompts[0] 
        : aiSlide.imageDescription;
      if (imagePrompt) {
        const imageZone = layout.zones.find(z => z.role === 'image');
        if (imageZone) {
          // Placeholder for image - in real app, this would trigger image generation
          objects.push(createImagePlaceholder(
            imagePrompt,
            imageZone.coordinates
          ));
        }
      }
      if (slideType === SlideType.IMAGE_WITH_TEXT && aiSlide.body) {
        const bodyZone = layout.zones.find(z => z.role === 'body');
        if (bodyZone) {
          objects.push(createTextObject(
            aiSlide.body,
            'body',
            bodyZone.coordinates
          ));
        }
      }
      break;
      
    case SlideType.TWO_COLUMN:
      if (aiSlide.title || aiSlide.heading) {
        const headerZone = layout.zones.find(z => z.role === 'header');
        if (headerZone) {
          objects.push(createTextObject(
            aiSlide.title || aiSlide.heading || '',
            'header',
            headerZone.coordinates
          ));
        }
      }
      
      const leftZone = layout.zones.find(z => z.id === 'leftColumn');
      const rightZone = layout.zones.find(z => z.id === 'rightColumn');
      
      // Use new comprehensive fields first, fall back to legacy fields
      if (leftZone) {
        let leftText = '';
        if (aiSlide.leftHeading) {
          leftText = aiSlide.leftHeading + '\n\n';
        }
        if (aiSlide.leftBullets && aiSlide.leftBullets.length > 0) {
          leftText += aiSlide.leftBullets.map(item => `• ${item}`).join('\n');
        } else if (aiSlide.leftContent) {
          leftText += Array.isArray(aiSlide.leftContent)
            ? aiSlide.leftContent.map(item => `• ${item}`).join('\n')
            : aiSlide.leftContent;
        }
        if (leftText) {
          objects.push(createTextObject(leftText, 'body', leftZone.coordinates));
        }
      }
      
      if (rightZone) {
        let rightText = '';
        if (aiSlide.rightHeading) {
          rightText = aiSlide.rightHeading + '\n\n';
        }
        if (aiSlide.rightBullets && aiSlide.rightBullets.length > 0) {
          rightText += aiSlide.rightBullets.map(item => `• ${item}`).join('\n');
        } else if (aiSlide.rightContent) {
          rightText += Array.isArray(aiSlide.rightContent)
            ? aiSlide.rightContent.map(item => `• ${item}`).join('\n')
            : aiSlide.rightContent;
        }
        if (rightText) {
          objects.push(createTextObject(rightText, 'body', rightZone.coordinates));
        }
      }
      break;
      
    case SlideType.QUOTE:
      if (aiSlide.quote) {
        const quoteZone = layout.zones.find(z => z.role === 'quote');
        if (quoteZone) {
          objects.push(createTextObject(
            aiSlide.quote,
            'quote',
            quoteZone.coordinates
          ));
        }
      }
      if (aiSlide.quoteAuthor || aiSlide.citation) {
        const citationZone = layout.zones.find(z => z.role === 'citation');
        if (citationZone) {
          objects.push(createTextObject(
            aiSlide.quoteAuthor || aiSlide.citation || '',
            'citation',
            citationZone.coordinates
          ));
        }
      }
      break;
      
    case SlideType.CONTENT:
    default:
      if (aiSlide.title || aiSlide.heading) {
        const headerZone = layout.zones.find(z => z.role === 'header');
        if (headerZone) {
          objects.push(createTextObject(
            aiSlide.title || aiSlide.heading || '',
            'header',
            headerZone.coordinates
          ));
        }
      }
      // For content slides, combine relevant information
      let bodyContent = '';
      if (aiSlide.body) {
        bodyContent = aiSlide.body;
      } else {
        // Build content from the comprehensive fields
        if (aiSlide.subtitle) {
          bodyContent += aiSlide.subtitle + '\n\n';
        }
        if (aiSlide.statistic && aiSlide.statisticUnit) {
          bodyContent += `Key Metric: ${aiSlide.statistic} ${aiSlide.statisticUnit}\n\n`;
        }
        if (aiSlide.leftBullets && aiSlide.leftBullets.length > 0) {
          bodyContent += aiSlide.leftBullets.map(b => `• ${b}`).join('\n');
        }
      }
      
      if (bodyContent) {
        const bodyZone = layout.zones.find(z => z.role === 'body');
        if (bodyZone) {
          objects.push(createTextObject(
            bodyContent,
            'body',
            bodyZone.coordinates
          ));
        }
      }
      break;
  }
  
  return {
    id: slideId,
    type: slideType,
    objects,
    order,
    templateId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Helper function to create text objects
 */
function createTextObject(
  content: string,
  role: any,
  coordinates: { x: number; y: number; width: number; height: number }
): TextObject {
  return {
    id: uuidv4(),
    type: 'text',
    content,
    role,
    coordinates,
    visible: true,
  };
}

/**
 * Helper function to create image placeholder
 */
function createImagePlaceholder(
  description: string,
  coordinates: { x: number; y: number; width: number; height: number }
): ImageObject {
  return {
    id: uuidv4(),
    type: 'image',
    src: `/api/placeholder/image?text=${encodeURIComponent(description)}`,
    alt: description,
    coordinates,
    fit: 'contain',
    visible: true,
  };
}

/**
 * Map AI slide types to our SlideType enum
 */
function mapAITypeToSlideType(aiType: string): SlideType {
  const mapping: Record<string, SlideType> = {
    'title': SlideType.TITLE,
    'section': SlideType.SECTION,
    'bullets': SlideType.BULLETS,
    'image': SlideType.IMAGE,
    'imageWithText': SlideType.IMAGE_WITH_TEXT,
    'twoColumn': SlideType.TWO_COLUMN,
    'quote': SlideType.QUOTE,
    'content': SlideType.CONTENT,
    'comparison': SlideType.COMPARISON,
    'timeline': SlideType.TIMELINE,
    'chart': SlideType.CHART,
    'table': SlideType.TABLE,
  };
  
  return mapping[aiType] || SlideType.CONTENT;
}

/**
 * Generate a complete presentation with all slides
 */
export async function generateFullPresentation(
  topic: string,
  slideCount: number = 10,
  style: 'professional' | 'creative' | 'educational' = 'professional'
): Promise<{
  title: string;
  subtitle?: string;
  slides: Slide[];
  metadata: {
    suggestedTheme?: string;
    suggestedColorScheme?: string;
    generatedAt: Date;
    topic: string;
  };
}> {
  // Generate content with AI
  const aiResponse = await generatePresentation(topic, slideCount, style);
  
  // Convert AI content to Slide objects
  const slides = aiResponse.slides.map((aiSlide, index) => 
    createSlideFromAIContent(aiSlide, index)
  );
  
  return {
    title: aiResponse.title,
    subtitle: aiResponse.subtitle,
    slides,
    metadata: {
      suggestedTheme: aiResponse.suggestedTheme,
      suggestedColorScheme: aiResponse.suggestedColorScheme,
      generatedAt: new Date(),
      topic,
    },
  };
}