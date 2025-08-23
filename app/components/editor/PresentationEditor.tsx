import React, { useState, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Drawer,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { ViewSwitcher, ViewMode } from './ViewSwitcher';
import { OutlineView } from './OutlineView';
import { GridView } from './GridView';
import { DetailView } from './DetailView';
// Simplified interfaces for the editor
interface SimpleSlide {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  order: number;
}

interface SimplifiedPresentation {
  id: string;
  title: string;
  description?: string;
  userId: string;
  slides: SimpleSlide[];
  theme?: any;
  createdAt?: any;
  updatedAt?: any;
}

interface PresentationEditorProps {
  presentation: SimplifiedPresentation;
  onSave?: (presentation: SimplifiedPresentation) => void;
  onPresent?: () => void;
}

export const PresentationEditor: React.FC<PresentationEditorProps> = ({
  presentation: initialPresentation,
  onSave,
  onPresent,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [presentation, setPresentation] = useState(initialPresentation);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedSlideId, setSelectedSlideId] = useState<string | undefined>(
    presentation.slides[0]?.id
  );
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  const selectedSlideIndex = presentation.slides.findIndex(
    (slide) => slide.id === selectedSlideId
  );

  const handleReorderSlides = useCallback((newSlides: SimpleSlide[]) => {
    setPresentation((prev) => ({
      ...prev,
      slides: newSlides,
    }));
  }, []);

  const handleSelectSlide = useCallback((slideId: string) => {
    setSelectedSlideId(slideId);
    if (viewMode === 'outline' || viewMode === 'grid') {
      setViewMode('detail');
    }
  }, [viewMode]);

  const handleDeleteSlide = useCallback((slideId: string) => {
    setPresentation((prev) => {
      const newSlides = prev.slides.filter((slide) => slide.id !== slideId);
      if (selectedSlideId === slideId && newSlides.length > 0) {
        setSelectedSlideId(newSlides[0].id);
      }
      return {
        ...prev,
        slides: newSlides,
      };
    });
  }, [selectedSlideId]);

  const handleDuplicateSlide = useCallback((slideId: string) => {
    setPresentation((prev) => {
      const slideIndex = prev.slides.findIndex((slide) => slide.id === slideId);
      if (slideIndex === -1) return prev;
      
      const originalSlide = prev.slides[slideIndex];
      const duplicatedSlide: SimpleSlide = {
        ...originalSlide,
        id: `${originalSlide.id}-copy-${Date.now()}`,
        title: `${originalSlide.title} (Copy)`,
      };
      
      const newSlides = [
        ...prev.slides.slice(0, slideIndex + 1),
        duplicatedSlide,
        ...prev.slides.slice(slideIndex + 1),
      ];
      
      return {
        ...prev,
        slides: newSlides,
      };
    });
  }, []);

  const handleAddSlide = useCallback(() => {
    const newSlide: SimpleSlide = {
      id: `slide-${Date.now()}`,
      type: 'content',
      title: 'New Slide',
      subtitle: '',
      content: '',
      order: presentation.slides.length,
    };
    
    setPresentation((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    
    setSelectedSlideId(newSlide.id);
    setViewMode('detail');
  }, [presentation.slides.length]);

  const handleEditSlide = useCallback((slideId: string) => {
    console.log('Edit slide:', slideId);
  }, []);

  const handleNavigateSlide = useCallback((index: number) => {
    if (index >= 0 && index < presentation.slides.length) {
      setSelectedSlideId(presentation.slides[index].id);
    }
  }, [presentation.slides]);

  const handleSave = () => {
    if (onSave) {
      onSave(presentation);
    }
  };

  const drawerWidth = isTablet ? 280 : 320;

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
        }}
        elevation={0}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {presentation.title}
          </Typography>

          <ViewSwitcher view={viewMode} onChange={setViewMode} />

          <Box sx={{ ml: 2, display: 'flex', gap: 1 }}>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={handleAddSlide}
            >
              Add Slide
            </Button>
            {onSave && (
              <Button
                startIcon={<SaveIcon />}
                variant="outlined"
                onClick={handleSave}
              >
                Save
              </Button>
            )}
            {onPresent && (
              <Button
                startIcon={<PlayArrowIcon />}
                variant="contained"
                onClick={onPresent}
              >
                Present
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {viewMode === 'outline' && (
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              mt: '64px',
            },
          }}
        >
          <OutlineView
            slides={presentation.slides}
            onReorder={handleReorderSlides}
            onSelectSlide={handleSelectSlide}
            onDeleteSlide={handleDeleteSlide}
            onDuplicateSlide={handleDuplicateSlide}
            selectedSlideId={selectedSlideId}
          />
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px',
          ml: viewMode === 'outline' && !isMobile && drawerOpen ? `${drawerWidth}px` : 0,
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          height: 'calc(100vh - 64px)',
          overflow: 'hidden',
        }}
      >
        {viewMode === 'outline' && !drawerOpen && (
          <OutlineView
            slides={presentation.slides}
            onReorder={handleReorderSlides}
            onSelectSlide={handleSelectSlide}
            onDeleteSlide={handleDeleteSlide}
            onDuplicateSlide={handleDuplicateSlide}
            selectedSlideId={selectedSlideId}
          />
        )}
        
        {viewMode === 'grid' && (
          <GridView
            slides={presentation.slides}
            onReorder={handleReorderSlides}
            onSelectSlide={handleSelectSlide}
            onDeleteSlide={handleDeleteSlide}
            onDuplicateSlide={handleDuplicateSlide}
            selectedSlideId={selectedSlideId}
          />
        )}
        
        {viewMode === 'detail' && (
          <DetailView
            slides={presentation.slides}
            currentSlideIndex={selectedSlideIndex}
            onNavigate={handleNavigateSlide}
            onEditSlide={handleEditSlide}
            onDeleteSlide={handleDeleteSlide}
            onDuplicateSlide={handleDuplicateSlide}
          />
        )}
      </Box>
    </Box>
  );
};