import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Toolbar,
  Divider,
  Chip,
  Zoom,
  Fade,
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { SlideRenderer } from '@/components/SlideRenderer';

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

interface DetailViewProps {
  slides: SimpleSlide[];
  currentSlideIndex: number;
  onNavigate: (index: number) => void;
  onEditSlide: (slideId: string) => void;
  onDeleteSlide: (slideId: string) => void;
  onDuplicateSlide: (slideId: string) => void;
  onDoubleClick?: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({
  slides,
  currentSlideIndex,
  onNavigate,
  onEditSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onDoubleClick,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [windowSize, setWindowSize] = React.useState({ width: 1200, height: 675 });
  const currentSlide = slides[currentSlideIndex];

  React.useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
    };
    
    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      onNavigate(currentSlideIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      onNavigate(currentSlideIndex + 1);
    }
  };

  const handleKeyPress = React.useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handlePrevious();
      } else if (event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'f' || event.key === 'F') {
        setIsFullscreen(!isFullscreen);
      }
    },
    [currentSlideIndex, isFullscreen]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  if (!currentSlide) {
    return (
      <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No slide selected
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {!isFullscreen && (
        <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Slide {currentSlideIndex + 1} of {slides.length}
          </Typography>
          <Chip
            label={currentSlide.type}
            size="small"
            sx={{ mr: 2 }}
          />
          <IconButton onClick={() => onEditSlide(currentSlide.id)} size="small">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => onDuplicateSlide(currentSlide.id)} size="small">
            <ContentCopyIcon />
          </IconButton>
          <IconButton onClick={() => onDeleteSlide(currentSlide.id)} size="small">
            <DeleteIcon />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <IconButton onClick={() => setIsFullscreen(true)} size="small">
            <FullscreenIcon />
          </IconButton>
        </Toolbar>
      )}

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: isFullscreen ? 0 : 4,
          bgcolor: isFullscreen ? 'black' : 'grey.50',
          position: 'relative',
        }}
      >
        <Fade in key={currentSlide.id}>
          <Box
            onDoubleClick={onDoubleClick}
            sx={{
              width: isFullscreen ? '100%' : '90%',
              maxWidth: isFullscreen ? '100%' : 1200,
              height: isFullscreen ? '100%' : 'auto',
              aspectRatio: isFullscreen ? 'auto' : '16 / 9',
              bgcolor: 'background.paper',
              boxShadow: isFullscreen ? 0 : 10,
              borderRadius: isFullscreen ? 0 : 2,
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            {currentSlide.objects && currentSlide.objects.length > 0 ? (
              <SlideRenderer
                slide={currentSlide as any}
                width={isFullscreen ? windowSize.width : 1200}
                height={isFullscreen ? windowSize.height : 675}
                isPresenting={isFullscreen}
              />
            ) : (
              // Fallback for slides without objects
              <Box sx={{ 
                p: 4,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Typography variant="h3" gutterBottom>
                  {currentSlide.title || `Slide ${currentSlideIndex + 1}`}
                </Typography>
                {currentSlide.subtitle && (
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    {currentSlide.subtitle}
                  </Typography>
                )}
                {currentSlide.content && (
                  <Typography variant="body1">
                    {currentSlide.content}
                  </Typography>
                )}
                {currentSlide.imageUrl && (
                  <Box
                    component="img"
                    src={currentSlide.imageUrl}
                    sx={{ width: '100%', maxHeight: 400, objectFit: 'contain', mt: 2 }}
                  />
                )}
              </Box>
            )}
          </Box>
        </Fade>

        <Zoom in>
          <IconButton
            onClick={handlePrevious}
            disabled={currentSlideIndex === 0}
            sx={{
              position: 'absolute',
              left: isFullscreen ? 16 : 32,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <NavigateBeforeIcon fontSize="large" />
          </IconButton>
        </Zoom>

        <Zoom in>
          <IconButton
            onClick={handleNext}
            disabled={currentSlideIndex === slides.length - 1}
            sx={{
              position: 'absolute',
              right: isFullscreen ? 16 : 32,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <NavigateNextIcon fontSize="large" />
          </IconButton>
        </Zoom>

        {isFullscreen && (
          <Zoom in>
            <IconButton
              onClick={() => setIsFullscreen(false)}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': { bgcolor: 'background.paper' },
              }}
            >
              <FullscreenExitIcon />
            </IconButton>
          </Zoom>
        )}

        <Box
          sx={{
            position: 'absolute',
            bottom: isFullscreen ? 16 : 32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1,
          }}
        >
          {slides.map((_, index) => (
            <Box
              key={index}
              onClick={() => onNavigate(index)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: index === currentSlideIndex ? 'primary.main' : 'grey.400',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.5)',
                },
              }}
            />
          ))}
        </Box>
      </Box>

      {!isFullscreen && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            Use arrow keys to navigate • Press F for fullscreen
          </Typography>
        </Box>
      )}
    </Paper>
  );
};