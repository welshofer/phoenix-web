import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ImageIcon from '@mui/icons-material/Image';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { ViewSwitcher, ViewMode } from './ViewSwitcher';
import { OutlineView } from './OutlineView';
import { GridView } from './GridView';
import { DetailView } from './DetailView';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues
const ImageGenerationProgress = dynamic(
  () => import('@/components/ImageGenerationProgress'),
  { ssr: false }
);
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
    initialPresentation.slides[0]?.id
  );
  const [showImageProgress, setShowImageProgress] = useState(false);

  // Sync presentation prop changes with state (for real-time updates)
  useEffect(() => {
    setPresentation(initialPresentation);
    // Also update selected slide if it no longer exists
    setSelectedSlideId(currentId => {
      if (currentId && !initialPresentation.slides.find(s => s.id === currentId)) {
        return initialPresentation.slides[0]?.id;
      }
      return currentId;
    });
  }, [initialPresentation]);

  const selectedSlideIndex = presentation.slides.findIndex(
    (slide) => slide.id === selectedSlideId
  );
  
  const selectedSlide = presentation.slides[selectedSlideIndex];

  const handleReorderSlides = useCallback((newSlides: SimpleSlide[]) => {
    setPresentation((prev) => ({
      ...prev,
      slides: newSlides,
    }));
  }, []);
  
  const handleChangeSlideType = useCallback(async (newType: string) => {
    if (!selectedSlideId) return;
    
    setPresentation((prev) => {
      const slides = [...prev.slides];
      const slideIndex = slides.findIndex(s => s.id === selectedSlideId);
      if (slideIndex === -1) return prev;
      
      const slide = slides[slideIndex];
      
      // Update slide type
      slide.type = newType;
      
      // If converting to threeImages, ensure we have 3 image objects
      if (newType === 'threeImages') {
        // Try to find stored imageDescriptions in metadata
        let imageDescriptions = null;
        const metadataObj = slide.objects?.find((obj: any) => obj.type === 'metadata');
        if (metadataObj?.content) {
          try {
            const metadata = JSON.parse(metadataObj.content);
            imageDescriptions = metadata.imageDescriptions;
          } catch (e) {
            console.error('Failed to parse metadata:', e);
          }
        }
        
        // Clear all existing objects
        slide.objects = [];
        
        // Add three image objects with the specific layout
        slide.objects = [
          {
            id: `${slide.id}-img-1`,
            type: 'image',
            src: '',
            alt: imageDescriptions?.[0] || 'Image 1',
            generationDescription: imageDescriptions?.[0] || (slide.title ? `${slide.title} - Visual 1` : 'Image 1'),
            fit: 'cover',
            coordinates: { x: 95, y: 100, width: 1116, height: 884 },
            visible: true,
          },
          {
            id: `${slide.id}-img-2`,
            type: 'image',
            src: '',
            alt: imageDescriptions?.[1] || 'Image 2',
            generationDescription: imageDescriptions?.[1] || (slide.title ? `${slide.title} - Visual 2` : 'Image 2'),
            fit: 'cover',
            coordinates: { x: 1245, y: 100, width: 580, height: 426 },
            visible: true,
          },
          {
            id: `${slide.id}-img-3`,
            type: 'image',
            src: '',
            alt: imageDescriptions?.[2] || 'Image 3',
            generationDescription: imageDescriptions?.[2] || (slide.title ? `${slide.title} - Visual 3` : 'Image 3'),
            fit: 'cover',
            coordinates: { x: 1245, y: 558, width: 580, height: 426 },
            visible: true,
          },
        ];
      }
      
      return {
        ...prev,
        slides,
      };
    });
    
    // Trigger immediate save
    if (onSave) {
      // Use a ref to get the latest state after update
      setTimeout(() => {
        setPresentation((currentPresentation) => {
          onSave(currentPresentation);
          return currentPresentation;
        });
      }, 100);
    }
  }, [selectedSlideId, onSave]);

  const handleSelectSlide = useCallback((slideId: string) => {
    setSelectedSlideId(slideId);
  }, []);
  
  const handleDoubleClickSlideFromGrid = useCallback((slideId: string) => {
    setSelectedSlideId(slideId);
    setViewMode('detail');
  }, []);
  
  const handleDoubleClickSlideFromDetail = useCallback(() => {
    setViewMode('grid');
  }, []);

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
    // Edit slide functionality would be implemented here
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

  const handleGenerateImages = async () => {
    try {
      const response = await fetch('/api/imagen/queue-for-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          presentationId: presentation.id,
          imageStyle: 'photorealistic'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // Successfully queued images for generation
        
        // Start continuous processing
        startContinuousProcessing();
      }
    } catch (error) {
      console.error('Failed to queue images:', error);
    }
  };
  
  const handleForceProcessImages = async () => {
    // Force processing all images for this presentation
    try {
      const response = await fetch('/api/imagen/force-process-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          presentationId: presentation.id
        })
      });
      
      const result = await response.json();
      // Force process completed
      
      if (result.success) {
        alert(`Force processed ${result.processedCount} images! Refresh the page to see them.`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Force process failed:', error);
      alert('Force process failed - check console');
    }
  };
  
  const startContinuousProcessing = () => {
    let count = 0;
    const maxCount = 20; // Process for up to 10 minutes (20 * 30 seconds)
    
    const processInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/imagen/process-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const result = await response.json();
        if (result.processed > 0) {
          console.log('Successfully processed image job');
        }
        
        count++;
        if (count >= maxCount) {
          clearInterval(processInterval);
          console.log('Continuous processing stopped after 10 minutes');
        }
      } catch (error) {
        console.error('Processing error:', error);
      }
    }, 30000); // Every 30 seconds (more conservative)
    
    console.log('Started continuous image processing (30s intervals)');
  };

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
          <Typography variant="h6" sx={{ flexGrow: 0, mr: 2 }}>
            {presentation.title}
          </Typography>

          {/* Image Generation Progress - Compact Mode */}
          <Box sx={{ flexGrow: 1, mx: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {presentation.id && (
              <ImageGenerationProgress 
                presentationId={presentation.id}
                compact={true}
                disableProcessing={false}
                onImagesReady={(slideImages, jobData) => {
                  // Update slides with generated images
                  console.log('Images ready:', slideImages.size, 'slides with images');
                  console.log('Job data:', jobData);
                  
                  // Create a map of slideId -> imageIndex -> imageUrl
                  const imageMap = new Map<string, Map<number, string>>();
                  
                  jobData?.forEach(job => {
                    if (job.status === 'completed' && job.imageUrls && job.imageUrls.length > 0) {
                      if (!imageMap.has(job.slideId)) {
                        imageMap.set(job.slideId, new Map());
                      }
                      const slideImageMap = imageMap.get(job.slideId)!;
                      const imageIndex = job.imageIndex || 0;
                      slideImageMap.set(imageIndex, job.imageUrls[0]); // Use first variant
                    }
                  });
                  
                  // Update each slide with its generated images
                  const updatedSlides = presentation.slides.map(slide => {
                    const slideImageMap = imageMap.get(slide.id);
                    if (!slideImageMap || slideImageMap.size === 0) return slide;
                    
                    // Update image objects with generated URLs based on their index
                    let imageObjectIndex = 0;
                    const updatedObjects = slide.objects?.map(obj => {
                      if (obj.type === 'image') {
                        const imageUrl = slideImageMap.get(imageObjectIndex);
                        imageObjectIndex++;
                        if (imageUrl) {
                          return { ...obj, src: imageUrl };
                        }
                      }
                      return obj;
                    });
                    
                    return { ...slide, objects: updatedObjects };
                  });
                  
                  setPresentation(prev => ({ ...prev, slides: updatedSlides }));
                }}
              />
            )}
          </Box>

          <ViewSwitcher view={viewMode} onChange={setViewMode} />

          <Box sx={{ ml: 2, display: 'flex', gap: 1 }}>
            {selectedSlide && (
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="slide-type-label">Slide Type</InputLabel>
                <Select
                  labelId="slide-type-label"
                  value={selectedSlide.type || 'content'}
                  label="Slide Type"
                  onChange={(e) => handleChangeSlideType(e.target.value)}
                  startAdornment={<AutoAwesomeIcon sx={{ ml: 1, mr: 0.5, fontSize: 18 }} />}
                >
                  <MenuItem value="title">Title</MenuItem>
                  <MenuItem value="content">Content</MenuItem>
                  <MenuItem value="bullets">Bullets</MenuItem>
                  <MenuItem value="twoColumn">Two Column</MenuItem>
                  <MenuItem value="image">Single Image</MenuItem>
                  <MenuItem value="threeImages">Three Images</MenuItem>
                  <MenuItem value="quote">Quote</MenuItem>
                  <MenuItem value="comparison">Comparison</MenuItem>
                </Select>
              </FormControl>
            )}
            <Button
              startIcon={<ImageIcon />}
              variant="outlined"
              onClick={handleGenerateImages}
              color="warning"
            >
              Generate Images
            </Button>
            <Button
              startIcon={<ImageIcon />}
              variant="contained"
              onClick={handleForceProcessImages}
              color="error"
            >
              FORCE Process
            </Button>
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

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px',
          height: 'calc(100vh - 64px)',
          overflow: 'hidden',
        }}
      >
        {viewMode === 'outline' && (
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
            onDoubleClickSlide={handleDoubleClickSlideFromGrid}
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
            onDoubleClick={handleDoubleClickSlideFromDetail}
          />
        )}
      </Box>
    </Box>
  );
};