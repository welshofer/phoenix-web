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
    maxOutputTokens: 32768,  // Increased from 8192 to handle 30+ slides
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
  const prompt = `Create a ${slideCount}-slide ${style} presentation about "${topic}".

Include a balanced mix of slide types (30% bullets/content, 30% single image, 30% threeImages, 10% other).
For EVERY slide (except title slide), provide 4 detailed image descriptions for flexibility.

Return JSON:
{
  "title": "Title",
  "subtitle": "Subtitle",  
  "slides": [
    {
      "type": "title|bullets|content|image|threeImages|twoColumn|quote",
      "heading": "text",
      "subheading": "text",
      "bullets": ["item1", "item2", "item3", "item4", "item5"],
      "body": "paragraph of content text",
      "imageDescriptions": ["image1 desc (20-50 words)", "image2 desc (20-50 words)", "image3 desc (20-50 words)", "image4 desc (20-50 words)"],
      "leftContent": "left column content or array of bullets",
      "rightContent": "right column content or array of bullets",
      "quote": "impactful quote text",
      "citation": "Author Name, Title"
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY ${slideCount} slides
2. Mix slide types for variety - use bullets, content, image, threeImages, twoColumn, quote types
3. Balanced mix: ~30% bullets/content, ~30% single image, ~30% threeImages, ~10% other
4. EVERY slide (except title) MUST have:
   - heading: clear, descriptive title
   - Either bullets OR body content (not empty!)
   - imageDescriptions: array of EXACTLY 4 image prompts (20-50 words each)

CONTENT REQUIREMENTS:
- bullets slides: provide 3-7 bullet points with substantial content
- content slides: provide a full paragraph in body field
- twoColumn slides: provide leftContent and rightContent (can be text or bullet arrays)
- image/threeImages slides: still include bullets or body content!
- quote slides: provide quote and citation fields

IMAGE DESCRIPTIONS:
- ALWAYS provide 4 unique image descriptions per slide
- Each should be detailed and different (not variations)
- Include visual elements, colors, composition
- Mix types: photos, diagrams, illustrations, charts

IMPORTANT: Count your slides to ensure exactly ${slideCount}. Include real content, not just titles!`;

  try {
    // Requesting slides from Gemini
    console.log('📝 Sending request to Gemini 1.5 Flash...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    // Get text from the response properly
    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error('No response generated from Gemini');
    }
    
    const text = candidate.content.parts[0].text;
    console.log('✅ Gemini responded successfully');
    
    // Received response from Gemini
    
    // Clean up response (remove markdown code blocks if present)
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse and validate response
    const presentation = JSON.parse(jsonText) as AIPresentationResponse;
    
    // Count image-type slides (handle both type and bestSlideType)
    const imageSlideTypes = ['image', 'threeImages', 'imageWithText'];
    const imageSlideCount = presentation.slides.filter(slide => 
      imageSlideTypes.includes(slide.type || slide.bestSlideType || '')
    ).length;
    
    const requiredImageSlides = Math.floor(slideCount * 0.8);
    
    console.log(`🎨 Image slide validation: ${imageSlideCount}/${presentation.slides.length} slides are image types (need ${requiredImageSlides}+)`);
    
    // TRY TO GET SLIDES TO 4 IMAGE DESCRIPTIONS (but accept what we get)
    let slidesWithImages = 0;
    let totalImagePrompts = 0;
    
    for (let i = 0; i < presentation.slides.length; i++) {
      const slide = presentation.slides[i];
      
      // Skip title slide (first slide)
      if (i === 0 && (slide.type === 'title' || slide.bestSlideType === 'title')) continue;
      
      // Ensure we have a type field
      if (!slide.type && slide.bestSlideType) {
        slide.type = slide.bestSlideType;
      }
      
      // Count what we have
      const existingCount = slide.imageDescriptions?.length || 0;
      
      if (existingCount > 0) {
        slidesWithImages++;
        totalImagePrompts += existingCount;
      }
      
      // If we have less than 4, ALWAYS add more to reach 4
      if (existingCount < 4 && existingCount > 0) {
        console.log(`📸 Slide ${i}: "${slide.title}" has ${existingCount} images - adding ${4 - existingCount} more to reach 4`);
        
        if (!slide.imageDescriptions) slide.imageDescriptions = [];
        
        // Add enough to reach exactly 4
        const toAdd = 4 - existingCount;
        const additions = [
          `Additional perspective of ${slide.title} showing related concepts and supporting details`,
          `Complementary visualization of ${slide.title} with different visual approach`,
          `Alternative representation of ${slide.title} emphasizing key takeaways`,
          `Supporting imagery for ${slide.title} with contextual elements`
        ];
        
        for (let j = 0; j < toAdd && j < additions.length; j++) {
          slide.imageDescriptions.push(additions[j]);
          totalImagePrompts++;
        }
      } else if (existingCount === 0) {
        // No images at all - we should ALWAYS have 4 for flexibility!
        console.warn(`⚠️ Slide ${i}: "${slide.title}" has NO images - generating 4 fallback descriptions`);
        
        // ALWAYS add 4 image descriptions for maximum flexibility
        // This allows users to switch to ANY layout type
        slide.imageDescriptions = [
          `Professional visualization of ${slide.title || 'this concept'} showing key elements and relationships`,
          `Detailed diagram illustrating ${slide.title || 'the main idea'} with visual hierarchy and flow`,
          `Infographic representation of ${slide.title || 'this topic'} with data points and visual metrics`,
          `Creative illustration depicting ${slide.title || 'the concept'} in an engaging visual style`
        ];
        totalImagePrompts += 4;
        slidesWithImages++;
        
        // If it's set to an image type but had no images, keep the type
        // since we now have 4 images
        const imageTypes = ['image', 'threeImages', 'imageWithText'];
        if (!imageTypes.includes(slide.bestSlideType || '')) {
          // It wasn't an image type, so keep it as is
          console.log(`  Keeping slide type as ${slide.bestSlideType} (now with 4 image options)`);
        }
      }
      
      // Cap at 4 if somehow we got more
      if (slide.imageDescriptions && slide.imageDescriptions.length > 4) {
        slide.imageDescriptions = slide.imageDescriptions.slice(0, 4);
      }
    }
    
    // Validate slide types match their content
    let typesMismatched = 0;
    for (const slide of presentation.slides) {
      const hasImages = slide.imageDescriptions && slide.imageDescriptions.length > 0;
      const isImageType = ['image', 'threeImages', 'imageWithText'].includes(slide.bestSlideType || '');
      
      if (isImageType && !hasImages) {
        console.warn(`⚠️ Slide "${slide.title}" is type ${slide.bestSlideType} but has no images!`);
        typesMismatched++;
      }
    }
    
    // Final count
    const finalTotalImages = presentation.slides.reduce((total, slide) => 
      total + (slide.imageDescriptions?.length || 0), 0
    );
    
    console.log(`📸 Image Summary:`);
    console.log(`  - ${slidesWithImages} slides have images`);
    console.log(`  - ${finalTotalImages} total image prompts to generate`);
    console.log(`  - Average: ${(finalTotalImages / Math.max(slidesWithImages, 1)).toFixed(1)} images per slide with images`);
    if (typesMismatched > 0) {
      console.log(`  - Fixed ${typesMismatched} slides with mismatched types`);
    }
    
    // Ensure we have the requested number of slides
    if (presentation.slides.length !== slideCount) {
      console.error(`⚠️ AI generated ${presentation.slides.length} slides instead of ${slideCount} requested!`);
      console.error(`First slide title: ${presentation.slides[0]?.title || 'N/A'}`);
      
      // If we got way fewer slides than requested, it's likely a token limit issue
      if (presentation.slides.length < slideCount / 2) {
        console.error('Likely hit token limit. Response may have been truncated.');
      }
    } else {
      console.log(`✅ Successfully generated ${slideCount} slides with ${imageSlideCount} image slides`);
    }
    
    return presentation;
  } catch (error: any) {
    console.error('❌ Error generating presentation:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      statusText: error.statusText,
      details: error.details
    });
    
    // Check what kind of error this is
    if (error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
      // Rate limit - this is temporary, user should retry
      throw new Error('RATE_LIMIT: Service is busy. Please wait 30 seconds and try again.');
    }
    
    if (error.message?.includes('quota')) {
      // Quota exhausted - need to wait longer
      throw new Error('QUOTA_EXCEEDED: Daily limit reached. Please try again tomorrow.');
    }
    
    if (error.message?.includes('authentication') || error.message?.includes('401')) {
      // Auth issue - needs fixing
      throw new Error('AUTH_ERROR: Service authentication failed. Please contact support.');
    }
    
    // Unknown error - be honest about it
    throw new Error(`SERVICE_ERROR: Generation failed - ${error.message || 'Unknown error'}`);
  }
}

