import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Slide, SlideObjectUnion, TextObject, ImageObject, ShapeObject } from '@/lib/models/slide';
import { SLIDE_DIMENSIONS } from '@/lib/models/coordinates';

interface SlideRendererProps {
  slide: Slide;
  width?: number;
  height?: number;
  isPresenting?: boolean;
  onObjectClick?: (objectId: string) => void;
  selectedObjectId?: string;
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  width = 1920,
  height = 1080,
  isPresenting = false,
  onObjectClick,
  selectedObjectId,
}) => {
  // Calculate scale to fit container
  const scale = Math.min(
    width / SLIDE_DIMENSIONS.WIDTH,
    height / SLIDE_DIMENSIONS.HEIGHT
  );

  const renderObject = (obj: SlideObjectUnion) => {
    const isSelected = selectedObjectId === obj.id;
    
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: obj.coordinates.x * scale,
      top: obj.coordinates.y * scale,
      width: obj.coordinates.width * scale,
      height: obj.coordinates.height * scale,
      cursor: onObjectClick ? 'pointer' : 'default',
      border: isSelected ? '2px solid #1976d2' : 'none',
      borderRadius: 4,
      transition: 'all 0.2s ease',
      opacity: obj.visible ? 1 : 0.3,
    };

    switch (obj.type) {
      case 'text':
        const textObj = obj as TextObject;
        const fontSize = getFontSizeForRole(textObj.role, scale);
        const textAlign = getTextAlignForRole(textObj.role);
        const fontWeight = getFontWeightForRole(textObj.role);
        
        return (
          <Box
            key={obj.id}
            style={baseStyle}
            onClick={() => onObjectClick?.(obj.id)}
          >
            <Typography
              style={{
                fontSize,
                fontWeight,
                textAlign,
                color: textObj.color || '#000',
                fontFamily: textObj.fontFamily || 'Roboto, sans-serif',
                lineHeight: 1.5,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: getVerticalAlignForRole(textObj.role),
                justifyContent: getHorizontalAlignForRole(textObj.role),
                padding: 8 * scale,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {textObj.content}
            </Typography>
          </Box>
        );

      case 'image':
        const imageObj = obj as ImageObject;
        return (
          <Box
            key={obj.id}
            style={baseStyle}
            onClick={() => onObjectClick?.(obj.id)}
          >
            <img
              src={imageObj.src}
              alt={imageObj.alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: imageObj.fit || 'contain',
                borderRadius: 4,
              }}
              onError={(e) => {
                // Fallback for broken images
                const target = e.target as HTMLImageElement;
                target.src = `https://via.placeholder.com/${Math.round(obj.coordinates.width)}x${Math.round(obj.coordinates.height)}/e0e0e0/666?text=${encodeURIComponent(imageObj.alt || 'Image')}`;
              }}
            />
          </Box>
        );

      case 'shape':
        const shapeObj = obj as ShapeObject;
        return (
          <Box
            key={obj.id}
            style={{
              ...baseStyle,
              backgroundColor: shapeObj.fill || '#1976d2',
              borderRadius: shapeObj.shapeType === 'circle' ? '50%' : 
                           shapeObj.shapeType === 'rounded' ? 16 * scale : 0,
              border: shapeObj.stroke ? `${shapeObj.strokeWidth || 2}px solid ${shapeObj.stroke}` : 'none',
            }}
            onClick={() => onObjectClick?.(obj.id)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Paper
      elevation={isPresenting ? 0 : 3}
      style={{
        width: SLIDE_DIMENSIONS.WIDTH * scale,
        height: SLIDE_DIMENSIONS.HEIGHT * scale,
        position: 'relative',
        backgroundColor: slide.backgroundColor || '#ffffff',
        backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      {/* Render background overlay if needed */}
      {slide.backgroundOverlay && (
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: slide.backgroundOverlay,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Render all slide objects */}
      {slide.objects.map(renderObject)}

      {/* Debug grid overlay (only in development) */}
      {process.env.NODE_ENV === 'development' && !isPresenting && (
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, transparent 1px, transparent ${100 * scale}px, rgba(0,0,0,0.05) ${100 * scale}px),
              repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0px, transparent 1px, transparent ${100 * scale}px, rgba(0,0,0,0.05) ${100 * scale}px)
            `,
            pointerEvents: 'none',
            opacity: 0.5,
          }}
        />
      )}
    </Paper>
  );
};

// Helper functions for text styling based on role
function getFontSizeForRole(role: string, scale: number): number {
  const sizes: Record<string, number> = {
    title: 72,
    subtitle: 48,
    header: 56,
    subheader: 40,
    body: 32,
    bullets: 28,
    caption: 24,
    quote: 40,
    citation: 28,
  };
  return (sizes[role] || 32) * scale;
}

function getFontWeightForRole(role: string): number {
  const weights: Record<string, number> = {
    title: 700,
    subtitle: 400,
    header: 600,
    subheader: 500,
    body: 400,
    bullets: 400,
    caption: 300,
    quote: 300,
    citation: 400,
  };
  return weights[role] || 400;
}

function getTextAlignForRole(role: string): 'left' | 'center' | 'right' {
  const aligns: Record<string, 'left' | 'center' | 'right'> = {
    title: 'center',
    subtitle: 'center',
    header: 'left',
    subheader: 'left',
    body: 'left',
    bullets: 'left',
    caption: 'center',
    quote: 'center',
    citation: 'right',
  };
  return aligns[role] || 'left';
}

function getVerticalAlignForRole(role: string): string {
  const aligns: Record<string, string> = {
    title: 'center',
    subtitle: 'center',
    header: 'flex-start',
    subheader: 'flex-start',
    body: 'flex-start',
    bullets: 'flex-start',
    caption: 'center',
    quote: 'center',
    citation: 'flex-end',
  };
  return aligns[role] || 'flex-start';
}

function getHorizontalAlignForRole(role: string): string {
  const aligns: Record<string, string> = {
    title: 'center',
    subtitle: 'center',
    header: 'flex-start',
    subheader: 'flex-start',
    body: 'flex-start',
    bullets: 'flex-start',
    caption: 'center',
    quote: 'center',
    citation: 'flex-end',
  };
  return aligns[role] || 'flex-start';
}