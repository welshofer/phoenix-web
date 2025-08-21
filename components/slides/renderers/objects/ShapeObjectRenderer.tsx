import React from 'react';
import { Box } from '@mui/material';
import { ShapeObject } from '@/lib/models/slide';
import { ColorSet } from '@/lib/models/colors';

interface ShapeObjectRendererProps {
  object: ShapeObject;
  colorSet: ColorSet;
  scale?: number;
  isEditing?: boolean;
}

export default function ShapeObjectRenderer({
  object,
  colorSet,
  scale = 1,
  isEditing = false,
}: ShapeObjectRendererProps) {
  const { coordinates, shape, fill, stroke, strokeWidth = 2, transform, customPath } = object;
  
  // Resolve colors from color roles or use direct values
  const fillColor = fill && fill in colorSet.colors 
    ? colorSet.colors[fill as keyof typeof colorSet.colors].value 
    : fill || 'transparent';
    
  const strokeColor = stroke && stroke in colorSet.colors
    ? colorSet.colors[stroke as keyof typeof colorSet.colors].value
    : stroke || 'transparent';
  
  const renderShape = () => {
    const svgProps = {
      width: coordinates.width,
      height: coordinates.height,
      style: { display: 'block' },
    };
    
    switch (shape) {
      case 'rectangle':
        return (
          <svg {...svgProps}>
            <rect
              x={strokeWidth / 2}
              y={strokeWidth / 2}
              width={coordinates.width - strokeWidth}
              height={coordinates.height - strokeWidth}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </svg>
        );
        
      case 'circle':
        const radius = Math.min(coordinates.width, coordinates.height) / 2 - strokeWidth / 2;
        return (
          <svg {...svgProps}>
            <circle
              cx={coordinates.width / 2}
              cy={coordinates.height / 2}
              r={radius}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </svg>
        );
        
      case 'triangle':
        const points = `
          ${coordinates.width / 2},${strokeWidth}
          ${coordinates.width - strokeWidth},${coordinates.height - strokeWidth}
          ${strokeWidth},${coordinates.height - strokeWidth}
        `;
        return (
          <svg {...svgProps}>
            <polygon
              points={points}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </svg>
        );
        
      case 'arrow':
        const arrowPath = `
          M ${strokeWidth} ${coordinates.height / 2}
          L ${coordinates.width * 0.7} ${coordinates.height / 2}
          L ${coordinates.width * 0.7} ${coordinates.height * 0.3}
          L ${coordinates.width - strokeWidth} ${coordinates.height / 2}
          L ${coordinates.width * 0.7} ${coordinates.height * 0.7}
          L ${coordinates.width * 0.7} ${coordinates.height / 2}
        `;
        return (
          <svg {...svgProps}>
            <path
              d={arrowPath}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          </svg>
        );
        
      case 'line':
        return (
          <svg {...svgProps}>
            <line
              x1={0}
              y1={coordinates.height / 2}
              x2={coordinates.width}
              y2={coordinates.height / 2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </svg>
        );
        
      case 'custom':
        if (!customPath) return null;
        return (
          <svg {...svgProps}>
            <path
              d={customPath}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </svg>
        );
        
      default:
        return null;
    }
  };
  
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
    
    // Editing
    cursor: isEditing && !object.locked ? 'move' : 'default',
    pointerEvents: object.locked ? 'none' : 'auto',
    border: isEditing && !object.locked ? '1px dashed #1976D2' : undefined,
  };
  
  return (
    <Box sx={styles}>
      {renderShape()}
    </Box>
  );
}