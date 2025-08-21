/**
 * Image generation styles - matching macOS implementation
 * This file is client-safe and can be imported anywhere
 */

export type ImageStyle = 
  | 'photorealistic'
  | 'digitalArt'
  | 'oilPainting'
  | 'watercolor'
  | 'pencilSketch'
  | 'minimalist'
  | 'abstract'
  | 'vintage'
  | 'retrofuturism'
  | 'cyberpunk'
  | 'steampunk'
  | 'fantasy'
  | 'anime'
  | 'comicBook'
  | 'noir'
  | 'impressionist'
  | 'expressionist'
  | 'surrealist'
  | 'popArt'
  | 'artDeco'
  | 'artNouveau'
  | 'bauhaus'
  | 'gothicRevival'
  | 'renaissance'
  | 'baroque'
  | 'neoclassical'
  | 'romanticism'
  | 'ukiyoE'
  | 'sumi_e'
  | 'madhubani'
  | 'warli'
  | 'aboriginal'
  | 'nativeAmerican'
  | 'aztec'
  | 'mayan'
  | 'egyptian'
  | 'islamicGeometric'
  | 'celtic'
  | 'viking'
  | 'africanTribal'
  | 'polynesian'
  | 'inuit'
  | 'graffiti'
  | 'lowPoly'
  | 'voxelArt'
  | 'pixelArt'
  | 'isometric'
  | 'flatDesign'
  | 'lineart'
  | 'blueprint'
  | 'infographic'
  | 'woodcut'
  | 'linocut'
  | 'etching'
  | 'lithography'
  | 'screenprint'
  | 'risograph'
  | 'collage'
  | 'origami'
  | 'papercraft'
  | 'stainedGlass'
  | 'mosaic'
  | 'tapestry'
  | 'scandinavian60s';

