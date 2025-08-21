import { VertexAI } from '@google-cloud/vertexai';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { ImageStyle, IMAGE_STYLES, ImagePriority } from '@/lib/constants/image-styles';

/**
 * Imagen 4.0 Image Generation Service
 * Matches the macOS implementation with the same model and configuration
 */

// Re-export for backward compatibility
export { IMAGE_STYLES, ImagePriority };
export type { ImageStyle };

// Legacy styles mapping (if needed)
const LEGACY_STYLES = {
  photorealistic: "photorealistic, high quality, professional photography, sharp focus, detailed",
  pencilSketch: "pencil sketch, hand drawn, artistic sketch, graphite drawing, black and white",
  charcoalSketch: "charcoal drawing, black and white sketch, smudged shading, textured paper, bold strokes, high contrast, artistic style",
  watercolor: "watercolor painting, soft colors, artistic brushstrokes, traditional art",
  oilPainting: "oil painting, rich textures, classical art style, painterly brushstrokes",
  digitalArt: "digital art, modern illustration, vibrant colors, clean lines",
  minimalist: "minimalist design, simple shapes, clean composition, negative space",
  technicalDiagram: "technical diagram, schematic, blueprint style, precise lines, labeled components",
  infographic: "infographic style, data visualization, modern design, clear visual hierarchy",
  vintage: "vintage style, retro aesthetic, aged textures, nostalgic feel",
  neonGlow: "neon glow effect, cyberpunk aesthetic, bright colors, dark background",
  comicBook: "comic book style, bold outlines, halftone dots, action-oriented composition",
  manga: "Japanese manga style, anime aesthetic, expressive characters, dynamic composition",
  bauhaus: "Bauhaus design style, geometric shapes, primary colors, modernist aesthetic",
  artDeco: "Art Deco style, geometric patterns, luxury aesthetic, gold accents",
  impressionist: "impressionist painting, soft brushstrokes, light and color emphasis, Monet-like",
  scandinavian60s: "simple shapes, soft watercolor fills, outlined with expressive black ink lines, Scandinavian children's illustration style from the 1960s, minimal background",
  frenchWhimsy: "loose black ink lines and flat muted colors like navy and mustard, inspired by mid-century French children's book art",
  europeanTravelJournal: "messy black ink, with light notes and dates scribbled beside, pastel watercolor highlights",
  dutchWinter: "Delicate black ink lines, pale gray, faded green and ochre tones. Poetic and quiet, nostalgic winter mood",
  secretJournal: "a minimalist line drawing with a loose, sketchbook-style look, rendered in gray-blue ink. minimal detail, capturing the essence of the scene with simplified shapes and abstract forms",
  adMen: "A lithograph poster of the subject, printed in vintage colorinks with posterized shading. Includes stylized text, worn corners, and faded paper texture like a 1960s print ad.",
  neanderthal: "A cave painting of the subject, rendered with primitive ochres and charcoal lines on a rough stone wall. Smudged handprints, crude geometry, and flickering torchlight add a primal, ancient mood.",
  kidz: "Transform this prompt into a charming stick-figure-style drawing, like one made by a child. Use simple, irregular lines and unpolished shapes. The character should have a large head, tiny stick limbs, and an exaggerated or quirky facial expression. Colors should be flat and playful, or limited to a few soft tones. Keep the background almost blank or childlike. The overall style should feel spontaneous, joyful, and imperfect — like a lovable doodle full of personality.",
  seurat: "A peaceful riverside park in late 19th-century France, rendered in the style of Georges Seurat's Pointillism. The entire scene is composed of thousands of tiny, distinct dots of pure color with no visible brushstrokes. Figures in elegant clothing stroll or sit under trees, boats drift on calm water, and light sparkles on the surface, achieved through optical blending of complementary colors. The composition is harmoniously balanced, with a serene, timeless atmosphere. The image should have a mosaic-like texture, precise dot placement, and softly defined forms that come into focus from a distance",
  vanGogh: "Render the subject in the expressive, post-impressionist style of Vincent van Gogh. Use thick, energetic brushstrokes with visible texture, mimicking heavy impasto oil paint. Apply bold, swirling lines and directional strokes to convey motion and emotion. Emphasize intense, saturated colors — especially vivid blues, yellows, and oranges — with high contrast and dramatic lighting. Forms should appear emotionally charged rather than realistic, with exaggerated contours and abstracted details. The composition should feel dynamic, with a sense of inner tension and rhythmic movement throughout the image",
  hokusai: "Render the subject in the iconic ukiyo-e woodblock print style of Katsushika Hokusai. Use clean, flowing linework with precise contours and flat areas of color. Emphasize bold composition, asymmetrical balance, and strong diagonal movement. Apply a limited but harmonious Edo-period color palette — featuring indigo blues, muted greens, warm ochres, and soft reds. Include subtle gradient shading (bokashi) and stylized textures for water, sky, and fabric. Details should be simplified and graphic, not photorealistic, with attention to traditional Japanese patterning and natural forms. The overall aesthetic should be elegant, restrained, and evocative of 19th-century Japanese printmaking",
  artistJournal: "Use minimalist line drawing with a loose, sketchbook-style look.\nUse expressive black ink lines with irregular, hand-drawn contours. The background should remain white and clean, with no shading or textures. Highlight only one or two elements in solid color — to create visual focus. The overall style should feel light, spontaneous, and emotionally charming, like a page from an artist's illustration sketchbook. The final result should be simple yet evocative, capturing the subject with minimal strokes and one pop of color",
  digilux: "Use smooth, matte textures, slightly rounded edges, and a playful, clay-like aesthetic.\n\nUse soft daylight lighting from the top-left to create natural, warm shadows. The background must be plain white or a soft pastel gradient, ensuring the scene feels clean and isolated.\n\nEmphasize clarity, symmetry, and stylized geometry, with exaggerated scale if necessary. Include minimal environmental elements (e.g. trees, grass, walkways, cars) only if they support the composition.\n\nDo not include any text or logo unless specified, and keep the scene balanced and toy-like, as if part of a collectible architectural scenic diorama",
  popUp: "Simulate a 3D paper cutout style with layered elements and folded paper shadows. Use bright, flat colors and clean shapes. Characters should have simplified, childlike proportions and appear as if they are made from cut and glued paper. The scene should look handcrafted and theatrical, like it's built from folded cardstock and set on a blank stage. Convey a joyful, playful mood.",
  lineArtMinimal: "Transform this prompt into a minimalist editorial line art illustration. Use clean, thin black lines to define only the essential contours, leaving most areas blank. Avoid shading or texture. Add a single conceptual touch of color to highlight one meaningful element (e.g., a flower, a garment, an object). The final image should feel modern, intellectual, and symbolic, like an illustration for a cultural magazine or a thoughtful article. Preserve the original composition's emotional tone, but distill it into abstract simplicity.",
  scribble: "controlled scribble illustration. Messy, expressive black lines that appear impulsive and spontaneous, but still suggest the essential shapes and emotion. Strokes may overlap, remain uneven,feel raw — as if sketched quickly by hand in a moment of emotion. Add a single soft or bold shadow of color — such as a blue, red, or yellow shape — behind or beneath the figure to emphasize mood or space.",
  punchy: "Create a vector-style illustration in a minimalist, modern flat cartoon aesthetic. Each illustration should use bold black outlines, a clean white background, and a limited color palette of red, yellow, black, white, and green. The characters and scenes should have a playful, friendly feel with simple geometric shapes and clean compositions. Include light environmental details (like plants, clouds, or stones) with a balanced negative space",
  rembrandt: "In the style of Rembrandt — a masterful chiaroscuro composition bathed in dramatic light and shadow...",
  durer: "In the style of Albrecht Dürer — an exquisitely detailed engraving or woodcut with sharp black lines...",
  pablo: "Compose a complex, analytical Cubist image inspired by Pablo Picasso's early 20th-century innovations...",
  michelangelo: "Craft a heroic and anatomically precise figure study in the style of Michelangelo's High Renaissance masterworks...",
  dali: "Design a surrealist dreamscape in the style of Salvador Dalí — a hallucinatory world of warped reality...",
  vermeer: "Illustrate an interior domestic moment bathed in soft daylight, inspired by the delicate naturalism of Vermeer...",
  munch: "Create an emotionally charged scene drenched in existential symbolism, evoking Edvard Munch's expressionist spirit...",
  kahlo: "Compose a bold and symbolic self-portrait in the intimate, folkloric style of Frida Kahlo...",
  oKeeffe: "Generate a minimalist, sensual composition in the spirit of Georgia O'Keeffe's American modernism...",
  warhol: "Design a vibrant, ironic image in the Pop Art style of Andy Warhol — high-contrast silkscreen-style repetition...",
  klimt: "Design a radiant, ornamental composition in homage to Gustav Klimt's golden period...",
  matisse: "Construct a joyous and lyrical interior or still life in the vibrant Fauvist style of Henri Matisse...",
  sepia: "photorealistic, sepia toned, vintage photography, warm brown tones, sharp detail, professional quality",
  noctilux: "50mm f/1.4 portrait, extreme shallow DOF, swirled bokeh balls, tack sharp focal plane, smooth focus falloff, natural color grading, fine grain structure, medium format quality, rangefinder framing, Leica signature rendering, creamy background separation, subtle optical vignetting, high micro-contrast, organic tonal curve"
} as const;

