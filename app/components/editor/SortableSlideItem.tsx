import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box } from '@mui/material';

interface SortableSlideItemProps {
  id: string;
  children: React.ReactNode;
  showDragHandle?: boolean;
}

export const SortableSlideItem: React.FC<SortableSlideItemProps> = ({ 
  id, 
  children, 
  showDragHandle = true 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {showDragHandle && (
        <Box
          {...attributes}
          {...listeners}
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            p: 1,
            cursor: 'grab',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          <DragIndicatorIcon />
        </Box>
      )}
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>
    </Box>
  );
};