export const IMAGE_STYLES: Record<ImageStyle, string> = {
  photorealistic: 'photorealistic, professional photography, high resolution, sharp focus, natural lighting',
  digitalArt: 'digital art, modern digital illustration, vibrant colors, clean lines, professional artwork',
  oilPainting: 'oil painting, traditional art, rich textures, visible brushstrokes, classical technique',
  watercolor: 'watercolor painting, soft edges, translucent layers, flowing colors, artistic',
  pencilSketch: 'pencil sketch, hand-drawn, detailed line work, shading, artistic drawing',
  minimalist: 'minimalist, simple, clean design, negative space, modern, geometric shapes',
  abstract: 'abstract art, non-representational, expressive, bold shapes, dynamic composition',
  vintage: 'vintage style, retro, nostalgic, aged appearance, classic design, old-fashioned',
  retrofuturism: 'retrofuturistic, 1980s vision of future, neon colors, chrome, synthwave aesthetic',
  cyberpunk: 'cyberpunk, neon lights, dark urban, high-tech low-life, futuristic dystopian',
  steampunk: 'steampunk, Victorian era, brass and copper, gears and clockwork, industrial age',
  fantasy: 'fantasy art, magical, mythical creatures, epic landscapes, enchanted, dreamlike',
  anime: 'anime style, Japanese animation, manga influence, expressive characters, dynamic action',
  comicBook: 'comic book style, bold outlines, action panels, superhero aesthetic, pop art influence',
  noir: 'film noir style, high contrast, black and white, dramatic shadows, 1940s detective aesthetic',
  impressionist: 'impressionist painting, loose brushstrokes, light and color, Monet style, atmospheric',
  expressionist: 'expressionist art, emotional, distorted forms, bold colors, raw energy',
  surrealist: 'surrealist art, dreamlike, impossible scenes, Dali influence, subconscious imagery',
  popArt: 'pop art style, Andy Warhol influence, bold colors, commercial art, repeated patterns',
  artDeco: 'art deco, 1920s style, geometric patterns, luxury, gold accents, elegant symmetry',
  artNouveau: 'art nouveau, organic forms, flowing lines, nature motifs, decorative, Mucha style',
  bauhaus: 'Bauhaus design, functional, geometric, primary colors, minimalist, modernist',
  gothicRevival: 'Gothic Revival, medieval inspired, ornate details, pointed arches, dramatic',
  renaissance: 'Renaissance style, classical beauty, realistic proportions, Italian masters influence',
  baroque: 'Baroque art, dramatic lighting, rich colors, ornate details, emotional intensity',
  neoclassical: 'Neoclassical style, Greek and Roman influence, balanced composition, idealized forms',
  romanticism: 'Romantic period art, emotional, nature scenes, dramatic landscapes, sublime',
  ukiyoE: 'Ukiyo-e, Japanese woodblock print, flat colors, outlined forms, Hokusai influence',
  sumi_e: 'Sumi-e, Japanese ink painting, minimalist, brush strokes, zen aesthetic, monochrome',
  madhubani: 'Madhubani art, Indian folk art, intricate patterns, vibrant colors, nature motifs',
  warli: 'Warli painting, tribal art, simple geometric shapes, monochromatic, folk narratives',
  aboriginal: 'Aboriginal art, dot painting, dreamtime stories, earth colors, indigenous Australian',
  nativeAmerican: 'Native American art, tribal patterns, earth tones, spiritual symbols, traditional',
  aztec: 'Aztec art, Mesoamerican, geometric patterns, gold and turquoise, symbolic imagery',
  mayan: 'Mayan art, hieroglyphic elements, jade green, ceremonial imagery, ancient civilization',
  egyptian: 'Ancient Egyptian art, hieroglyphics, gold and lapis, profile views, pharaonic',
  islamicGeometric: 'Islamic geometric patterns, intricate tessellation, arabesque, mathematical precision',
  celtic: 'Celtic art, interwoven patterns, knotwork, spirals, medieval illumination style',
  viking: 'Viking art, Norse mythology, runic symbols, dragon motifs, wood carving style',
  africanTribal: 'African tribal art, masks and patterns, bold geometric shapes, earth tones',
  polynesian: 'Polynesian art, tiki style, ocean motifs, tribal patterns, island culture',
  inuit: 'Inuit art, Arctic themes, simplified forms, stone carving style, northern imagery',
  graffiti: 'graffiti art, street style, spray paint, urban, bold tags, hip-hop culture',
  lowPoly: 'low poly 3D art, geometric shapes, faceted surfaces, modern gaming aesthetic',
  voxelArt: 'voxel art, 3D pixels, blocky style, Minecraft aesthetic, retro gaming',
  pixelArt: 'pixel art, 8-bit style, retro gaming, limited color palette, nostalgic',
  isometric: 'isometric illustration, 3D technical drawing, architectural, precise angles',
  flatDesign: 'flat design, no shadows, simple shapes, bright colors, modern UI style',
  lineart: 'line art, black and white, clean lines, no shading, minimalist illustration',
  blueprint: 'blueprint style, technical drawing, blue and white, architectural plans, precise',
  infographic: 'infographic style, data visualization, clean design, educational, modern',
  woodcut: 'woodcut print, bold contrasts, carved texture, traditional printmaking, rustic',
  linocut: 'linocut print, bold graphic style, high contrast, handmade aesthetic',
  etching: 'etching style, fine lines, crosshatching, traditional printmaking, detailed',
  lithography: 'lithographic print, tonal gradations, artistic printing, vintage posters',
  screenprint: 'screen print, bold colors, layered inks, Warhol style, graphic design',
  risograph: 'risograph print, limited colors, grainy texture, indie publishing aesthetic',
  collage: 'collage art, mixed media, layered images, cut and paste, eclectic composition',
  origami: 'origami style, paper folding, geometric forms, Japanese craft, minimalist',
  papercraft: 'papercraft, 3D paper art, layered paper, handmade, craft aesthetic',
  stainedGlass: 'stained glass window, translucent colors, lead lines, cathedral art, luminous',
  mosaic: 'mosaic art, small tiles, fragmented color, Byzantine influence, tessellation',
  tapestry: 'tapestry style, woven textile, medieval art, narrative scenes, rich textures',
  scandinavian60s: 'Scandinavian design from the 1960s, mid-century modern, minimalist aesthetic, natural materials like teak and pine, clean lines, functional beauty, muted colors with occasional bright accents, cozy and practical'
};

export enum ImagePriority {
  HIGH = 2,
  NORMAL = 1,
  LOW = 0
}