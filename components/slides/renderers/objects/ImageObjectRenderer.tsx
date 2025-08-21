import React from 'react';
import { Box } from '@mui/material';
import { ImageObject } from '@/lib/models/slide';

interface ImageObjectRendererProps {
  object: ImageObject;
  scale?: number;
  isEditing?: boolean;
}

export default function ImageObjectRenderer({
  object,
  scale = 1,
  isEditing = false,
}: ImageObjectRendererProps) {
  const { coordinates, src, alt, fit = 'contain', filters, transform } = object;
  
  const filterString = filters ? `
    brightness(${filters.brightness ?? 100}%)
    contrast(${filters.contrast ?? 100}%)
    saturate(${filters.saturation ?? 100}%)
    blur(${filters.blur ?? 0}px)
  ` : undefined;
  
  const styles = {
    position: 'absolute' as const,
    left: coordinates.x,
    top: coordinates.y,
    width: coordinates.width,
    height: coordinates.height,
    
    // Transform
    opacity: transform?.opacity ?? 1,
    transform: transform ? `
      rotate(${transform.rotation || 0}deg)
      scale(${transform.scale || 1})
      skewX(${transform.skewX || 0}deg)
      skewY(${transform.skewY || 0}deg)
    ` : undefined,
    
    // Z-index
    zIndex: object.zIndex,
    
    // Image container
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    
    // Editing
    cursor: isEditing ? 'move' : 'default',
    border: isEditing && object.locked !== true ? '2px dashed #1976D2' : undefined,
  };
  
  const imgStyles = {
    width: fit === 'cover' || fit === 'fill' ? '100%' : 'auto',
    height: fit === 'cover' || fit === 'fill' ? '100%' : 'auto',
    maxWidth: fit === 'contain' ? '100%' : undefined,
    maxHeight: fit === 'contain' ? '100%' : undefined,
    objectFit: fit,
    filter: filterString,
  };
  
  return (
    <Box sx={styles}>
      <img
        src={src}
        alt={alt || ''}
        style={imgStyles}
        draggable={false}
      />
    </Box>
  );
}