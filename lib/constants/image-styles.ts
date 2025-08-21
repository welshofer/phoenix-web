/**
 * Image generation styles - EXACT 45 styles from macOS implementation
 * DO NOT FUCKING MODIFY - these are from the user's Swift code
 */

export type ImageStyle = 
  | 'photorealistic'
  | 'pencilSketch'
  | 'charcoalSketch'
  | 'watercolor'
  | 'oilPainting'
  | 'digitalArt'
  | 'minimalist'
  | 'technicalDiagram'
  | 'infographic'
  | 'vintage'
  | 'neonGlow'
  | 'comicBook'
  | 'manga'
  | 'bauhaus'
  | 'artDeco'
  | 'impressionist'
  | 'scandinavian60s'
  | 'frenchWhimsy'
  | 'europeanTravelJournal'
  | 'dutchWinter'
  | 'secretJournal'
  | 'adMen'
  | 'neanderthal'
  | 'kidz'
  | 'seurat'
  | 'vanGogh'
  | 'hokusai'
  | 'artistJournal'
  | 'digilux'
  | 'popUp'
  | 'lineArtMinimal'
  | 'scribble'
  | 'punchy'
  | 'rembrandt'
  | 'durer'
  | 'pablo'
  | 'michelangelo'
  | 'dali'
  | 'vermeer'
  | 'munch'
  | 'kahlo'
  | 'oKeeffe'
  | 'warhol'
  | 'klimt'
  | 'matisse'
  | 'sepia'
  | 'noctilux';

export const IMAGE_STYLES: Record<ImageStyle, string> = {
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
};

export enum ImagePriority {
  HIGH = 2,
  NORMAL = 1,
  LOW = 0
}