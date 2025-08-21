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