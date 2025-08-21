import { Template } from '@/lib/models/template';
import { SlideType } from '@/lib/models/slide';
import { SAFE_ZONES, LAYOUT_PRESETS } from '@/lib/models/coordinates';

/**
 * Modern Template
 * A clean, professional template with good typography hierarchy
 */
export const modernTemplate: Template = {
  id: 'modern',
  name: 'Modern',
  description: 'A clean, professional template suitable for business presentations',
  author: 'Phoenix Web',
  version: '1.0.0',
  category: 'business',
  
  // Default settings
  defaultBackground: {
    type: 'solid',
    value: '#FFFFFF',
  },
  
  defaultPadding: {
    top: 80,
    right: 120,
    bottom: 80,
    left: 120,
  },
  
  defaultAlignment: {
    horizontal: 'left',
    vertical: 'top',
  },
  
  // Global master elements (appear on all slides unless excluded)
  globalMasterElements: [
    {
      id: 'logo',
      type: 'logo',
      coordinates: { x: 1720, y: 980, width: 150, height: 75 },
      excludeFrom: [SlideType.TITLE, SlideType.SECTION],
    },
    {
      id: 'pageNumber',
      type: 'pageNumber',
      coordinates: { x: 900, y: 1020, width: 120, height: 40 },
      typographicRole: 'footnote',
      colorRole: 'textLight',
      excludeFrom: [SlideType.TITLE],
    },
  ],
  
  // Layouts for each slide type
  layouts: {
    [SlideType.TITLE]: {
      slideType: SlideType.TITLE,
      zones: [
        {
          id: 'title',
          role: 'title',
          coordinates: { x: 240, y: 400, width: 1440, height: 150 },
          alignment: { horizontal: 'center', vertical: 'middle' },
          acceptedTypes: ['text'],
          required: true,
          defaultTypographicRole: 'title',
          defaultColorRole: 'heading',
        },
        {
          id: 'subtitle',
          role: 'subtitle',
          coordinates: { x: 240, y: 580, width: 1440, height: 100 },
          alignment: { horizontal: 'center', vertical: 'middle' },
          acceptedTypes: ['text'],
          required: false,
          defaultTypographicRole: 'subtitle',
          defaultColorRole: 'textLight',
        },
      ],
      background: {
        type: 'gradient',
        value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        opacity: 0.05,
      },
    },
    
    [SlideType.SECTION]: {
      slideType: SlideType.SECTION,
      zones: [
        {
          id: 'sectionTitle',
          role: 'title',
          coordinates: { x: 120, y: 440, width: 1680, height: 200 },
          alignment: { horizontal: 'center', vertical: 'middle' },
          acceptedTypes: ['text'],
          required: true,
          defaultTypographicRole: 'sectionHeader',
          defaultColorRole: 'primary',
        },
      ],
      background: {
        type: 'solid',
        value: '#F5F5F5',
      },
    },
    
    [SlideType.CONTENT]: {
      slideType: SlideType.CONTENT,
      zones: [
        {
          id: 'header',
          role: 'header',
          coordinates: { x: 120, y: 120, width: 1680, height: 100 },
          acceptedTypes: ['text'],
          required: false,
          defaultTypographicRole: 'heading1',
          defaultColorRole: 'heading',
        },
        {
          id: 'body',
          role: 'body',
          coordinates: { x: 120, y: 260, width: 1680, height: 700 },
          acceptedTypes: ['text', 'image', 'video', 'table', 'chart'],
          required: true,
          defaultTypographicRole: 'body',
          defaultColorRole: 'text',
        },
      ],
    },
    
    [SlideType.BULLETS]: {
      slideType: SlideType.BULLETS,
      zones: [
        {
          id: 'header',
          role: 'header',
          coordinates: { x: 120, y: 120, width: 1680, height: 100 },
          acceptedTypes: ['text'],
          required: false,
          defaultTypographicRole: 'heading1',
          defaultColorRole: 'heading',
        },
        {
          id: 'bullets',
          role: 'bullets',
          coordinates: { x: 120, y: 280, width: 1680, height: 680 },
          padding: { top: 20, right: 40, bottom: 20, left: 40 },
          acceptedTypes: ['text'],
          required: true,
          maxItems: 6,
          defaultTypographicRole: 'bullet',
          defaultColorRole: 'text',
        },
      ],
    },
    
    [SlideType.IMAGE]: {
      slideType: SlideType.IMAGE,
      zones: [
        {
          id: 'header',
          role: 'header',
          coordinates: { x: 120, y: 80, width: 1680, height: 80 },
          acceptedTypes: ['text'],
          required: false,
          defaultTypographicRole: 'heading2',
          defaultColorRole: 'heading',
        },
        {
          id: 'image',
          role: 'image',
          coordinates: { x: 160, y: 200, width: 1600, height: 720 },
          acceptedTypes: ['image', 'video'],
          required: true,
          alignment: { horizontal: 'center', vertical: 'middle' },
        },
        {
          id: 'caption',
          role: 'caption',
          coordinates: { x: 160, y: 940, width: 1600, height: 60 },
          acceptedTypes: ['text'],
          required: false,
          alignment: { horizontal: 'center', vertical: 'middle' },
          defaultTypographicRole: 'caption',
          defaultColorRole: 'textLight',
        },
      ],
    },
    
    [SlideType.IMAGE_WITH_TEXT]: {
      slideType: SlideType.IMAGE_WITH_TEXT,
      zones: [
        {
          id: 'header',
          role: 'header',
          coordinates: { x: 120, y: 120, width: 1680, height: 100 },
          acceptedTypes: ['text'],
          required: false,
          defaultTypographicRole: 'heading1',
          defaultColorRole: 'heading',
        },
        {
          id: 'image',
          role: 'image',
          coordinates: { x: 120, y: 260, width: 780, height: 700 },
          acceptedTypes: ['image', 'video'],
          required: true,
        },
        {
          id: 'body',
          role: 'body',
          coordinates: { x: 960, y: 260, width: 840, height: 700 },
          padding: { top: 20, right: 20, bottom: 20, left: 40 },
          acceptedTypes: ['text'],
          required: true,
          defaultTypographicRole: 'body',
          defaultColorRole: 'text',
        },
      ],
    },
    
    [SlideType.TWO_COLUMN]: {
      slideType: SlideType.TWO_COLUMN,
      zones: [
        {
          id: 'header',
          role: 'header',
          coordinates: { x: 120, y: 120, width: 1680, height: 100 },
          acceptedTypes: ['text'],
          required: false,
          defaultTypographicRole: 'heading1',
          defaultColorRole: 'heading',
        },
        {
          id: 'leftColumn',
          role: 'body',
          coordinates: { x: 120, y: 260, width: 810, height: 700 },
          acceptedTypes: ['text', 'image', 'table'],
          required: true,
          defaultTypographicRole: 'body',
          defaultColorRole: 'text',
        },
        {
          id: 'rightColumn',
          role: 'body',
          coordinates: { x: 990, y: 260, width: 810, height: 700 },
          acceptedTypes: ['text', 'image', 'table'],
          required: true,
          defaultTypographicRole: 'body',
          defaultColorRole: 'text',
        },
      ],
    },
    
    [SlideType.THREE_COLUMN]: {
      slideType: SlideType.THREE_COLUMN,
      zones: [
        {
          id: 'header',
          role: 'header',
          coordinates: { x: 120, y: 120, width: 1680, height: 100 },
          acceptedTypes: ['text'],
          required: false,
          defaultTypographicRole: 'heading1',
          defaultColorRole: 'heading',
        },
        {
          id: 'leftColumn',
          role: 'body',
          coordinates: { x: 120, y: 260, width: 520, height: 700 },
          acceptedTypes: ['text', 'image'],
          required: true,
          defaultTypographicRole: 'body',
          defaultColorRole: 'text',
        },
        {
          id: 'centerColumn',
          role: 'body',
          coordinates: { x: 700, y: 260, width: 520, height: 700 },
          acceptedTypes: ['text', 'image'],
          required: true,
          defaultTypographicRole: 'body',
          defaultColorRole: 'text',
        },
        {
          id: 'rightColumn',
          role: 'body',
          coordinates: { x: 1280, y: 260, width: 520, height: 700 },
          acceptedTypes: ['text', 'image'],
          required: true,
          defaultTypographicRole: 'body',
          defaultColorRole: 'text',
        },
      ],
    },
    
    [SlideType.QUOTE]: {
      slideType: SlideType.QUOTE,
      zones: [
        {
          id: 'quote',
          role: 'quote',
          coordinates: { x: 240, y: 360, width: 1440, height: 300 },
          alignment: { horizontal: 'center', vertical: 'middle' },
          acceptedTypes: ['text'],
          required: true,
          defaultTypographicRole: 'quote',
          defaultColorRole: 'text',
        },
        {
          id: 'citation',
          role: 'citation',
          coordinates: { x: 240, y: 700, width: 1440, height: 80 },
          alignment: { horizontal: 'center', vertical: 'middle' },
          acceptedTypes: ['text'],
          required: false,
          defaultTypographicRole: 'citation',
          defaultColorRole: 'textLight',
        },
      ],
    },
    
    [SlideType.COMPARISON]: {
      slideType: SlideType.COMPARISON,
      zones: [
        {
          id: 'header',
          role: 'header',
          coordinates: { x: 120, y: 120, width: 1680, height: 100 },
          acceptedTypes: ['text'],
          required: false,
          defaultTypographicRole: 'heading1',
          defaultColorRole: 'heading',
        },
        {
          id: 'leftTitle',
          role: 'subtitle',
          coordinates: { x: 120, y: 260, width: 810, height: 80 },
          alignment: { horizontal: 'center', vertical: 'middle' },
          acceptedTypes: ['text'],
          required: true,
          defaultTypographicRole: 'heading2',
          defaultColorRole: 'primary',
        },
        {
          id: 'rightTitle',
          role: 'subtitle',
          coordinates: { x: 990, y: 260, width: 810, height: 80 },
          alignment: { horizontal: 'center', vertical: 'middle' },
          acceptedTypes: ['text'],
          required: true,
          defaultTypographicRole: 'heading2',
          defaultColorRole: 'secondary',
        },
        {
          id: 'leftContent',
          role: 'body',
          coordinates: { x: 120, y: 360, width: 810, height: 600 },
          acceptedTypes: ['text', 'bullets'],
          required: true,
          defaultTypographicRole: 'body',
          defaultColorRole: 'text',
        },
        {
          id: 'rightContent',
          role: 'body',
          coordinates: { x: 990, y: 360, width: 810, height: 600 },
          acceptedTypes: ['text', 'bullets'],
          required: true,
          defaultTypographicRole: 'body',
          defaultColorRole: 'text',
        },
      ],
    },
    
    [SlideType.TIMELINE]: {
      slideType: SlideType.TIMELINE,
      zones: [
        {
          id: 'header',
          role: 'header',
          coordinates: { x: 120, y: 120, width: 1680, height: 100 },
          acceptedTypes: ['text'],
          required: false,
          defaultTypographicRole: 'heading1',
          defaultColorRole: 'heading',
        },
        {
          id: 'timeline',
          role: 'body',
          coordinates: { x: 120, y: 260, width: 1680, height: 700 },
          acceptedTypes: ['text', 'shape'],
          required: true,
          defaultTypographicRole: 'body',
          defaultColorRole: 'text',
        },
      ],
    },
    
    [SlideType.CHART]: {
      slideType: SlideType.CHART,
      zones: [
        {
          id: 'header',
          role: 'header',
          coordinates: { x: 120, y: 120, width: 1680, height: 100 },
          acceptedTypes: ['text'],
          required: false,
          defaultTypographicRole: 'heading1',
          defaultColorRole: 'heading',
        },
        {
          id: 'chart',
          role: 'chart',
          coordinates: { x: 160, y: 260, width: 1600, height: 660 },
          acceptedTypes: ['chart', 'image'],
          required: true,
        },
        {
          id: 'caption',
          role: 'caption',
          coordinates: { x: 160, y: 940, width: 1600, height: 60 },
          acceptedTypes: ['text'],
          required: false,
          alignment: { horizontal: 'center', vertical: 'middle' },
          defaultTypographicRole: 'caption',
          defaultColorRole: 'textLight',
        },
      ],
    },
    
    [SlideType.TABLE]: {
      slideType: SlideType.TABLE,
      zones: [
        {
          id: 'header',
          role: 'header',
          coordinates: { x: 120, y: 120, width: 1680, height: 100 },
          acceptedTypes: ['text'],
          required: false,
          defaultTypographicRole: 'heading1',
          defaultColorRole: 'heading',
        },
        {
          id: 'table',
          role: 'table',
          coordinates: { x: 120, y: 260, width: 1680, height: 700 },
          acceptedTypes: ['table'],
          required: true,
        },
      ],
    },
    
    [SlideType.VIDEO]: {
      slideType: SlideType.VIDEO,
      zones: [
        {
          id: 'header',
          role: 'header',
          coordinates: { x: 120, y: 80, width: 1680, height: 80 },
          acceptedTypes: ['text'],
          required: false,
          defaultTypographicRole: 'heading2',
          defaultColorRole: 'heading',
        },
        {
          id: 'video',
          role: 'video',
          coordinates: { x: 160, y: 200, width: 1600, height: 720 },
          acceptedTypes: ['video'],
          required: true,
          alignment: { horizontal: 'center', vertical: 'middle' },
        },
        {
          id: 'caption',
          role: 'caption',
          coordinates: { x: 160, y: 940, width: 1600, height: 60 },
          acceptedTypes: ['text'],
          required: false,
          alignment: { horizontal: 'center', vertical: 'middle' },
          defaultTypographicRole: 'caption',
          defaultColorRole: 'textLight',
        },
      ],
    },
    
    [SlideType.BLANK]: {
      slideType: SlideType.BLANK,
      zones: [],
    },
    
    [SlideType.CUSTOM]: {
      slideType: SlideType.CUSTOM,
      zones: [
        {
          id: 'canvas',
          role: 'body',
          coordinates: { x: 0, y: 0, width: 1920, height: 1080 },
          acceptedTypes: ['text', 'image', 'video', 'shape', 'table', 'chart'],
          required: false,
          editable: true,
          resizable: true,
          draggable: true,
        },
      ],
    },
  },
};