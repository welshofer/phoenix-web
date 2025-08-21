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

// AI-generated slide structure
interface AISlideContent {
  type: string;
  heading?: string;
  subheading?: string;
  bullets?: string[];
  body?: string;
  imageDescription?: string;
  quote?: string;
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
  const prompt = `Generate a ${style} presentation about "${topic}" with exactly ${slideCount} slides.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "Main Presentation Title",
  "subtitle": "Optional subtitle",
  "suggestedTheme": "modern|minimal|bold|elegant",
  "suggestedColorScheme": "blue|green|purple|orange|monochrome",
  "slides": [
    {
      "type": "title|section|bullets|image|imageWithText|twoColumn|quote|content",
      "heading": "Slide heading",
      "subheading": "Optional subheading",
      "bullets": ["Point 1", "Point 2"],
      "body": "Paragraph text for content slides",
      "imageDescription": "Detailed description of what image should show",
      "quote": "Quote text",
      "citation": "Quote attribution",
      "leftContent": "Text or array of bullets for left column",
      "rightContent": "Text or array of bullets for right column"
    }
  ]
}

Guidelines:
- First slide should be type "title" with the presentation title
- Include a mix of slide types for variety
- Make bullets concise and impactful
- For image slides, provide detailed imageDescription for image generation
- For two-column slides, provide leftContent and rightContent
- Ensure logical flow and progression of ideas
- Use section slides to divide major topics
- Keep text concise and presentation-friendly`;

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
  const slideType = mapAITypeToSlideType(aiSlide.type);
  const layout = template.layouts[slideType];
  
  // Create objects based on slide type and content
  switch (slideType) {
    case SlideType.TITLE:
      if (aiSlide.heading) {
        const titleZone = layout.zones.find(z => z.role === 'title');
        if (titleZone) {
          objects.push(createTextObject(
            aiSlide.heading,
            'title',
            titleZone.coordinates
          ));
        }
      }
      if (aiSlide.subheading) {
        const subtitleZone = layout.zones.find(z => z.role === 'subtitle');
        if (subtitleZone) {
          objects.push(createTextObject(
            aiSlide.subheading,
            'subtitle',
            subtitleZone.coordinates
          ));
        }
      }
      break;
      
    case SlideType.BULLETS:
      if (aiSlide.heading) {
        const headerZone = layout.zones.find(z => z.role === 'header');
        if (headerZone) {
          objects.push(createTextObject(
            aiSlide.heading,
            'header',
            headerZone.coordinates
          ));
        }
      }
      if (aiSlide.bullets && aiSlide.bullets.length > 0) {
        const bulletsZone = layout.zones.find(z => z.role === 'bullets');
        if (bulletsZone) {
          const bulletHeight = bulletsZone.coordinates.height / aiSlide.bullets.length;
          aiSlide.bullets.forEach((bullet, index) => {
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
      if (aiSlide.heading) {
        const headerZone = layout.zones.find(z => z.role === 'header');
        if (headerZone) {
          objects.push(createTextObject(
            aiSlide.heading,
            'header',
            headerZone.coordinates
          ));
        }
      }
      if (aiSlide.imageDescription) {
        const imageZone = layout.zones.find(z => z.role === 'image');
        if (imageZone) {
          // Placeholder for image - in real app, this would trigger image generation
          objects.push(createImagePlaceholder(
            aiSlide.imageDescription,
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
      if (aiSlide.heading) {
        const headerZone = layout.zones.find(z => z.role === 'header');
        if (headerZone) {
          objects.push(createTextObject(
            aiSlide.heading,
            'header',
            headerZone.coordinates
          ));
        }
      }
      
      const leftZone = layout.zones.find(z => z.id === 'leftColumn');
      const rightZone = layout.zones.find(z => z.id === 'rightColumn');
      
      if (leftZone && aiSlide.leftContent) {
        const leftText = Array.isArray(aiSlide.leftContent) 
          ? aiSlide.leftContent.map(item => `• ${item}`).join('\n')
          : aiSlide.leftContent;
        objects.push(createTextObject(leftText, 'body', leftZone.coordinates));
      }
      
      if (rightZone && aiSlide.rightContent) {
        const rightText = Array.isArray(aiSlide.rightContent)
          ? aiSlide.rightContent.map(item => `• ${item}`).join('\n')
          : aiSlide.rightContent;
        objects.push(createTextObject(rightText, 'body', rightZone.coordinates));
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
      if (aiSlide.citation) {
        const citationZone = layout.zones.find(z => z.role === 'citation');
        if (citationZone) {
          objects.push(createTextObject(
            aiSlide.citation,
            'citation',
            citationZone.coordinates
          ));
        }
      }
      break;
      
    case SlideType.CONTENT:
    default:
      if (aiSlide.heading) {
        const headerZone = layout.zones.find(z => z.role === 'header');
        if (headerZone) {
          objects.push(createTextObject(
            aiSlide.heading,
            'header',
            headerZone.coordinates
          ));
        }
      }
      if (aiSlide.body) {
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