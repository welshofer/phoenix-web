import { Coordinates, Transform } from './coordinates';
import { ContentRole, SlideObjectType } from './template';
import { TypographicRole } from './typography';
import { ColorRole } from './colors';

/**
 * Slide Content Models - New Architecture
 * Slides contain objects positioned on a 1920x1080 canvas
 */

// Base slide object that all content types extend
export interface SlideObject {
  id: string;
  type: SlideObjectType;
  coordinates: Coordinates;
  zIndex?: number;
  transform?: Transform;
  locked?: boolean;        // Prevent editing
  visible?: boolean;       // Show/hide object
  name?: string;          // User-friendly name for layers panel
  groupId?: string;       // For grouping objects
}

// Text object with typography and color roles
export interface TextObject extends SlideObject {
  type: 'text';
  content: string;
  role: ContentRole;
  typographicRole?: TypographicRole;  // Override template default
  colorRole?: ColorRole;               // Override template default
  customStyles?: {                     // Direct style overrides
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
  };
}

// Image object
export interface ImageObject extends SlideObject {
  type: 'image';
  src: string;
  alt?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
  };
}

// Video object
export interface VideoObject extends SlideObject {
  type: 'video';
  src: string;
  poster?: string;         // Preview image
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  startTime?: number;      // Start playback at this time
  endTime?: number;        // End playback at this time
}

// Shape object for decorative elements
export interface ShapeObject extends SlideObject {
  type: 'shape';
  shape: 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'custom';
  fill?: ColorRole | string;
  stroke?: ColorRole | string;
  strokeWidth?: number;
  customPath?: string;     // SVG path for custom shapes
}

// Table object
export interface TableObject extends SlideObject {
  type: 'table';
  data: Array<Array<string | number>>;
  headers?: string[];
  styles?: {
    headerBackground?: ColorRole | string;
    headerText?: ColorRole | string;
    cellBackground?: ColorRole | string;
    cellText?: ColorRole | string;
    borderColor?: ColorRole | string;
    borderWidth?: number;
  };
}

// Chart object
export interface ChartObject extends SlideObject {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  data: any;  // Chart.js or similar data format
  options?: any;  // Chart configuration options
}

// Union type for all slide objects
export type SlideObjectUnion = 
  | TextObject 
  | ImageObject 
  | VideoObject 
  | ShapeObject 
  | TableObject 
  | ChartObject;

// Slide types (define the semantic purpose)
export enum SlideType {
  TITLE = 'title',
  SECTION = 'section',
  CONTENT = 'content',
  BULLETS = 'bullets',
  IMAGE = 'image',
  IMAGE_WITH_TEXT = 'imageWithText',
  TWO_COLUMN = 'twoColumn',
  THREE_COLUMN = 'threeColumn',
  QUOTE = 'quote',
  COMPARISON = 'comparison',
  TIMELINE = 'timeline',
  CHART = 'chart',
  TABLE = 'table',
  VIDEO = 'video',
  BLANK = 'blank',
  CUSTOM = 'custom'
}

// Complete slide definition
export interface Slide {
  id: string;
  type: SlideType;
  objects: SlideObjectUnion[];    // All objects on the slide
  order: number;                  // Position in presentation
  
  // Template and theme references
  templateId?: string;            // Which template to use
  templateLayoutId?: string;      // Specific layout override
  colorSetId?: string;           // Color set override
  typographySetId?: string;      // Typography set override
  
  // Slide-specific settings
  background?: {
    type: 'color' | 'gradient' | 'image' | 'video';
    value: string;
    opacity?: number;
  };
  
  // Transitions
  transition?: {
    type: 'none' | 'fade' | 'slide' | 'zoom' | 'flip';
    duration?: number;           // milliseconds
    direction?: 'left' | 'right' | 'up' | 'down';
  };
  
  // Animations for objects
  animations?: Array<{
    objectId: string;
    trigger: 'onEnter' | 'onClick' | 'withPrevious' | 'afterPrevious';
    type: 'fadeIn' | 'slideIn' | 'zoomIn' | 'rotate' | 'bounce';
    duration?: number;
    delay?: number;
  }>;
  
  // Metadata
  notes?: string;                 // Speaker notes
  duration?: number;              // Auto-advance timing
  createdAt: Date;
  updatedAt: Date;
  
  // Layout hints
  layoutGuides?: Array<{
    type: 'vertical' | 'horizontal';
    position: number;
  }>;
}

// Helper type for slide content based on type
export interface SlideContentMap {
  [SlideType.TITLE]: {
    title: TextObject;
    subtitle?: TextObject;
  };
  [SlideType.BULLETS]: {
    heading?: TextObject;
    bullets: TextObject[];
  };
  [SlideType.IMAGE]: {
    image: ImageObject;
    caption?: TextObject;
  };
  [SlideType.QUOTE]: {
    quote: TextObject;
    citation?: TextObject;
  };
  // ... extend for other types
}

// Validation helpers
export function validateSlideObject(obj: SlideObjectUnion): boolean {
  const { coordinates } = obj;
  return (
    coordinates.x >= 0 &&
    coordinates.y >= 0 &&
    coordinates.x + coordinates.width <= 1920 &&
    coordinates.y + coordinates.height <= 1080
  );
}

export function getSlideObjectsInZone(
  slide: Slide,
  zoneCoordinates: Coordinates
): SlideObjectUnion[] {
  return slide.objects.filter(obj => {
    const { x, y, width, height } = obj.coordinates;
    const zx = zoneCoordinates.x;
    const zy = zoneCoordinates.y;
    const zw = zoneCoordinates.width;
    const zh = zoneCoordinates.height;
    
    // Check if object overlaps with zone
    return !(x + width < zx || x > zx + zw || y + height < zy || y > zy + zh);
  });
}