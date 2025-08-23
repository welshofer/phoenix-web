import React, { useState } from 'react';
import {
  Typography,
  Box,
  Slider,
  Paper,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { SlideRenderer } from '@/components/SlideRenderer';
import { Slide } from '@/lib/models/slide';

// Simplified slide interface for the editor
interface SimpleSlide {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  order: number;
  objects?: any[];  // For compatibility with SlideRenderer
}

interface GridViewProps {
  slides: SimpleSlide[];
  onReorder: (slides: SimpleSlide[]) => void;
  onSelectSlide: (slideId: string) => void;
  onDeleteSlide: (slideId: string) => void;
  onDuplicateSlide: (slideId: string) => void;
  onDoubleClickSlide?: (slideId: string) => void;
  selectedSlideId?: string;
}

interface SortableCardProps {
  slide: SimpleSlide;
  index: number;
  columns: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDoubleClick?: () => void;
}

const SortableCard: React.FC<SortableCardProps> = ({
  slide,
  index,
  columns,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onDoubleClick,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Calculate optimal size based on viewport and columns
  const getSlideSize = () => {
    if (columns === 1) {
      // For single slide, fit within viewport with proper margins
      return {
        width: '100%',
        maxWidth: 'min(calc(100vw - 80px), calc((100vh - 200px) * 16 / 9))',
        aspectRatio: '16 / 9',
      };
    }
    // For multiple columns, calculate based on width
    return {
      width: `calc((100% - ${(columns - 1) * 16}px) / ${columns})`,
      aspectRatio: '16 / 9',
    };
  };
  
  // Calculate render dimensions for SlideRenderer based on columns
  const getRenderDimensions = () => {
    // Base these on viewport to ensure slides fit
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    
    if (columns === 1) {
      // For single slide, use maximum available space while maintaining aspect ratio
      const maxWidth = viewportWidth - 100;
      const maxHeight = viewportHeight - 250; // Account for header and controls
      
      // Calculate which dimension is the limiting factor
      const widthBasedHeight = maxWidth * 9 / 16;
      const heightBasedWidth = maxHeight * 16 / 9;
      
      if (widthBasedHeight <= maxHeight) {
        // Width is limiting factor
        return {
          width: maxWidth,
          height: widthBasedHeight
        };
      } else {
        // Height is limiting factor
        return {
          width: heightBasedWidth,
          height: maxHeight
        };
      }
    }
    
    // For multiple columns
    const containerWidth = viewportWidth - 80;
    const slideWidth = (containerWidth - (columns - 1) * 16) / columns;
    const slideHeight = slideWidth * 9 / 16;
    
    return {
      width: slideWidth,
      height: slideHeight
    };
  };

  const slideSize = getSlideSize();

  return (
    <Box 
      sx={{ 
        ...slideSize,
      }}
    >
      <Box
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        sx={{
          cursor: isDragging ? 'grabbing' : 'pointer',
          position: 'relative',
          border: isSelected ? 3 : 1,
          borderColor: isSelected ? 'primary.main' : 'divider',
          transition: 'all 0.2s',
          width: '100%',
          height: '100%',
          '&:hover': {
            boxShadow: 6,
            transform: 'translateY(-4px)',
            borderColor: 'primary.light',
            '& .slide-menu-button': {
              opacity: 1,
            },
          },
          overflow: 'hidden',
          borderRadius: 1,
        }}
      >
        {slide.objects && slide.objects.length > 0 ? (() => {
          const dimensions = getRenderDimensions();
          return (
            // Render slide with calculated dimensions
            <Box sx={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <SlideRenderer
                slide={slide as any}
                width={dimensions.width}
                height={dimensions.height}
                isPresenting={false}
              />
            </Box>
          );
        })() : (
          // Fallback for empty slides
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
            }}
          >
            <Typography 
              variant="h4" 
              color="text.disabled"
            >
              {index + 1}
            </Typography>
          </Box>
        )}
        {/* Slide number badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          {index + 1}
        </Box>
        <IconButton
          className="slide-menu-button"
          size="small"
          onClick={handleMenuOpen}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            opacity: 0,
            transition: 'opacity 0.2s',
            '&:hover': { 
              bgcolor: 'rgba(255, 255, 255, 0.95)',
            },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            onDuplicate();
            handleMenuClose();
          }}
        >
          Duplicate
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete();
            handleMenuClose();
          }}
        >
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export const GridView: React.FC<GridViewProps> = ({
  slides,
  onReorder,
  onSelectSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onDoubleClickSlide,
  selectedSlideId,
}) => {
  // Load saved columns preference from localStorage
  const [columns, setColumns] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gridViewColumns');
      return saved ? parseInt(saved, 10) : 4;
    }
    return 4;
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((slide) => slide.id === active.id);
      const newIndex = slides.findIndex((slide) => slide.id === over.id);
      const newSlides = arrayMove(slides, oldIndex, newIndex);
      onReorder(newSlides);
    }
  };

  const handleColumnChange = (_: Event, newValue: number | number[]) => {
    const newColumns = newValue as number;
    setColumns(newColumns);
    // Save preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('gridViewColumns', newColumns.toString());
    }
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ flex: 1 }}>
          Grid View
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 250 }}>
          <ViewColumnIcon color="action" />
          <Slider
            value={columns}
            onChange={handleColumnChange}
            min={1}
            max={6}
            marks
            valueLabelDisplay="auto"
            sx={{ flex: 1 }}
          />
          <Typography variant="body2" sx={{ minWidth: 20 }}>
            {columns}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 0, // Important for flex overflow
      }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slides.map(s => s.id)}
            strategy={rectSortingStrategy}
          >
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2,
              justifyContent: columns === 1 ? 'center' : 'flex-start',
              alignItems: 'flex-start',
              width: '100%',
            }}>
              {slides.map((slide, index) => (
                <SortableCard
                  key={slide.id}
                  slide={slide}
                  index={index}
                  columns={columns}
                  isSelected={selectedSlideId === slide.id}
                  onSelect={() => onSelectSlide(slide.id)}
                  onDelete={() => onDeleteSlide(slide.id)}
                  onDuplicate={() => onDuplicateSlide(slide.id)}
                  onDoubleClick={() => onDoubleClickSlide?.(slide.id)}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      </Box>
    </Paper>
  );
};