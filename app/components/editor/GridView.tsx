import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
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

interface GridViewProps {
  slides: SimpleSlide[];
  onReorder: (slides: SimpleSlide[]) => void;
  onSelectSlide: (slideId: string) => void;
  onDeleteSlide: (slideId: string) => void;
  onDuplicateSlide: (slideId: string) => void;
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
}

const SortableCard: React.FC<SortableCardProps> = ({
  slide,
  index,
  columns,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
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

  const getGridColumns = () => {
    switch (columns) {
      case 1: return { xs: 12 };
      case 2: return { xs: 12, sm: 6 };
      case 3: return { xs: 12, sm: 6, md: 4 };
      case 4: return { xs: 12, sm: 6, md: 3 };
      case 5: return { xs: 12, sm: 6, md: 2.4 };
      case 6: return { xs: 12, sm: 4, md: 2 };
      default: return { xs: 12, sm: 6, md: 4 };
    }
  };

  return (
    <Grid {...getGridColumns()}>
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={onSelect}
        sx={{
          cursor: isDragging ? 'grabbing' : 'pointer',
          position: 'relative',
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? 'primary.main' : 'divider',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-2px)',
          },
        }}
      >
        <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'grey.100' }}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h4" color="text.secondary">
              {index + 1}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
        <CardContent sx={{ py: 1 }}>
          <Typography variant="body2" noWrap>
            {slide.title || `Slide ${index + 1}`}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {slide.type}
          </Typography>
        </CardContent>
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
      </Card>
    </Grid>
  );
};

export const GridView: React.FC<GridViewProps> = ({
  slides,
  onReorder,
  onSelectSlide,
  onDeleteSlide,
  onDuplicateSlide,
  selectedSlideId,
}) => {
  const [columns, setColumns] = useState(3);
  
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
    setColumns(newValue as number);
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
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

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slides.map(s => s.id)}
            strategy={rectSortingStrategy}
          >
            <Grid container spacing={2}>
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
                />
              ))}
            </Grid>
          </SortableContext>
        </DndContext>
      </Box>
    </Paper>
  );
};