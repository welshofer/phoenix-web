import React, { useEffect, useState, useRef } from 'react';
import { Box } from '@mui/material';
import { Slide, SlideObjectUnion, ImageObject } from '@/lib/models/slide';

interface PresentationSlideRendererProps {
  slide: Slide;
  width?: number;
  height?: number;
  isPresenting?: boolean;
}

export function PresentationSlideRenderer({
  slide,
  width = 1920,
  height = 1080,
  isPresenting = false,
}: PresentationSlideRendererProps) {
  const [imageVariants, setImageVariants] = useState<Map<string, number>>(new Map());
  const cycleIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // Set up cycling for images with cycleOnPlayback enabled
    if (isPresenting) {
      slide.objects.forEach(obj => {
        if (obj.type === 'image') {
          const imageObj = obj as ImageObject;
          
          if (imageObj.cycleOnPlayback && imageObj.variants && imageObj.variants.length > 1) {
            // Start cycling
            const interval = setInterval(() => {
              setImageVariants(prev => {
                const newMap = new Map(prev);
                const currentIndex = prev.get(obj.id) || imageObj.heroIndex || 0;
                const nextIndex = (currentIndex + 1) % imageObj.variants!.length;
                newMap.set(obj.id, nextIndex);
                return newMap;
              });
            }, imageObj.cycleInterval || 5000);
            
            cycleIntervalsRef.current.set(obj.id, interval);
          } else {
            // Use hero index
            setImageVariants(prev => {
              const newMap = new Map(prev);
              newMap.set(obj.id, imageObj.heroIndex || 0);
              return newMap;
            });
          }
        }
      });
    }

    // Cleanup intervals on unmount or when presentation stops
    return () => {
      cycleIntervalsRef.current.forEach(interval => clearInterval(interval));
      cycleIntervalsRef.current.clear();
    };
  }, [slide, isPresenting]);

  const renderObject = (obj: SlideObjectUnion) => {
    const baseStyles = {
      position: 'absolute' as const,
      left: obj.coordinates.x,
      top: obj.coordinates.y,
      width: obj.coordinates.width,
      height: obj.coordinates.height,
      display: obj.visible === false ? 'none' : 'block',
      zIndex: obj.zIndex || 0,
      transform: obj.transform ? 
        `rotate(${obj.transform.rotation || 0}deg) scale(${obj.transform.scale || 1})` : 
        undefined,
    };

    switch (obj.type) {
      case 'text':
        const textObj = obj as any;
        return (
          <Box
            key={obj.id}
            sx={{
              ...baseStyles,
              display: 'flex',
              alignItems: textObj.role === 'title' || textObj.role === 'subtitle' ? 'center' : 'flex-start',
              justifyContent: textObj.customStyles?.textAlign || 'left',
              padding: 2,
            }}
          >
            <Box
              component="div"
              sx={{
                fontSize: textObj.customStyles?.fontSize || getFontSizeForRole(textObj.role),
                fontWeight: textObj.customStyles?.fontWeight || getFontWeightForRole(textObj.role),
                color: textObj.customStyles?.color || getColorForRole(textObj.role),
                textAlign: textObj.customStyles?.textAlign || 'left',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: getLineHeightForRole(textObj.role),
              }}
            >
              {textObj.content}
            </Box>
          </Box>
        );

      case 'image':
        const imageObj = obj as ImageObject;
        const currentVariantIndex = imageVariants.get(obj.id) || imageObj.heroIndex || 0;
        const imageSrc = imageObj.variants?.[currentVariantIndex] || imageObj.src;
        
        return (
          <Box
            key={obj.id}
            sx={{
              ...baseStyles,
              overflow: 'hidden',
              transition: isPresenting && imageObj.cycleOnPlayback ? 'opacity 0.5s ease-in-out' : undefined,
            }}
          >
            <img
              src={imageSrc}
              alt={imageObj.alt || ''}
              style={{
                width: '100%',
                height: '100%',
                objectFit: imageObj.fit || 'contain',
                filter: imageObj.filters ? 
                  `brightness(${imageObj.filters.brightness || 100}%) 
                   contrast(${imageObj.filters.contrast || 100}%) 
                   saturate(${imageObj.filters.saturation || 100}%) 
                   blur(${imageObj.filters.blur || 0}px)` : 
                  undefined,
              }}
            />
            {/* Cycling indicator */}
            {isPresenting && imageObj.cycleOnPlayback && imageObj.variants && imageObj.variants.length > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  display: 'flex',
                  gap: 0.5,
                  padding: '4px 8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: 1,
                }}
              >
                {imageObj.variants.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: index === currentVariantIndex ? 'white' : 'rgba(255, 255, 255, 0.3)',
                      transition: 'background-color 0.3s',
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        );

      case 'shape':
        const shapeObj = obj as any;
        return (
          <Box
            key={obj.id}
            sx={{
              ...baseStyles,
              backgroundColor: shapeObj.fill || '#1976d2',
              border: shapeObj.stroke ? `${shapeObj.strokeWidth || 1}px solid ${shapeObj.stroke}` : undefined,
              borderRadius: shapeObj.shape === 'circle' ? '50%' : 0,
              clipPath: shapeObj.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
            }}
          />
        );

      default:
        return null;
    }
  };

  const scale = Math.min(width / 1920, height / 1080);

  return (
    <Box
      sx={{
        position: 'relative',
        width: 1920 * scale,
        height: 1080 * scale,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        backgroundColor: slide.background?.value || '#ffffff',
        backgroundImage: slide.background?.type === 'gradient' ? slide.background.value : undefined,
        overflow: 'hidden',
        boxShadow: isPresenting ? 'none' : 3,
      }}
    >
      {slide.objects.map(obj => renderObject(obj))}
    </Box>
  );
}

// Helper functions for text styling
function getFontSizeForRole(role: string): number {
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
  return sizes[role] || 32;
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
    quote: 500,
    citation: 300,
  };
  return weights[role] || 400;
}

function getColorForRole(role: string): string {
  const colors: Record<string, string> = {
    title: '#1a1a1a',
    subtitle: '#4a4a4a',
    header: '#2a2a2a',
    subheader: '#3a3a3a',
    body: '#333333',
    bullets: '#333333',
    caption: '#666666',
    quote: '#2a2a2a',
    citation: '#666666',
  };
  return colors[role] || '#333333';
}

function getLineHeightForRole(role: string): number {
  const heights: Record<string, number> = {
    title: 1.2,
    subtitle: 1.3,
    header: 1.25,
    subheader: 1.3,
    body: 1.6,
    bullets: 1.8,
    caption: 1.4,
    quote: 1.5,
    citation: 1.4,
  };
  return heights[role] || 1.5;
}