// Removed fallback function - we should NEVER return generic garbage

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
      
    case SlideType.THREE_IMAGES:
      // Three images layout - no text, just three positioned images
      // Check for imageDescriptions (new format) or imagePrompts (old format)
      const prompts = aiSlide.imageDescriptions || aiSlide.imagePrompts || [];
      if (prompts.length >= 3) {
        // Image 1 - Large left image
        objects.push({
          id: uuidv4(),
          type: 'image',
          src: '', // Will be filled by image generation
          alt: prompts[0],
          generationDescription: prompts[0],
          fit: 'cover', // Fill mode - crop to fill entire frame
          coordinates: { x: 95, y: 100, width: 1116, height: 884 },
          visible: true,
        } as ImageObject);
        
        // Image 2 - Top right image
        objects.push({
          id: uuidv4(),
          type: 'image',
          src: '', // Will be filled by image generation
          alt: prompts[1],
          generationDescription: prompts[1],
          fit: 'cover', // Fill mode - crop to fill entire frame
          coordinates: { x: 1245, y: 100, width: 580, height: 426 },
          visible: true,
        } as ImageObject);
        
        // Image 3 - Bottom right image
        objects.push({
          id: uuidv4(),
          type: 'image',
          src: '', // Will be filled by image generation
          alt: prompts[2],
          generationDescription: prompts[2],
          fit: 'cover', // Fill mode - crop to fill entire frame
          coordinates: { x: 1245, y: 558, width: 580, height: 426 },
          visible: true,
        } as ImageObject);
      } else {
        // Fallback: create empty image placeholders
        for (let i = 0; i < 3; i++) {
          const coords = i === 0 
            ? { x: 95, y: 100, width: 1116, height: 884 }
            : i === 1 
            ? { x: 1245, y: 100, width: 580, height: 426 }
            : { x: 1245, y: 558, width: 580, height: 426 };
          
          objects.push({
            id: uuidv4(),
            type: 'image',
            src: '',
            alt: `Image ${i + 1}`,
            generationDescription: aiSlide.title ? `${aiSlide.title} - Visual ${i + 1}` : `Image ${i + 1}`,
            fit: 'cover',
            coordinates: coords,
            visible: true,
          } as ImageObject);
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
    'threeImages': SlideType.THREE_IMAGES,
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