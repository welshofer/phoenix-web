import type { NextApiRequest, NextApiResponse } from 'next';
import { generatePodcastScript, convertPresentationToContent } from '@/lib/ai/podcast-generator';
import { PodcastFormat, CHIRP_FEMALE_VOICES } from '@/lib/ai/podcast-voices';
import { adminDb } from '@/lib/firebase/server-firestore';
import { Presentation } from '@/lib/models/presentation';
import { Slide } from '@/lib/models/slide';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      presentationId, 
      format = 'conversation',
      duration = 10,
      voice1 = 'en-US-Polyglot-1',
      voice2 = 'en-US-Casual-K',
      voice1Gender,  // legacy support
      voice2Gender,  // legacy support
      language = 'en'
    } = req.body;

    if (!presentationId) {
      return res.status(400).json({ error: 'Presentation ID is required' });
    }


    // Use Firebase Admin SDK to get the presentation
    
    let presentationDoc;
    try {
      presentationDoc = await adminDb
        .collection('presentations')
        .doc(presentationId)
        .get();
      
      const rawData = presentationDoc.data();
    } catch (dbError) {
      console.error('Firebase Admin error:', dbError);
      return res.status(500).json({ 
        error: 'Failed to fetch presentation from database',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }
    
    if (!presentationDoc.exists) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    const presentationData = presentationDoc.data();
    const presentation = {
      id: presentationDoc.id,
      ...presentationData
    } as Presentation;

    // Extract slides from the embedded sections array
    let slides: Slide[] = [];
    
    if (presentationData?.sections && Array.isArray(presentationData.sections)) {
      // Slides are embedded in sections[0].slides
      const mainSection = presentationData.sections[0];
      if (mainSection?.slides && Array.isArray(mainSection.slides)) {
        slides = mainSection.slides.map((slide: any, index: number) => ({
          ...slide,
          id: slide.id || `slide-${index}`,
          order: slide.order || index
        })) as Slide[];
      } else {
      }
    } else {
    }
    
    
    // Use section title as presentation title if main title doesn't exist
    if (!presentation.title && presentationData?.sections?.[0]?.title) {
      presentation.title = presentationData.sections[0].title;
    }
    
    const presentationContent = convertPresentationToContent(presentation, slides);

    // For Chirp voices, determine gender from the voice name
    const v1Gender = voice1Gender || (CHIRP_FEMALE_VOICES.some(name => voice1.includes(name)) ? 'female' : 'male');
    const v2Gender = voice2Gender || (CHIRP_FEMALE_VOICES.some(name => voice2.includes(name)) ? 'female' : 'male');

    const script = await generatePodcastScript(
      presentationContent,
      format as PodcastFormat,
      duration,
      v1Gender as 'male' | 'female',
      v2Gender as 'male' | 'female',
      language
    );

    return res.status(200).json({ 
      success: true, 
      script,
      metadata: {
        presentationTitle: presentation.title,
        slideCount: slides.length,
        format,
        duration,
        language
      }
    });

  } catch (error) {
    console.error('Error generating podcast script:', error);
    return res.status(500).json({ 
      error: 'Failed to generate podcast script',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}