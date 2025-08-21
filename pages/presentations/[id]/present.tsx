import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  IconButton,
  Typography,
  Fade,
  Zoom,
  Slide as MuiSlide,
  Paper,
  LinearProgress,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Fullscreen,
  FullscreenExit,
  Close,
  Notes,
  Timer,
  ViewList,
  Pause,
  PlayArrow,
} from '@mui/icons-material';
import { PresentationSlideRenderer } from '@/components/PresentationSlideRenderer';
import { getPresentation } from '@/lib/firebase/presentations';
import { Slide } from '@/lib/models/slide';

export default function PresentationMode() {
  const router = useRouter();
  const { id } = router.query;
  
  const [presentation, setPresentation] = useState<any>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [transition, setTransition] = useState<'fade' | 'slide' | 'zoom'>('fade');
  const [showOverview, setShowOverview] = useState(false);

  // Load presentation
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadPresentation(id);
    }
  }, [id]);

  // Timer
  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          previousSlide();
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          nextSlide();
          break;
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          } else {
            exitPresentation();
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'n':
        case 'N':
          setShowNotes(!showNotes);
          break;
        case 'o':
        case 'O':
          setShowOverview(!showOverview);
          break;
        case 'Home':
          setCurrentSlideIndex(0);
          break;
        case 'End':
          setCurrentSlideIndex(slides.length - 1);
          break;
        case 'p':
        case 'P':
          setIsPaused(!isPaused);
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          const slideNum = parseInt(e.key) - 1;
          if (slideNum < slides.length) {
            setCurrentSlideIndex(slideNum);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlideIndex, slides.length, isFullscreen, showNotes, showOverview, isPaused]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    if (isFullscreen) {
      window.addEventListener('mousemove', handleMouseMove);
      handleMouseMove(); // Show initially
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);

  const loadPresentation = async (presentationId: string) => {
    try {
      setLoading(true);
      const data = await getPresentation(presentationId);
      if (data) {
        setPresentation(data);
        
        // Get slides
        if (data.slides) {
          setSlides(data.slides);
        } else if (data.sections) {
          // Convert sections to flat slide array
          const allSlides: Slide[] = [];
          data.sections.forEach((section: any) => {
            section.slides?.forEach((slide: any, index: number) => {
              // Create a simple slide object for presentation
              allSlides.push({
                id: slide.id || `slide-${allSlides.length}`,
                type: slide.type,
                objects: [],
                order: allSlides.length,
                // Store original data for display
                originalData: slide,
                speakerNotes: slide.speakerNotes,
                presenterNotes: slide.presenterNotes,
              } as any);
            });
          });
          setSlides(allSlides);
        }
      }
    } catch (error) {
      console.error('Error loading presentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      exitFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
  };

  const exitPresentation = () => {
    router.push(`/presentations/${id}/edit`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSlide = slides[currentSlideIndex];
  const progress = ((currentSlideIndex + 1) / slides.length) * 100;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading presentation...</Typography>
      </Box>
    );
  }

  const renderSlideContent = () => {
    if (!currentSlide) return null;

    // If we have converted slide objects, use the renderer
    if (currentSlide.objects && currentSlide.objects.length > 0) {
      return (
        <PresentationSlideRenderer
          slide={currentSlide}
          width={window.innerWidth}
          height={window.innerHeight}
          isPresenting={true}
        />
      );
    }

    // Otherwise, render the original AI content
    const slideData = (currentSlide as any).originalData;
    if (!slideData) return null;

    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 8,
          bgcolor: 'background.paper',
        }}
      >
        {slideData.title && (
          <Typography variant="h1" sx={{ fontSize: '4rem', fontWeight: 700, textAlign: 'center', mb: 4 }}>
            {slideData.title}
          </Typography>
        )}
        
        {slideData.subtitle && (
          <Typography variant="h2" sx={{ fontSize: '2.5rem', fontWeight: 400, textAlign: 'center', mb: 6, color: 'text.secondary' }}>
            {slideData.subtitle}
          </Typography>
        )}
        
        {slideData.content?.bullets && (
          <Box sx={{ maxWidth: '80%', width: '100%' }}>
            {slideData.content.bullets.map((bullet: string, index: number) => (
              <Typography
                key={index}
                variant="h5"
                sx={{
                  fontSize: '2rem',
                  mb: 3,
                  pl: 4,
                  position: 'relative',
                  '&:before': {
                    content: '"•"',
                    position: 'absolute',
                    left: 0,
                  }
                }}
              >
                {bullet}
              </Typography>
            ))}
          </Box>
        )}
        
        {slideData.content?.body && (
          <Typography variant="h5" sx={{ fontSize: '2rem', textAlign: 'center', maxWidth: '80%', lineHeight: 1.8 }}>
            {slideData.content.body}
          </Typography>
        )}
        
        {slideData.content?.quote && (
          <Box sx={{ textAlign: 'center', maxWidth: '80%' }}>
            <Typography variant="h4" sx={{ fontSize: '2.5rem', fontStyle: 'italic', mb: 2 }}>
              "{slideData.content.quote}"
            </Typography>
            {slideData.content.attribution && (
              <Typography variant="h5" sx={{ fontSize: '1.8rem', color: 'text.secondary' }}>
                — {slideData.content.attribution}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'black',
        overflow: 'hidden',
      }}
    >
      {/* Main Slide Content */}
      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
        {transition === 'fade' && (
          <Fade in={true} timeout={500} key={currentSlideIndex}>
            <Box sx={{ width: '100%', height: '100%' }}>
              {renderSlideContent()}
            </Box>
          </Fade>
        )}
        
        {transition === 'slide' && (
          <MuiSlide direction="left" in={true} timeout={500} key={currentSlideIndex}>
            <Box sx={{ width: '100%', height: '100%' }}>
              {renderSlideContent()}
            </Box>
          </MuiSlide>
        )}
        
        {transition === 'zoom' && (
          <Zoom in={true} timeout={500} key={currentSlideIndex}>
            <Box sx={{ width: '100%', height: '100%' }}>
              {renderSlideContent()}
            </Box>
          </Zoom>
        )}
      </Box>

      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
      />

      {/* Control Bar */}
      <Fade in={showControls}>
        <Paper
          sx={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <IconButton
            onClick={previousSlide}
            disabled={currentSlideIndex === 0}
            sx={{ color: 'white' }}
          >
            <ArrowBack />
          </IconButton>

          <Typography sx={{ color: 'white', minWidth: 100, textAlign: 'center' }}>
            {currentSlideIndex + 1} / {slides.length}
          </Typography>

          <IconButton
            onClick={nextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            sx={{ color: 'white' }}
          >
            <ArrowForward />
          </IconButton>

          <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>

          <IconButton onClick={() => setShowNotes(!showNotes)} sx={{ color: 'white' }}>
            <Notes />
          </IconButton>

          <IconButton onClick={() => setShowOverview(!showOverview)} sx={{ color: 'white' }}>
            <ViewList />
          </IconButton>

          <IconButton onClick={exitPresentation} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Paper>
      </Fade>

      {/* Timer */}
      {showTimer && (
        <Fade in={showControls}>
          <Paper
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              p: 2,
              bgcolor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Timer sx={{ color: 'white' }} />
            <Typography sx={{ color: 'white', fontFamily: 'monospace', fontSize: '1.2rem' }}>
              {formatTime(elapsedTime)}
            </Typography>
            <IconButton size="small" onClick={() => setIsPaused(!isPaused)} sx={{ color: 'white' }}>
              {isPaused ? <PlayArrow /> : <Pause />}
            </IconButton>
          </Paper>
        </Fade>
      )}

      {/* Speaker Notes Drawer */}
      <Drawer
        anchor="bottom"
        open={showNotes}
        onClose={() => setShowNotes(false)}
        sx={{
          '& .MuiDrawer-paper': {
            height: '30%',
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            p: 3,
          },
        }}
      >
        <Typography variant="h6" gutterBottom>
          Speaker Notes
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {(currentSlide as any)?.speakerNotes || 'No speaker notes for this slide'}
        </Typography>
        
        {(currentSlide as any)?.presenterNotes && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Key Points
            </Typography>
            <List>
              {(currentSlide as any).presenterNotes.map((note: string, index: number) => (
                <ListItem key={index}>
                  <ListItemText primary={note} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Drawer>

      {/* Slide Overview */}
      <Drawer
        anchor="right"
        open={showOverview}
        onClose={() => setShowOverview(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            p: 2,
          },
        }}
      >
        <Typography variant="h6" gutterBottom>
          Slide Overview
        </Typography>
        <List>
          {slides.map((slide, index) => (
            <ListItem
              key={index}
              button
              selected={index === currentSlideIndex}
              onClick={() => {
                setCurrentSlideIndex(index);
                setShowOverview(false);
              }}
            >
              <ListItemText
                primary={`Slide ${index + 1}`}
                secondary={
                  <Chip
                    label={(slide as any).originalData?.type || slide.type}
                    size="small"
                    sx={{ color: 'white', borderColor: 'white' }}
                    variant="outlined"
                  />
                }
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Keyboard Shortcuts Help */}
      {showControls && (
        <Fade in={showControls}>
          <Paper
            sx={{
              position: 'absolute',
              bottom: 100,
              left: 20,
              p: 2,
              bgcolor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontSize: '0.85rem',
            }}
          >
            <Typography variant="caption" display="block">
              ← → Navigate | F Fullscreen | N Notes | O Overview | P Pause | ESC Exit
            </Typography>
          </Paper>
        </Fade>
      )}
    </Box>
  );
}