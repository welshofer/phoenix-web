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
 * Server-side slide conversion without client-side dependencies
 */

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