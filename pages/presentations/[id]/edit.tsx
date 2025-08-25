import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, CircularProgress, Box } from '@mui/material';
import { PresentationEditor } from '@/app/components/editor/PresentationEditor';
import { useAuth } from '@/hooks/useAuth';
import {
  getPresentation,
  updatePresentationSlides,
  updatePresentationMetadata,
} from '@/lib/firebase/presentations';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Slide, SlideType, SlideObjectUnion, TextObject, ImageObject } from '@/lib/models/slide';
import { v4 as uuidv4 } from 'uuid';

export default function PresentationEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const [presentation, setPresentation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if presentation needs images on load
  const checkAndQueueImages = async (presentationId: string, presentation: any) => {
    if (!presentation?.slides) return;
    
    // Check if there are image placeholders without actual images
    const needsImages = presentation.slides.some((slide: any) => 
      slide.objects?.some((obj: any) => 
        obj.type === 'image' && (!obj.src || obj.src.includes('placeholder'))
      )
    );
    
    if (needsImages) {
      console.log('🎨 Presentation has image placeholders, auto-queueing generation...');
      try {
        const response = await fetch('/api/imagen/queue-for-presentation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            presentationId,
            imageStyle: localStorage.getItem('defaultImageStyle') || 'photorealistic'
          })
        });
        
        const result = await response.json();
        if (result.success) {
          console.log(`✅ Auto-queued ${result.count} images for generation`);
        }
      } catch (error) {
        console.error('Failed to auto-queue images:', error);
      }
    }
  };

  // Load presentation and subscribe to updates
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadPresentation(id);
      
      // Subscribe to real-time updates for slide changes
      const docRef = doc(db, 'presentations', id);
      const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data && data.slides) {
            // Update presentation with new data (including generated images)
            setPresentation(prevState => {
              if (!prevState) return null;
              
              // Merge slide updates to preserve image URLs that were added
              const updatedSlides = data.slides.map((newSlide: any) => {
                const existingSlide = prevState.slides?.find((s: any) => s.id === newSlide.id);
                if (existingSlide) {
                  // Merge objects to preserve generated image URLs
                  const mergedObjects = newSlide.objects?.map((newObj: any) => {
                    if (newObj.type === 'image' && newObj.src) {
                      // Image has been updated with a generated URL
                      return newObj;
                    }
                    const existingObj = existingSlide.objects?.find((o: any) => o.id === newObj.id);
                    return existingObj ? { ...existingObj, ...newObj } : newObj;
                  }) || newSlide.objects;
                  
                  return { ...newSlide, objects: mergedObjects };
                }
                return newSlide;
              });
              
              console.log('Presentation updated from real-time listener with', updatedSlides.length, 'slides');
              return {
                ...prevState,
                slides: updatedSlides,
              };
            });
          }
        }
      }, (error) => {
        console.error('Error listening to presentation updates:', error);
      });
      
      return () => unsubscribe();
    }
  }, [id]);

  const loadPresentation = async (presentationId: string) => {
    try {
      setLoading(true);
      const data = await getPresentation(presentationId);
      if (data) {
        console.log('Loaded presentation data:', {
          hasSlides: !!data.slides,
          slideCount: data.slides?.length,
          hasSections: !!data.sections,
          sectionCount: data.sections?.length,
          firstSlideHasObjects: data.slides?.[0]?.objects?.length
        });
        
        // Check if slides exist but are broken (no objects)
        const slidesAreBroken = data.slides && data.slides.length > 0 && 
          data.slides.every((slide: any) => !slide.objects || slide.objects.length === 0);
        
        // Convert sections to slides if slides don't exist or are broken
        if ((!data.slides || slidesAreBroken) && data.sections) {
          console.log('Converting sections to slides...', slidesAreBroken ? '(fixing broken slides)' : '(first time)');
          const convertedSlides = convertSectionsToSlides(data.sections);
          data.slides = convertedSlides;
          // Save the converted slides back to Firestore
          await updatePresentationSlides(presentationId, convertedSlides);
        } else if (slidesAreBroken && !data.sections) {
          console.error('Slides are broken but no sections available to reconvert!');
        }
        setPresentation(data);
        
        // Check if we need to auto-queue images
        checkAndQueueImages(presentationId, data);
      }
    } catch (error) {
      console.error('Error loading presentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertSectionsToSlides = (sections: any[]): Slide[] => {
    const convertedSlides: Slide[] = [];
    let slideOrder = 0;

    sections.forEach(section => {
      section.slides?.forEach((aiSlide: any) => {
        const slide: Slide = {
          // IMPORTANT: Preserve the original slide ID so image generation can match!
          id: aiSlide.id || uuidv4(),
          type: mapAITypeToSlideType(aiSlide.type),
          objects: createObjectsFromAISlide(aiSlide),
          order: slideOrder++,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        convertedSlides.push(slide);
      });
    });

    return convertedSlides;
  };

  const mapAITypeToSlideType = (aiType: string): SlideType => {
    const mapping: Record<string, SlideType> = {
      'title': SlideType.TITLE,
      'agenda': SlideType.BULLETS,
      'bullets': SlideType.BULLETS,
      'sectionHeader': SlideType.SECTION,
      'twoColumn': SlideType.TWO_COLUMN,
      'comparison': SlideType.COMPARISON,
      'image': SlideType.IMAGE,
      'threeImages': SlideType.THREE_IMAGES,
      'quote': SlideType.QUOTE,
      'timeline': SlideType.TIMELINE,
      'table': SlideType.TABLE,
      'qAndA': SlideType.CONTENT,
      'thankYou': SlideType.CONTENT,
      'content': SlideType.CONTENT,
    };
    return mapping[aiType] || SlideType.CONTENT;
  };

  const createObjectsFromAISlide = (aiSlide: any): SlideObjectUnion[] => {
    const objects: SlideObjectUnion[] = [];
    
    // Special handling for threeImages type
    if (aiSlide.type === 'threeImages') {
      // Three images layout with exact specifications
      // No text, just three images with specific positions and sizes
      
      // Use imageDescriptions array if available (new format), fall back to content.imageDescriptions
      const descriptions = aiSlide.imageDescriptions || aiSlide.content?.imageDescriptions || [];
      
      // Image 1 - Large left image (note: you had width/height swapped in specs)
      objects.push({
        id: uuidv4(),
        type: 'image',
        src: '', // Will be filled by image generation
        alt: descriptions[0] || 'Image 1',
        generationDescription: descriptions[0] || 'Image 1',
        fit: 'cover', // Fill mode - crop to fill entire frame
        coordinates: { x: 95, y: 100, width: 1116, height: 884 },
        visible: true,
      } as ImageObject);
      
      // Image 2 - Top right image
      objects.push({
        id: uuidv4(),
        type: 'image',
        src: '', // Will be filled by image generation
        alt: descriptions[1] || 'Image 2',
        generationDescription: descriptions[1] || 'Image 2',
        fit: 'cover', // Fill mode - crop to fill entire frame
        coordinates: { x: 1245, y: 100, width: 580, height: 426 },
        visible: true,
      } as ImageObject);
      
      // Image 3 - Bottom right image
      objects.push({
        id: uuidv4(),
        type: 'image',
        src: '', // Will be filled by image generation
        alt: descriptions[2] || 'Image 3',
        generationDescription: descriptions[2] || 'Image 3',
        fit: 'cover', // Fill mode - crop to fill entire frame
        coordinates: { x: 1245, y: 558, width: 580, height: 426 },
        visible: true,
      } as ImageObject);
      
      return objects;
    }
    
    // Add title
    if (aiSlide.title) {
      objects.push({
        id: uuidv4(),
        type: 'text',
        content: aiSlide.title,
        role: 'header',
        coordinates: { x: 100, y: 100, width: 1720, height: 200 },
        visible: true,
      } as TextObject);
    }
    
    // Add subtitle
    if (aiSlide.subtitle) {
      objects.push({
        id: uuidv4(),
        type: 'text',
        content: aiSlide.subtitle,
        role: 'subheader',
        coordinates: { x: 100, y: 320, width: 1720, height: 120 },
        visible: true,
      } as TextObject);
    }
    
    // Add content based on type
    if (aiSlide.content) {
      if (aiSlide.content.bullets) {
        aiSlide.content.bullets.forEach((bullet: string, index: number) => {
          objects.push({
            id: uuidv4(),
            type: 'text',
            content: `• ${bullet}`,
            role: 'bullets',
            coordinates: { x: 150, y: 480 + (index * 100), width: 1620, height: 80 },
            visible: true,
          } as TextObject);
        });
      }
      
      if (aiSlide.content.body) {
        objects.push({
          id: uuidv4(),
          type: 'text',
          content: aiSlide.content.body,
          role: 'body',
          coordinates: { x: 100, y: 480, width: 1720, height: 400 },
          visible: true,
        } as TextObject);
      }
      
      // Add image object if there's an image description
      if (aiSlide.content.imageDescription) {
        objects.push({
          id: uuidv4(),
          type: 'image',
          src: '', // Will be filled by image generation
          alt: aiSlide.content.imageDescription,
          coordinates: { x: 100, y: 450, width: 1720, height: 600 },
          visible: true,
        } as ImageObject);
      }
    }
    
    // Also check for standalone image descriptions
    if (aiSlide.imageDescription && !aiSlide.content?.imageDescription) {
      objects.push({
        id: uuidv4(),
        type: 'image',
        src: '', // Will be filled by image generation
        alt: aiSlide.imageDescription,
        coordinates: { x: 100, y: 300, width: 1720, height: 700 },
        visible: true,
      } as ImageObject);
    }
    
    // Store imageDescriptions array in slide metadata for later use
    // This allows switching to threeImages type and having prompts ready
    if (aiSlide.imageDescriptions && Array.isArray(aiSlide.imageDescriptions)) {
      // Store in a hidden metadata object
      objects.push({
        id: uuidv4(),
        type: 'metadata',
        content: JSON.stringify({ imageDescriptions: aiSlide.imageDescriptions }),
        visible: false,
        coordinates: { x: 0, y: 0, width: 0, height: 0 },
      } as any);
    }
    
    return objects;
  };

  // Save handler for the PresentationEditor
  const handleSave = async (updatedPresentation: any) => {
    if (!id || typeof id !== 'string') return;
    
    try {
      // Save slides
      await updatePresentationSlides(id, updatedPresentation.slides);
      
      // Save metadata if changed
      if (updatedPresentation.title !== presentation.title || 
          updatedPresentation.description !== presentation.description) {
        await updatePresentationMetadata(id, {
          title: updatedPresentation.title,
          description: updatedPresentation.description,
        });
      }
      
      setPresentation(updatedPresentation);
      console.log('Presentation saved successfully');
    } catch (error) {
      console.error('Error saving presentation:', error);
    }
  };

  // Handler for presentation mode
  const handlePresent = () => {
    router.push(`/presentations/${id}/present`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading presentation...</Typography>
      </Box>
    );
  }

  if (!presentation) {
    return (
      <Container>
        <Typography>Presentation not found</Typography>
      </Container>
    );
  }

  // Transform presentation data to match the expected format
  const simplifiedPresentation = {
    id: presentation.id || id,
    title: presentation.title || 'Untitled Presentation',
    description: presentation.description || '',
    userId: presentation.userId || user?.uid || '',
    slides: presentation.slides || [],
    theme: presentation.theme,
    createdAt: presentation.createdAt,
    updatedAt: presentation.updatedAt,
  };

  return (
    <PresentationEditor
      presentation={simplifiedPresentation}
      onSave={handleSave}
      onPresent={handlePresent}
    />
  );
}