// Image generation request
export interface ImageRequest {
  id: string;
  presentationId: string;
  slideId: string;
  userId: string;
  description: string;
  style?: ImageStyle;
  priority: ImagePriority;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  error?: string;
  createdAt: Timestamp | Date;
  startedAt?: Timestamp | Date;
  completedAt?: Timestamp | Date;
  retries?: number;
}

// Rate limiting configuration (20 requests per minute)
const RATE_LIMIT = {
  maxRequests: 20,
  windowMs: 60000, // 60 seconds
};

// Track request timestamps for rate limiting
const requestTimestamps: Map<string, number[]> = new Map();

/**
 * Check if we can make a request based on rate limits
 */
function canMakeRequest(userId: string): boolean {
  const now = Date.now();
  const userTimestamps = requestTimestamps.get(userId) || [];
  
  // Remove timestamps older than the window
  const recentTimestamps = userTimestamps.filter(
    ts => now - ts < RATE_LIMIT.windowMs
  );
  
  requestTimestamps.set(userId, recentTimestamps);
  
  return recentTimestamps.length < RATE_LIMIT.maxRequests;
}

/**
 * Record a request timestamp
 */
function recordRequest(userId: string): void {
  const now = Date.now();
  const userTimestamps = requestTimestamps.get(userId) || [];
  userTimestamps.push(now);
  requestTimestamps.set(userId, userTimestamps);
}

