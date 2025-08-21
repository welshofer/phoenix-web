import { Coordinates, Alignment, Padding, Transform } from './coordinates';
import { SlideType } from './slide';
import { TypographicRole } from './typography';
import { ColorRole } from './colors';

/**
 * Template System Models
 * Templates define the physical layout for all slide types
 * They specify where content zones appear on the 1920x1080 canvas
 */

// Content roles that can appear in zones
export type ContentRole = 
  | 'title'
  | 'subtitle'
  | 'header'
  | 'body'
  | 'bullets'
  | 'image'
  | 'video'
  | 'table'
  | 'chart'
  | 'quote'
  | 'citation'
  | 'caption'
  | 'footer'
  | 'pageNumber'
  | 'date'
  | 'logo';

// Types of slide objects that can be placed in zones
export type SlideObjectType = 
  | 'text'
  | 'image'
  | 'video'
  | 'shape'
  | 'table'
  | 'chart'
  | 'embed';

// How content overflows in a zone
export type OverflowBehavior = 
  | 'hidden'      // Clip content
  | 'scroll'      // Show scrollbar
  | 'visible'     // Allow overflow
  | 'ellipsis'    // Show ... for text
  | 'shrink'      // Reduce font size to fit
  | 'paginate';   // Create additional slides

// A zone is a defined area on a slide that can contain content
export interface TemplateZone {
  id: string;
  role: ContentRole;
  coordinates: Coordinates;
  padding?: Padding;
  alignment?: Alignment;
  overflow?: OverflowBehavior;
  zIndex?: number;
  transform?: Transform;
  
  // Content constraints
  acceptedTypes: SlideObjectType[];
  required: boolean;
  maxItems?: number;
  minItems?: number;
  
  // Styling hints
  defaultTypographicRole?: TypographicRole;
  defaultColorRole?: ColorRole;
  
  // Behavior
  editable?: boolean;
  resizable?: boolean;
  draggable?: boolean;
}

// Background definition for slides
export interface BackgroundDefinition {
  type: 'solid' | 'gradient' | 'image' | 'video' | 'pattern';
  value: string | GradientDefinition | ImageDefinition;
  opacity?: number;
  blur?: number;
}

export interface GradientDefinition {
  type: 'linear' | 'radial' | 'conic';
  angle?: number; // For linear gradients
  stops: Array<{
    color: string;
    position: number; // 0-100
  }>;
}

export interface ImageDefinition {
  url: string;
  fit: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  position?: string; // CSS background-position
  repeat?: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
}

// Master elements appear on multiple slides (logo, page numbers, etc.)
export interface MasterElement {
  id: string;
  type: 'logo' | 'pageNumber' | 'date' | 'footer' | 'header' | 'watermark';
  coordinates: Coordinates;
  content?: string | ImageDefinition;
  typographicRole?: TypographicRole;
  colorRole?: ColorRole;
  transform?: Transform;
  
  // Visibility rules
  visibleOn?: SlideType[];      // Only show on these slide types
  excludeFrom?: SlideType[];    // Hide on these slide types
  visibleOnSlides?: number[];   // Specific slide numbers
  excludeFromSlides?: number[]; // Specific slide numbers to exclude
}

// Layout definition for a specific slide type
export interface SlideLayout {
  slideType: SlideType;
  zones: TemplateZone[];
  background?: BackgroundDefinition;
  masterElements?: MasterElement[];
  
  // Grid and guides for editing
  gridEnabled?: boolean;
  guides?: Array<{
    orientation: 'horizontal' | 'vertical';
    position: number;
    color?: string;
  }>;
}

// Complete template definition
export interface Template {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version?: string;
  thumbnail?: string;
  
  // Layouts for each slide type
  layouts: Record<SlideType, SlideLayout>;
  
  // Global master elements (appear on all slides unless excluded)
  globalMasterElements?: MasterElement[];
  
  // Default settings
  defaultBackground?: BackgroundDefinition;
  defaultPadding?: Padding;
  defaultAlignment?: Alignment;
  
  // Template metadata
  tags?: string[];
  category?: 'business' | 'education' | 'creative' | 'minimal' | 'technical';
  license?: string;
}

// Content requirement for slide types (the "contract")
export interface ContentRequirement {
  role: ContentRole;
  objectType: SlideObjectType;
  required: boolean;
  multiple?: boolean;
  maxCount?: number;
  minCount?: number;
  constraints?: ContentConstraints;
}

export interface ContentConstraints {
  maxLength?: number;      // For text
  minLength?: number;      // For text
  maxLines?: number;       // For text
  aspectRatio?: string;    // For images/videos (e.g., "16:9")
  maxFileSize?: number;    // In bytes
  allowedFormats?: string[]; // File extensions
}

// Slide type definition with content contract
export interface SlideTypeDefinition {
  id: SlideType;
  name: string;
  description?: string;
  icon?: string;
  
  // Content contract - what this slide type accepts
  contentRequirements: ContentRequirement[];
  
  // Suggested use cases
  suggestedFor?: string[];
  notRecommendedFor?: string[];
  
  // Behavior hints
  allowsCustomLayout?: boolean;
  allowsMultipleImages?: boolean;
  allowsVideo?: boolean;
}

// Template validation
export function validateTemplateZone(zone: TemplateZone): boolean {
  // Check if coordinates are within bounds
  const { x, y, width, height } = zone.coordinates;
  return (
    x >= 0 &&
    y >= 0 &&
    x + width <= 1920 &&
    y + height <= 1080 &&
    width > 0 &&
    height > 0
  );
}

export function validateTemplate(template: Template): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check each layout
  Object.entries(template.layouts).forEach(([slideType, layout]) => {
    layout.zones.forEach(zone => {
      if (!validateTemplateZone(zone)) {
        errors.push(`Invalid zone coordinates in ${slideType}: ${zone.id}`);
      }
    });
    
    // Check for overlapping zones if needed
    // Check for required content roles
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}