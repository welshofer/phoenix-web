import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Box,
  Paper,
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { SortableSlideItem } from './SortableSlideItem';
// Simplified slide interface for the editor
interface SimpleSlide {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  order: number;
}

interface OutlineViewProps {
  slides: SimpleSlide[];
  onReorder: (slides: SimpleSlide[]) => void;
  onSelectSlide: (slideId: string) => void;
  onDeleteSlide: (slideId: string) => void;
  onDuplicateSlide: (slideId: string) => void;
  selectedSlideId?: string;
}

const getSlideIcon = (type: string) => {
  switch (type) {
    case 'title':
    case 'content':
      return <TextFieldsIcon />;
    case 'image':
      return <ImageIcon />;
    case 'quote':
      return <FormatQuoteIcon />;
    default:
      return <TextFieldsIcon />;
  }
};

export const OutlineView: React.FC<OutlineViewProps> = ({
  slides,
  onReorder,
  onSelectSlide,
  onDeleteSlide,
  onDuplicateSlide,
  selectedSlideId,
}) => {
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

  return (
    <Paper sx={{ height: '100%', overflow: 'auto', bgcolor: 'background.default' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Slides</Typography>
        <Typography variant="body2" color="text.secondary">
          {slides.length} slide{slides.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={slides.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <List sx={{ p: 0 }}>
            {slides.map((slide, index) => (
              <SortableSlideItem key={slide.id} id={slide.id}>
                <ListItem
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: selectedSlideId === slide.id ? 'action.selected' : 'transparent',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => onSelectSlide(slide.id)}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        aria-label="duplicate"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateSlide(slide.id);
                        }}
                        size="small"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSlide(slide.id);
                        }}
                        size="small"
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemIcon>
                    {getSlideIcon(slide.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" noWrap>
                        {slide.title || `Slide ${index + 1}`}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {slide.subtitle || slide.type}
                      </Typography>
                    }
                  />
                </ListItem>
              </SortableSlideItem>
            ))}
          </List>
        </SortableContext>
      </DndContext>
    </Paper>
  );
};