/**
 * Queue an image generation request
 */
export async function queueImageGeneration(
  presentationId: string,
  slideId: string,
  userId: string,
  description: string,
  style?: ImageStyle,
  priority: ImagePriority = ImagePriority.NORMAL
): Promise<string> {
  const requestId = doc(collection(db, 'imageRequests')).id;
  
  const request: ImageRequest = {
    id: requestId,
    presentationId,
    slideId,
    userId,
    description,
    style,
    priority,
    status: 'queued',
    createdAt: serverTimestamp() as Timestamp,
  };
  
  await setDoc(doc(db, 'imageRequests', requestId), request);
  
  // Trigger processing if within rate limits
  if (canMakeRequest(userId)) {
    processNextImage(userId);
  }
  
  return requestId;
}

/**
 * Process the next image in the queue
 */
async function processNextImage(userId: string): Promise<void> {
  try {
    // Get the highest priority queued request
    const q = query(
      collection(db, 'imageRequests'),
      where('userId', '==', userId),
      where('status', '==', 'queued'),
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    
    const requestDoc = snapshot.docs[0];
    const request = requestDoc.data() as ImageRequest;
    
    // Mark as processing
    await updateDoc(doc(db, 'imageRequests', request.id), {
      status: 'processing',
      startedAt: serverTimestamp(),
    });
    
    // Record the request for rate limiting
    recordRequest(userId);
    
    // Generate the image
    try {
      const imageUrl = await generateImageWithImagen(
        request.description,
        request.style
      );
      
      // Update with success
      await updateDoc(doc(db, 'imageRequests', request.id), {
        status: 'completed',
        imageUrl,
        completedAt: serverTimestamp(),
      });
      
      // Also update the slide with the new image
      await updateSlideImage(
        request.presentationId,
        request.slideId,
        imageUrl
      );
      
      // Process next image if available and within limits
      if (canMakeRequest(userId)) {
        setTimeout(() => processNextImage(userId), 1000); // Small delay between requests
      }
      
    } catch (error) {
      console.error('Image generation failed:', error);
      
      // Update with failure
      await updateDoc(doc(db, 'imageRequests', request.id), {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: serverTimestamp(),
        retries: (request.retries || 0) + 1,
      });
      
      // Retry if under retry limit
      if ((request.retries || 0) < 3) {
        await updateDoc(doc(db, 'imageRequests', request.id), {
          status: 'queued',
        });
      }
    }
  } catch (error) {
    console.error('Error processing image queue:', error);
  }
}

/**
 * Generate image using Imagen 4.0
 */
async function generateImageWithImagen(
  description: string,
  style?: ImageStyle
): Promise<string> {
  const vertex = new VertexAI({
    project: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT!,
    location: 'us-central1',
  });
  
  // Get Imagen 4.0 model (matching macOS implementation)
  const model = vertex.preview.getGenerativeModel({
    model: 'imagen-4.0-fast-generate-preview-06-06',
    generationConfig: {
      numberOfImages: 1, // Matching macOS: reduced from 3 to 1 to save quota
      aspectRatio: 'landscape16x9',
      imageFormat: 'png',
    },
  });
  
  // Construct prompt with style
  let fullPrompt: string;
  if (style && IMAGE_STYLES[style]) {
    fullPrompt = `Style: ${IMAGE_STYLES[style]}. Subject: ${description}`;
  } else {
    fullPrompt = description;
  }
  
  // Generate the image
  const result = await model.generateImages({ prompt: fullPrompt });
  
  // Extract the image URL or base64
  if (result.images && result.images.length > 0) {
    const image = result.images[0];
    
    // If base64, upload to Firebase Storage
    if (image.bytesBase64Encoded) {
      return await uploadToStorage(image.bytesBase64Encoded, 'png');
    }
    
    // If URL, return directly
    if (image.url) {
      return image.url;
    }
  }
  
  throw new Error('No image generated');
}

/**
 * Upload base64 image to Firebase Storage
 */
async function uploadToStorage(base64: string, format: string): Promise<string> {
  // This would upload to Firebase Storage and return the URL
  // For now, return a data URL
  return `data:image/${format};base64,${base64}`;
}

/**
 * Update slide with generated image
 */
async function updateSlideImage(
  presentationId: string,
  slideId: string,
  imageUrl: string
): Promise<void> {
  // Update the specific slide's image in Firestore
  const slideRef = doc(db, 'presentations', presentationId, 'slides', slideId);
  await updateDoc(slideRef, {
    generatedImageUrl: imageUrl,
    imageGeneratedAt: serverTimestamp(),
  });
}

/**
 * Get generation status for a presentation
 */
export async function getImageGenerationStatus(
  presentationId: string
): Promise<{
  total: number;
  completed: number;
  processing: number;
  failed: number;
  queued: number;
}> {
  const q = query(
    collection(db, 'imageRequests'),
    where('presentationId', '==', presentationId)
  );
  
  const snapshot = await getDocs(q);
  
  let completed = 0;
  let processing = 0;
  let failed = 0;
  let queued = 0;
  
  snapshot.forEach(doc => {
    const request = doc.data() as ImageRequest;
    switch (request.status) {
      case 'completed': completed++; break;
      case 'processing': processing++; break;
      case 'failed': failed++; break;
      case 'queued': queued++; break;
    }
  });
  
  return {
    total: snapshot.size,
    completed,
    processing,
    failed,
    queued,
  };
}

/**
 * Cancel pending image requests for a presentation
 */
export async function cancelImageGeneration(
  presentationId: string
): Promise<void> {
  const q = query(
    collection(db, 'imageRequests'),
    where('presentationId', '==', presentationId),
    where('status', '==', 'queued')
  );
  
  const snapshot = await getDocs(q);
  
  const updates = snapshot.docs.map(doc =>
    updateDoc(doc.ref, { status: 'failed', error: 'Cancelled by user' })
  );
  
  await Promise.all(updates);
}