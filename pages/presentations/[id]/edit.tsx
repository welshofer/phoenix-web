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
import { Slide } from '@/lib/models/slide';
import { v4 as uuidv4 } from 'uuid';

export default function PresentationEditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const [presentation, setPresentation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load presentation
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadPresentation(id);
    }
  }, [id]);

  const loadPresentation = async (presentationId: string) => {
    try {
      setLoading(true);
      const data = await getPresentation(presentationId);
      if (data) {
        // Convert sections to slides if needed
        if (!data.slides && data.sections) {
          // Convert AI-generated sections to slide objects
          const convertedSlides = convertSectionsToSlides(data.sections);
          data.slides = convertedSlides;
        }
        setPresentation(data);
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
          id: uuidv4(),
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
      'threeImages': SlideType.IMAGE,
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
