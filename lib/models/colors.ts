/**
 * Color System Models
 * Defines color roles and complete color sets (themes)
 * Each role maps to specific colors that can be applied to text and graphics
 */

// All possible color roles in a presentation
export type ColorRole =
  | 'primary'           // Primary brand color
  | 'primaryLight'      // Lighter variant
  | 'primaryDark'       // Darker variant
  | 'secondary'         // Secondary brand color
  | 'secondaryLight'    
  | 'secondaryDark'
  | 'accent'           // Accent/highlight color
  | 'accentLight'
  | 'accentDark'
  | 'background'       // Slide background
  | 'backgroundAlt'    // Alternative background
  | 'surface'          // Surface/card background
  | 'surfaceLight'
  | 'surfaceDark'
  | 'text'             // Primary text color
  | 'textLight'        // Secondary/muted text
  | 'textDark'         // Emphasized text
  | 'textInverse'      // Text on dark backgrounds
  | 'heading'          // Heading text color
  | 'link'             // Hyperlink color
  | 'linkHover'        // Hyperlink hover state
  | 'border'           // Border color
  | 'borderLight'
  | 'borderDark'
  | 'divider'          // Divider lines
  | 'shadow'           // Shadow color
  | 'overlay'          // Overlay background
  | 'success'          // Success state
  | 'warning'          // Warning state
  | 'error'            // Error state
  | 'info'             // Info state
  | 'chart1'           // Chart colors
  | 'chart2'
  | 'chart3'
  | 'chart4'
  | 'chart5'
  | 'chart6'
  | 'chart7'
  | 'chart8';

// Color format types
export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';

// Individual color definition
export interface ColorDefinition {
  value: string;              // Color value (hex, rgb, etc.)
  opacity?: number;           // 0-1
  contrast?: ColorRole;       // Suggested contrasting color role
  description?: string;       // Usage description
}

// Complete color set/theme
export interface ColorSet {
  id: string;
  name: string;
  description?: string;
  author?: string;
  
  // Color definitions for each role
  colors: Record<ColorRole, ColorDefinition>;
  
  // Color mode
  mode: 'light' | 'dark' | 'auto';
  
  // Semantic color mappings
  semantic?: {
    titles?: ColorRole;
    headings?: ColorRole;
    body?: ColorRole;
    emphasis?: ColorRole;
    bullets?: ColorRole;
    quotes?: ColorRole;
    links?: ColorRole;
    captions?: ColorRole;
    backgrounds?: ColorRole;
    borders?: ColorRole;
  };
  
  // Gradient definitions
  gradients?: Record<string, GradientColorDefinition>;
  
  // Metadata
  tags?: string[];
  category?: 'vibrant' | 'muted' | 'monochrome' | 'pastel' | 'dark' | 'light';
  license?: string;
}

export interface GradientColorDefinition {
  type: 'linear' | 'radial' | 'conic';
  angle?: number;
  stops: Array<{
    color: ColorRole | string;
    position: number; // 0-100
  }>;
}

// Color utility functions
export interface ColorUtils {
  hexToRgb(hex: string): { r: number; g: number; b: number };
  rgbToHex(r: number, g: number, b: number): string;
  adjustBrightness(color: string, amount: number): string;
  getContrast(color1: string, color2: string): number;
  isLight(color: string): boolean;
  generatePalette(baseColor: string, count: number): string[];
}

// Predefined color palettes
export const COLOR_PALETTES = {
  // Professional blue theme
  professional: {
    primary: '#1976D2',
    primaryLight: '#42A5F5',
    primaryDark: '#0D47A1',
    secondary: '#424242',
    accent: '#FF6B35',
    background: '#FFFFFF',
    text: '#212121',
    textLight: '#757575',
  },
  
  // Modern dark theme
  modernDark: {
    primary: '#BB86FC',
    primaryLight: '#E1BEE7',
    primaryDark: '#6200EA',
    secondary: '#03DAC6',
    accent: '#FF0266',
    background: '#121212',
    text: '#FFFFFF',
    textLight: '#B3B3B3',
  },
  
  // Minimalist theme
  minimalist: {
    primary: '#000000',
    primaryLight: '#333333',
    primaryDark: '#000000',
    secondary: '#666666',
    accent: '#0066CC',
    background: '#FFFFFF',
    text: '#000000',
    textLight: '#666666',
  },
  
  // Warm earth tones
  earthTones: {
    primary: '#8B4513',
    primaryLight: '#A0522D',
    primaryDark: '#654321',
    secondary: '#228B22',
    accent: '#FF8C00',
    background: '#FFF8DC',
    text: '#3E2723',
    textLight: '#5D4037',
  },
} as const;

// Default color set
export const DEFAULT_COLOR_SET: ColorSet = {
  id: 'default',
  name: 'Default Colors',
  mode: 'light',
  
  colors: {
    primary: { value: '#1976D2' },
    primaryLight: { value: '#42A5F5' },
    primaryDark: { value: '#0D47A1' },
    secondary: { value: '#DC004E' },
    secondaryLight: { value: '#F06292' },
    secondaryDark: { value: '#880E4F' },
    accent: { value: '#FF6B35' },
    accentLight: { value: '#FF8A65' },
    accentDark: { value: '#E64A19' },
    background: { value: '#FFFFFF' },
    backgroundAlt: { value: '#F5F5F5' },
    surface: { value: '#FFFFFF' },
    surfaceLight: { value: '#FAFAFA' },
    surfaceDark: { value: '#EEEEEE' },
    text: { value: '#212121' },
    textLight: { value: '#757575' },
    textDark: { value: '#000000' },
    textInverse: { value: '#FFFFFF' },
    heading: { value: '#212121' },
    link: { value: '#1976D2' },
    linkHover: { value: '#0D47A1' },
    border: { value: '#E0E0E0' },
    borderLight: { value: '#F5F5F5' },
    borderDark: { value: '#BDBDBD' },
    divider: { value: '#E0E0E0' },
    shadow: { value: 'rgba(0,0,0,0.1)' },
    overlay: { value: 'rgba(0,0,0,0.5)' },
    success: { value: '#4CAF50' },
    warning: { value: '#FF9800' },
    error: { value: '#F44336' },
    info: { value: '#2196F3' },
    chart1: { value: '#1976D2' },
    chart2: { value: '#DC004E' },
    chart3: { value: '#FF6B35' },
    chart4: { value: '#4CAF50' },
    chart5: { value: '#9C27B0' },
    chart6: { value: '#FF9800' },
    chart7: { value: '#00BCD4' },
    chart8: { value: '#795548' },
  },
  
  semantic: {
    titles: 'heading',
    headings: 'heading',
    body: 'text',
    emphasis: 'primary',
    bullets: 'text',
    quotes: 'textLight',
    links: 'link',
    captions: 'textLight',
    backgrounds: 'background',
    borders: 'border',
  },
  
  gradients: {
    primary: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: 'primary', position: 0 },
        { color: 'primaryDark', position: 100 },
      ],
    },
    hero: {
      type: 'linear',
      angle: 45,
      stops: [
        { color: 'primary', position: 0 },
        { color: 'accent', position: 100 },
      ],
    },
  },
};

// Helper to get text color based on background
export function getContrastText(backgroundColor: string, lightColor = '#FFFFFF', darkColor = '#000000'): string {
  // Simple luminance calculation
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? darkColor : lightColor;
}