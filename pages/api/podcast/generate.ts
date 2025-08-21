import type { NextApiRequest, NextApiResponse } from 'next';
import { generatePodcastScript, convertPresentationToContent, PodcastFormat } from '@/lib/ai/podcast-generator';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
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
      voice1Gender = 'female',
      voice2Gender = 'male',
      language = 'en'
    } = req.body;

    if (!presentationId) {
      return res.status(400).json({ error: 'Presentation ID is required' });
    }

    const presentationDoc = await getDoc(doc(db, 'presentations', presentationId));
    
    if (!presentationDoc.exists()) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    const presentation = {
      id: presentationDoc.id,
      ...presentationDoc.data()
    } as Presentation;

    const slidesQuery = query(
      collection(db, 'presentations', presentationId, 'slides'),
      orderBy('order', 'asc')
    );
    
    const slidesSnapshot = await getDocs(slidesQuery);
    const slides = slidesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Slide));

    const presentationContent = convertPresentationToContent(presentation, slides);

    const script = await generatePodcastScript(
      presentationContent,
      format as PodcastFormat,
      duration,
      voice1Gender as 'male' | 'female',
      voice2Gender as 'male' | 'female',
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