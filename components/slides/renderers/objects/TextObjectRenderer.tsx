import React from 'react';
import { Box } from '@mui/material';
import { TextObject } from '@/lib/models/slide';
import { TypographySet, TypographicRole } from '@/lib/models/typography';
import { ColorSet, ColorRole } from '@/lib/models/colors';

interface TextObjectRendererProps {
  object: TextObject;
  typographySet: TypographySet;
  colorSet: ColorSet;
  scale?: number;
  isEditing?: boolean;
  onEdit?: (id: string, content: string) => void;
}

export default function TextObjectRenderer({
  object,
  typographySet,
  colorSet,
  scale = 1,
  isEditing = false,
  onEdit,
}: TextObjectRendererProps) {
  const { coordinates, content, typographicRole, colorRole, customStyles, transform } = object;
  
  // Get typography definition
  const typography = typographicRole 
    ? typographySet.roles[typographicRole]
    : typographySet.roles.body;
    
  // Get color definition
  const color = colorRole
    ? colorSet.colors[colorRole].value
    : colorSet.colors.text.value;
  
  // Combine base styles with custom overrides
  const styles = {
    position: 'absolute' as const,
    left: coordinates.x,
    top: coordinates.y,
    width: coordinates.width,
    height: coordinates.height,
    
    // Typography
    fontFamily: Array.isArray(typography.fontFamily) 
      ? typography.fontFamily.join(', ')
      : typography.fontFamily,
    fontSize: customStyles?.fontSize || typography.fontSize,
    fontWeight: customStyles?.fontWeight || typography.fontWeight,
    fontStyle: typography.fontStyle,
    lineHeight: typography.lineHeight,
    letterSpacing: typeof typography.letterSpacing === 'number' 
      ? typography.letterSpacing 
      : undefined,
    textAlign: customStyles?.textAlign || typography.textAlign || 'left',
    textTransform: typography.textTransform,
    textDecoration: typography.textDecoration,
    
    // Color
    color: customStyles?.color || color,
    
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
    cursor: isEditing ? 'text' : 'default',
    userSelect: isEditing ? 'text' : 'none',
    
    // Handle overflow
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: Math.floor(coordinates.height / (typography.fontSize * (typography.lineHeight || 1.5))),
    WebkitBoxOrient: 'vertical' as const,
  };
  
  const handleContentEdit = (e: React.FormEvent<HTMLDivElement>) => {
    if (isEditing && onEdit) {
      const newContent = e.currentTarget.innerText;
      if (newContent !== content) {
        onEdit(object.id, newContent);
      }
    }
  };
  
  return (
    <Box
      sx={styles}
      contentEditable={isEditing}
      suppressContentEditableWarning={isEditing}
      onBlur={handleContentEdit}
      dangerouslySetInnerHTML={{ __html: content || 'Click to add text' }}
    />
  );
}