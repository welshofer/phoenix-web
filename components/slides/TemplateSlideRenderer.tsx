import React from 'react';
import { Box } from '@mui/material';
import { Slide, SlideObjectUnion } from '@/lib/models/slide';
import { Template } from '@/lib/models/template';
import { TypographySet, DEFAULT_TYPOGRAPHY_SET } from '@/lib/models/typography';
import { ColorSet, DEFAULT_COLOR_SET } from '@/lib/models/colors';
import { SLIDE_DIMENSIONS } from '@/lib/models/coordinates';
import TextObjectRenderer from './renderers/objects/TextObjectRenderer';
import ImageObjectRenderer from './renderers/objects/ImageObjectRenderer';
import ShapeObjectRenderer from './renderers/objects/ShapeObjectRenderer';

interface TemplateSlideRendererProps {
  slide: Slide;
  template?: Template;
  typographySet?: TypographySet;
  colorSet?: ColorSet;
  scale?: number;
  isEditing?: boolean;
  onObjectEdit?: (objectId: string, content: any) => void;
  showGuides?: boolean;
}

export default function TemplateSlideRenderer({
  slide,
  template,
  typographySet = DEFAULT_TYPOGRAPHY_SET,
  colorSet = DEFAULT_COLOR_SET,
  scale = 1,
  isEditing = false,
  onObjectEdit,
  showGuides = false,
}: TemplateSlideRendererProps) {
  
  // Get the layout for this slide type from the template
  const layout = template?.layouts[slide.type];
  const background = slide.background || layout?.background || template?.defaultBackground;
  
  // Render background
  const renderBackground = () => {
    if (!background) return null;
    
    let backgroundStyle: React.CSSProperties = {};
    
    switch (background.type) {
      case 'color':
        backgroundStyle.backgroundColor = background.value;
        break;
      case 'gradient':
        backgroundStyle.background = background.value;
        break;
      case 'image':
        backgroundStyle.backgroundImage = `url(${background.value})`;
        backgroundStyle.backgroundSize = 'cover';
        backgroundStyle.backgroundPosition = 'center';
        break;
    }
    
    if (background.opacity !== undefined) {
      backgroundStyle.opacity = background.opacity;
    }
    
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          ...backgroundStyle,
        }}
      />
    );
  };
  
  // Render template zones (guides)
  const renderZones = () => {
    if (!layout || !showGuides) return null;
    
    return layout.zones.map(zone => (
      <Box
        key={zone.id}
        sx={{
          position: 'absolute',
          left: zone.coordinates.x,
          top: zone.coordinates.y,
          width: zone.coordinates.width,
          height: zone.coordinates.height,
          border: '1px dashed rgba(25, 118, 210, 0.3)',
          backgroundColor: 'rgba(25, 118, 210, 0.05)',
          pointerEvents: 'none',
          zIndex: 1000,
          '&::before': {
            content: `"${zone.role}"`,
            position: 'absolute',
            top: -20,
            left: 0,
            fontSize: 12,
            color: '#1976D2',
            backgroundColor: 'white',
            padding: '2px 4px',
            borderRadius: 2,
          },
        }}
      />
    ));
  };
  
  // Render slide objects
  const renderObject = (object: SlideObjectUnion) => {
    switch (object.type) {
      case 'text':
        return (
          <TextObjectRenderer
            key={object.id}
            object={object}
            typographySet={typographySet}
            colorSet={colorSet}
            scale={scale}
            isEditing={isEditing}
            onEdit={onObjectEdit}
          />
        );
        
      case 'image':
        return (
          <ImageObjectRenderer
            key={object.id}
            object={object}
            scale={scale}
            isEditing={isEditing}
          />
        );
        
      case 'shape':
        return (
          <ShapeObjectRenderer
            key={object.id}
            object={object}
            colorSet={colorSet}
            scale={scale}
            isEditing={isEditing}
          />
        );
        
      // Add other object types as needed
      default:
        return null;
    }
  };
  
  // Render master elements
  const renderMasterElements = () => {
    if (!template) return null;
    
    const elements = [
      ...(template.globalMasterElements || []),
      ...(layout?.masterElements || []),
    ];
    
    return elements
      .filter(element => {
        // Check visibility rules
        if (element.visibleOn && !element.visibleOn.includes(slide.type)) {
          return false;
        }
        if (element.excludeFrom?.includes(slide.type)) {
          return false;
        }
        return true;
      })
      .map(element => (
        <Box
          key={element.id}
          sx={{
            position: 'absolute',
            left: element.coordinates.x,
            top: element.coordinates.y,
            width: element.coordinates.width,
            height: element.coordinates.height,
            zIndex: 999,
            opacity: element.transform?.opacity ?? 1,
            transform: element.transform ? `
              rotate(${element.transform.rotation || 0}deg)
              scale(${element.transform.scale || 1})
            ` : undefined,
          }}
        >
          {element.content}
        </Box>
      ));
  };
  
  const containerStyles = {
    position: 'relative' as const,
    width: SLIDE_DIMENSIONS.WIDTH * scale,
    height: SLIDE_DIMENSIONS.HEIGHT * scale,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    backgroundColor: colorSet.colors.background.value,
    overflow: 'hidden',
    boxShadow: 3,
  };
  
  const canvasStyles = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: SLIDE_DIMENSIONS.WIDTH,
    height: SLIDE_DIMENSIONS.HEIGHT,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
  };
  
  return (
    <Box sx={containerStyles}>
      <Box sx={canvasStyles}>
        {renderBackground()}
        {renderMasterElements()}
        {slide.objects.map(renderObject)}
        {renderZones()}
      </Box>
    </Box>
  );
}