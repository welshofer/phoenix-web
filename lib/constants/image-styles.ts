/**
 * Image generation styles - from macOS implementation
 * DO NOT MODIFY - these match exactly what was provided
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
  | 'polaroid'
  | 'kodachrome'
  | 'filmNoir'
  | 'techNoir'
  | 'streetPhoto'
  | 'anselAdams'
  | 'rembrandt'
  | 'daVinci'
  | 'monet'
  | 'picasso'
  | 'dali'
  | 'banksy'
  | 'haring'
  | 'basquiat'
  | 'mondrian'
  | 'kandinsky'
  | 'pollock'
  | 'rothko'
  | 'oKeeffe'
  | 'hopper'
  | 'wyeth'
  | 'rockwell'
  | 'caravaggio'
  | 'vermeer'
  | 'botticelli'
  | 'michelangelo'
  | 'raphael'
  | 'titian'
  | 'rubens'
  | 'velazquez'
  | 'goya'
  | 'turner'
  | 'constable'
  | 'cezanne'
  | 'gauguin'
  | 'toulouse'
  | 'degas'
  | 'renoir'
  | 'manet'
  | 'munch'
  | 'schiele'
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
  polaroid: "instant camera photo, Polaroid style, vintage colors, slightly faded, white border frame, nostalgic 1970s-80s aesthetic",
  kodachrome: "Kodachrome film photography, vibrant saturated colors, fine grain, classic American color palette, mid-20th century look",
  filmNoir: "film noir style, high contrast black and white, dramatic shadows, venetian blind lighting, 1940s detective movie aesthetic",
  techNoir: "tech noir aesthetic, dark cyberpunk, neon accent lighting, rain-slicked surfaces, Blade Runner style, futuristic dystopian",
  streetPhoto: "street photography style, candid moment, urban environment, documentary aesthetic, Henri Cartier-Bresson influence",
  anselAdams: "Ansel Adams landscape photography style, dramatic black and white, zone system exposure, sharp detail throughout, majestic nature",
  rembrandt: "Rembrandt lighting and style, dramatic chiaroscuro, golden warm tones, Dutch master painting technique, baroque portraiture",
  daVinci: "Leonardo da Vinci style, Renaissance master technique, sfumato shading, anatomical precision, detailed sketching, sepia tones",
  monet: "Claude Monet impressionist style, loose brushstrokes, emphasis on light and atmosphere, water lilies, soft pastels, plein air painting",
  picasso: "Pablo Picasso cubist style, geometric fragmentation, multiple perspectives, bold angular shapes, abstract modernist approach",
  dali: "Salvador Dali surrealist style, melting forms, dreamlike imagery, impossible perspectives, hyper-detailed bizarre landscapes",
  banksy: "Banksy street art style, stencil graffiti, political satire, high contrast black and white with selective color, urban wall texture",
  haring: "Keith Haring style, bold outlined figures, radiating lines, primary colors, pop art energy, street art influence",
  basquiat: "Jean-Michel Basquiat neo-expressionist style, raw gestural marks, crown motifs, text elements, graffiti influence, bold colors",
  mondrian: "Piet Mondrian neoplasticism, primary colors, black grid lines, geometric abstraction, De Stijl movement, balanced composition",
  kandinsky: "Wassily Kandinsky abstract expressionism, musical color theory, geometric and organic forms, spiritual abstraction, dynamic composition",
  pollock: "Jackson Pollock action painting, drip technique, chaotic splatter patterns, abstract expressionism, all-over composition, energetic gestures",
  rothko: "Mark Rothko color field painting, large blocks of color, soft edges, emotional depth, meditative abstraction, luminous hues",
  oKeeffe: "Georgia O'Keeffe style, magnified flowers, desert landscapes, bold organic forms, sensual curves, American modernism",
  hopper: "Edward Hopper style, American realism, isolated figures, dramatic light and shadow, urban loneliness, architectural emphasis",
  wyeth: "Andrew Wyeth style, tempera painting technique, rural Americana, muted earth tones, precise realism, melancholic mood",
  rockwell: "Norman Rockwell illustration style, American narrative scenes, detailed storytelling, warm nostalgia, Saturday Evening Post aesthetic",
  caravaggio: "Caravaggio baroque style, dramatic tenebrism, strong chiaroscuro, theatrical lighting, emotional intensity, dark backgrounds",
  vermeer: "Johannes Vermeer Dutch Golden Age style, soft natural light, domestic interior scenes, pearl earring detail, quiet intimacy",
  botticelli: "Sandro Botticelli Renaissance style, flowing lines, idealized beauty, mythological themes, delicate details, tempera painting",
  michelangelo: "Michelangelo High Renaissance style, sculptural forms, powerful anatomy, Sistine Chapel grandeur, heroic figures, fresco technique",
  raphael: "Raphael Renaissance style, harmonious composition, serene Madonnas, balanced perfection, graceful figures, clear color",
  titian: "Titian Venetian Renaissance, rich oil colors, golden tones, sumptuous textures, masterful color harmony, loose brushwork",
  rubens: "Peter Paul Rubens baroque style, fleshy figures, dynamic movement, rich colors, dramatic compositions, sensual energy",
  velazquez: "Diego Velázquez Spanish baroque, masterful brushwork, optical realism, court portraiture, Las Meninas complexity, subtle tonality",
  goya: "Francisco Goya style, dark romanticism, Spanish masters, haunting black paintings, social commentary, dramatic contrasts",
  turner: "J.M.W. Turner romantic landscape, atmospheric effects, swirling clouds and mist, golden light, maritime scenes, proto-impressionism",
  constable: "John Constable English romantic landscape, pastoral scenes, cloud studies, natural observation, green countryside, atmospheric effects",
  cezanne: "Paul Cézanne post-impressionist style, geometric simplification, multiple viewpoints, structured brushstrokes, Mont Sainte-Victoire",
  gauguin: "Paul Gauguin post-impressionist style, bold flat colors, Tahitian themes, primitive influences, symbolic content, decorative patterns",
  toulouse: "Henri de Toulouse-Lautrec style, Moulin Rouge posters, Belle Époque Paris, lithographic style, cabaret scenes, bold outlines",
  degas: "Edgar Degas impressionist style, ballet dancers, pastel technique, unusual angles, movement capture, indoor scenes",
  renoir: "Pierre-Auguste Renoir impressionist style, dappled light, joyful scenes, soft brushwork, rosy flesh tones, outdoor gatherings",
  manet: "Édouard Manet style, modern life painting, bold brushstrokes, flat color areas, controversial subjects, Paris café scenes",
  munch: "Edvard Munch expressionist style, emotional anguish, swirling skies, The Scream influence, psychological themes, bold colors",
  schiele: "Egon Schiele expressionist style, contorted figures, angular lines, raw emotion, graphic sexuality, Austrian modernism",
  warhol: "Andy Warhol pop art style, silkscreen printing aesthetic, repeated images, bold commercial colors, celebrity portraits, Campbell's soup can influence",
  klimt: "Gustav Klimt Art Nouveau style, gold leaf details, decorative patterns, sensual figures, Byzantine influences, The Kiss aesthetic",
  matisse: "Henri Matisse Fauve style, paper cutouts influence, bold color blocks, decorative patterns, joyful simplicity, dance figures",
  sepia: "photorealistic, sepia toned, vintage photography, warm brown tones, sharp detail, professional quality",
  noctilux: "50mm f/1.4 portrait, extreme shallow DOF, swirled bokeh balls, tack sharp focal plane, smooth focus falloff, natural color grading, fine grain structure, medium format quality, rangefinder framing, Leica signature rendering, creamy background separation, subtle optical vignetting, high micro-contrast, organic tonal curve"
};

export enum ImagePriority {
  HIGH = 2,
  NORMAL = 1,
  LOW = 0
}