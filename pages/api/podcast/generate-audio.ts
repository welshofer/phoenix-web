import type { NextApiRequest, NextApiResponse } from 'next';
import { generatePodcastAudio, AudioGenerationOptions } from '@/lib/ai/text-to-speech';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '50mb',
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      script,
      language = 'en',
      voice1 = 'en-US-Journey-F',
      voice2 = 'en-US-Journey-D',
      voice1Gender,  // legacy support
      voice2Gender,  // legacy support
      speakingRate = 1.0,
      pitch = 0.0
    } = req.body;

    if (!script) {
      return res.status(400).json({ error: 'Script is required' });
    }

    const options: AudioGenerationOptions = {
      language,
      voice1,
      voice2,
      voice1Gender: voice1Gender as 'male' | 'female',  // Legacy support
      voice2Gender: voice2Gender as 'male' | 'female',  // Legacy support
      speakingRate,
      pitch
    };

    // Generate the audio
    const audioBuffer = await generatePodcastAudio(script, options);

    // Set appropriate headers for audio file download
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length.toString());
    res.setHeader('Content-Disposition', 'attachment; filename="podcast.mp3"');

    // Send the audio buffer
    res.status(200).send(audioBuffer);

  } catch (error) {
    console.error('Error generating podcast audio:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('Could not load the default credentials')) {
      return res.status(503).json({ 
        error: 'Google Cloud credentials not configured',
        details: 'Please set up Google Cloud Text-to-Speech API credentials or use browser TTS',
        setup: 'See GOOGLE_CLOUD_TTS_SETUP.md for instructions',
        fallback: 'browser-tts'
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to generate podcast audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}