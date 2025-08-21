/**
 * Typography System Models
 * Defines typographic roles and complete typography sets
 * Each role maps to specific font properties
 */

// All possible typographic roles in a presentation
export type TypographicRole =
  | 'title'           // Main slide title
  | 'subtitle'        // Secondary title
  | 'sectionHeader'   // Section divider
  | 'heading1'        // Primary heading
  | 'heading2'        // Secondary heading
  | 'heading3'        // Tertiary heading
  | 'body'           // Regular body text
  | 'bodyLarge'      // Emphasized body text
  | 'bodySmall'      // De-emphasized body text
  | 'bullet'         // Bullet point text
  | 'quote'          // Quotation text
  | 'citation'       // Quote attribution
  | 'caption'        // Image/table captions
  | 'label'          // UI labels
  | 'footnote'       // Small annotations
  | 'code'           // Code/monospace text
  | 'emphasis'       // Emphasized inline text
  | 'strong'         // Strong inline text
  | 'pageNumber'     // Page numbering
  | 'date'           // Date text
  | 'footer'         // Footer text
  | 'header'         // Header text
  | 'watermark';     // Watermark text

// Font weight options
export type FontWeight = 
  | 100  // Thin
  | 200  // Extra Light
  | 300  // Light
  | 400  // Regular
  | 500  // Medium
  | 600  // Semi Bold
  | 700  // Bold
  | 800  // Extra Bold
  | 900; // Black

// Font style options
export type FontStyle = 'normal' | 'italic' | 'oblique';

// Text decoration options
export type TextDecoration = 'none' | 'underline' | 'overline' | 'line-through';

// Text transform options
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

// Letter spacing (tracking)
export type LetterSpacing = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | number;

// Line height (leading)
export type LineHeight = 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose' | number;

// Individual typography definition for a role
export interface TypographyDefinition {
  fontFamily: string | string[];  // Font stack
  fontSize: number;               // Size in pixels (at 1920x1080)
  fontWeight: FontWeight;
  fontStyle?: FontStyle;
  textDecoration?: TextDecoration;
  textTransform?: TextTransform;
  letterSpacing?: LetterSpacing;
  lineHeight?: LineHeight;
  
  // Advanced properties
  fontVariant?: string;
  fontFeatureSettings?: string;
  fontVariationSettings?: string;
  
  // Paragraph styles
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textIndent?: number;
  paragraphSpacing?: number;
  
  // Responsive scaling
  minFontSize?: number;      // Minimum size when scaling
  maxFontSize?: number;      // Maximum size when scaling
  scaleFactor?: number;      // Multiplier for responsive scaling
}

// Complete typography set containing all roles
export interface TypographySet {
  id: string;
  name: string;
  description?: string;
  author?: string;
  
  // Font families used in this set
  primaryFont: string | string[];
  secondaryFont?: string | string[];
  monoFont?: string | string[];
  
  // Role definitions
  roles: Record<TypographicRole, TypographyDefinition>;
  
  // Global settings
  baseSize?: number;          // Base font size for calculations
  scaleRatio?: number;        // Ratio for size hierarchy (e.g., 1.25 for major third)
  
  // Font loading
  googleFonts?: string[];      // Google Fonts to load
  customFonts?: Array<{        // Custom font files
    family: string;
    src: string;
    weight?: FontWeight;
    style?: FontStyle;
  }>;
  
  // Metadata
  tags?: string[];
  category?: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  license?: string;
}

// Preset typography scales
export const TYPOGRAPHY_SCALES = {
  minorSecond: 1.067,
  majorSecond: 1.125,
  minorThird: 1.2,
  majorThird: 1.25,
  perfectFourth: 1.333,
  augmentedFourth: 1.414,
  perfectFifth: 1.5,
  goldenRatio: 1.618,
} as const;

// Helper function to generate font sizes based on scale
export function generateFontSizes(
  baseSize: number,
  scale: number,
  steps: number
): number[] {
  const sizes: number[] = [];
  for (let i = -steps; i <= steps; i++) {
    sizes.push(Math.round(baseSize * Math.pow(scale, i)));
  }
  return sizes;
}

// Default typography set (fallback)
export const DEFAULT_TYPOGRAPHY_SET: TypographySet = {
  id: 'default',
  name: 'Default Typography',
  primaryFont: ['Inter', 'system-ui', 'sans-serif'],
  secondaryFont: ['Inter', 'system-ui', 'sans-serif'],
  monoFont: ['JetBrains Mono', 'Consolas', 'monospace'],
  
  baseSize: 24,
  scaleRatio: TYPOGRAPHY_SCALES.majorThird,
  
  roles: {
    title: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 96,
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: -0.02,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 48,
      fontWeight: 400,
      lineHeight: 1.3,
      textAlign: 'center',
    },
    sectionHeader: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 72,
      fontWeight: 600,
      lineHeight: 1.2,
      textAlign: 'left',
    },
    heading1: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 64,
      fontWeight: 600,
      lineHeight: 1.2,
    },
    heading2: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 48,
      fontWeight: 600,
      lineHeight: 1.3,
    },
    heading3: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 36,
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 28,
      fontWeight: 400,
      lineHeight: 1.6,
    },
    bodyLarge: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 32,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    bodySmall: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 24,
      fontWeight: 400,
      lineHeight: 1.6,
    },
    bullet: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 32,
      fontWeight: 400,
      lineHeight: 1.8,
    },
    quote: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 48,
      fontWeight: 300,
      fontStyle: 'italic',
      lineHeight: 1.4,
      textAlign: 'center',
    },
    citation: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 28,
      fontWeight: 400,
      lineHeight: 1.4,
      textAlign: 'center',
    },
    caption: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 20,
      fontWeight: 400,
      lineHeight: 1.4,
      fontStyle: 'italic',
    },
    label: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 18,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: 0.05,
    },
    footnote: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.4,
    },
    code: {
      fontFamily: ['JetBrains Mono', 'Consolas', 'monospace'],
      fontSize: 24,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    emphasis: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 28,
      fontWeight: 400,
      fontStyle: 'italic',
    },
    strong: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 28,
      fontWeight: 700,
    },
    pageNumber: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 18,
      fontWeight: 400,
    },
    date: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 18,
      fontWeight: 400,
    },
    footer: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.4,
    },
    header: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 20,
      fontWeight: 500,
      lineHeight: 1.4,
    },
    watermark: {
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      fontSize: 120,
      fontWeight: 700,
      textTransform: 'uppercase',
    },
  },
};