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
import { SlideRenderer } from '@/components/SlideRenderer';
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
  objects?: any[];  // For compatibility with SlideRenderer
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
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="h6">Outline View</Typography>
        <Typography variant="body2" color="text.secondary">
          {slides.length} slide{slides.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
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
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 2,
                      bgcolor: selectedSlideId === slide.id ? 'action.selected' : 'background.paper',
                      '&:hover': {
                        bgcolor: selectedSlideId === slide.id ? 'action.selected' : 'action.hover',
                        boxShadow: 2,
                      },
                      display: 'flex',
                      alignItems: 'flex-start',
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
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
                  {/* Slide thumbnail preview */}
                  <Box
                    sx={{
                      width: 160,
                      height: 90,
                      mr: 3,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      overflow: 'hidden',
                      flexShrink: 0,
                      position: 'relative',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    {slide.objects && slide.objects.length > 0 ? (
                      <Box sx={{
                        transform: 'scale(0.0833)', // Scale from 1920x1080 to 160x90
                        transformOrigin: 'top left',
                        width: 1920,
                        height: 1080,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                      }}>
                        <SlideRenderer
                          slide={slide as any}
                          width={1920}
                          height={1080}
                          isPresenting={false}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getSlideIcon(slide.type)}
                      </Box>
                    )}
                  </Box>
                  
                  {/* Slide content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Slide {index + 1}
                    </Typography>
                    
                    {/* Extract and display text from slide objects */}
                    {slide.objects && slide.objects.length > 0 ? (
                      <Box>
                        {slide.objects
                          .filter((obj: any) => obj.type === 'text' && obj.content)
                          .slice(0, 3) // Show first 3 text objects
                          .map((textObj: any, idx: number) => {
                            const isTitle = textObj.role === 'title' || textObj.role === 'header';
                            const isSubtitle = textObj.role === 'subtitle' || textObj.role === 'subheader';
                            
                            return (
                              <Typography
                                key={idx}
                                variant={isTitle ? 'h6' : isSubtitle ? 'subtitle1' : 'body2'}
                                sx={{
                                  mb: 0.5,
                                  fontWeight: isTitle ? 600 : isSubtitle ? 500 : 400,
                                  color: isTitle ? 'text.primary' : isSubtitle ? 'text.secondary' : 'text.secondary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: isTitle ? 2 : 1,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {textObj.content}
                              </Typography>
                            );
                          })}
                        {slide.objects.filter((obj: any) => obj.type === 'image').length > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            {slide.objects.filter((obj: any) => obj.type === 'image').length} image(s)
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <>
                        {slide.title && (
                          <Typography variant="h6" sx={{ mb: 0.5 }}>
                            {slide.title}
                          </Typography>
                        )}
                        {slide.subtitle && (
                          <Typography variant="body2" color="text.secondary">
                            {slide.subtitle}
                          </Typography>
                        )}
                        {!slide.title && !slide.subtitle && (
                          <Typography variant="body2" color="text.secondary">
                            Empty slide
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                </ListItem>
              </SortableSlideItem>
            ))}
          </List>
        </SortableContext>
      </DndContext>
    </Box>
  </Paper>
  );
};