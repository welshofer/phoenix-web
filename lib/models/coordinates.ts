/**
 * Base coordinate system for slides
 * All slides use 1920x1080 (16:9) coordinate system
 * Origin (0,0) is top-left corner
 */

export const SLIDE_DIMENSIONS = {
  WIDTH: 1920,
  HEIGHT: 1080,
  ASPECT_RATIO: '16:9' as const,
} as const;

export interface Coordinates {
  x: number;      // 0-1920 pixels from left edge
  y: number;      // 0-1080 pixels from top edge
  width: number;  // Width in pixels (max 1920)
  height: number; // Height in pixels (max 1080)
}

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type HorizontalAlign = 'left' | 'center' | 'right' | 'justify';
export type VerticalAlign = 'top' | 'middle' | 'bottom';

export interface Alignment {
  horizontal: HorizontalAlign;
  vertical: VerticalAlign;
}

export interface Transform {
  rotation?: number;    // Degrees
  scale?: number;       // Multiplier (1 = 100%)
  skewX?: number;      // Degrees
  skewY?: number;      // Degrees
  opacity?: number;    // 0-1
}

// Common safe zones and grids
export const SAFE_ZONES = {
  // 10% margin on all sides
  standard: {
    x: 192,
    y: 108,
    width: 1536,
    height: 864,
  },
  // 5% margin for fuller layouts
  extended: {
    x: 96,
    y: 54,
    width: 1728,
    height: 972,
  },
  // Full bleed
  full: {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
  },
} as const;

// 12-column grid system
export const GRID_SYSTEM = {
  columns: 12,
  columnWidth: 160, // 1920 / 12
  gutter: 30,
  margin: 120,
} as const;

// Utility functions
export function percentToPixels(percent: number, dimension: 'width' | 'height'): number {
  const max = dimension === 'width' ? SLIDE_DIMENSIONS.WIDTH : SLIDE_DIMENSIONS.HEIGHT;
  return Math.round((percent / 100) * max);
}

export function pixelsToPercent(pixels: number, dimension: 'width' | 'height'): number {
  const max = dimension === 'width' ? SLIDE_DIMENSIONS.WIDTH : SLIDE_DIMENSIONS.HEIGHT;
  return (pixels / max) * 100;
}

export function snapToGrid(value: number, gridSize: number = GRID_SYSTEM.columnWidth): number {
  return Math.round(value / gridSize) * gridSize;
}

export function getGridColumn(columnIndex: number, span: number = 1): Coordinates {
  const x = GRID_SYSTEM.margin + (columnIndex * GRID_SYSTEM.columnWidth);
  const width = (span * GRID_SYSTEM.columnWidth) - GRID_SYSTEM.gutter;
  return {
    x,
    y: 0, // Caller should set y position
    width,
    height: 0, // Caller should set height
  };
}

export function isWithinBounds(coord: Coordinates): boolean {
  return (
    coord.x >= 0 &&
    coord.y >= 0 &&
    coord.x + coord.width <= SLIDE_DIMENSIONS.WIDTH &&
    coord.y + coord.height <= SLIDE_DIMENSIONS.HEIGHT
  );
}

// Common layout presets
export const LAYOUT_PRESETS = {
  fullscreen: { x: 0, y: 0, width: 1920, height: 1080 },
  centered: { x: 480, y: 270, width: 960, height: 540 },
  header: { x: 120, y: 80, width: 1680, height: 140 },
  footer: { x: 120, y: 960, width: 1680, height: 60 },
  leftHalf: { x: 0, y: 0, width: 960, height: 1080 },
  rightHalf: { x: 960, y: 0, width: 960, height: 1080 },
  topHalf: { x: 0, y: 0, width: 1920, height: 540 },
  bottomHalf: { x: 0, y: 540, width: 1920, height: 540 },
  mainContent: { x: 120, y: 240, width: 1680, height: 720 },
  sidebar: { x: 1520, y: 120, width: 320, height: 840 },
} as const;

// Additional utility functions for testing
export function validateCoordinates(coords: Coordinates): boolean {
  return coords.width > 0 && coords.height > 0;
}

export function scaleCoordinates(coords: Coordinates, scaleX: number, scaleY?: number): Coordinates {
  const sy = scaleY ?? scaleX;
  return {
    x: coords.x * scaleX,
    y: coords.y * sy,
    width: coords.width * scaleX,
    height: coords.height * sy,
  };
}

export function translateCoordinates(coords: Coordinates, dx: number, dy: number): Coordinates {
  return {
    x: coords.x + dx,
    y: coords.y + dy,
    width: coords.width,
    height: coords.height,
  };
}

export function containsPoint(coords: Coordinates, x: number, y: number): boolean {
  return (
    x >= coords.x &&
    x <= coords.x + coords.width &&
    y >= coords.y &&
    y <= coords.y + coords.height
  );
}

export function getCenter(coords: Coordinates): { x: number; y: number } {
  return {
    x: coords.x + coords.width / 2,
    y: coords.y + coords.height / 2,
  };
}

export function getBoundingBox(rectangles: Coordinates[]): Coordinates {
  if (rectangles.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const rect of rectangles) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function doOverlap(rect1: Coordinates, rect2: Coordinates): boolean {
  // If one rectangle is to the left of the other
  if (rect1.x + rect1.width <= rect2.x || rect2.x + rect2.width <= rect1.x) {
    return false;
  }

  // If one rectangle is above the other
  if (rect1.y + rect1.height <= rect2.y || rect2.y + rect2.height <= rect1.y) {
    return false;
  }

  return true;
}

export function constrainToSlide(coords: Coordinates): Coordinates {
  let { x, y, width, height } = coords;

  // Resize if larger than slide
  if (width > SLIDE_DIMENSIONS.WIDTH) {
    width = SLIDE_DIMENSIONS.WIDTH;
  }
  if (height > SLIDE_DIMENSIONS.HEIGHT) {
    height = SLIDE_DIMENSIONS.HEIGHT;
  }

  // Constrain position
  if (x < 0) {
    x = 0;
  } else if (x + width > SLIDE_DIMENSIONS.WIDTH) {
    x = SLIDE_DIMENSIONS.WIDTH - width;
  }

  if (y < 0) {
    y = 0;
  } else if (y + height > SLIDE_DIMENSIONS.HEIGHT) {
    y = SLIDE_DIMENSIONS.HEIGHT - height;
  }

  return { x, y, width, height };
}