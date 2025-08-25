import type { NextApiRequest, NextApiResponse } from 'next';
import textToSpeech from '@google-cloud/text-to-speech';
import { uploadAudioToStorage } from '@/lib/firebase/server-storage';

// Initialize TTS client
const ttsClient = new textToSpeech.TextToSpeechClient();

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
      voice1 = 'en-US-Journey-F',
      voice2 = 'en-US-Journey-D',
      presentationId,
      language = 'en-US'
    } = req.body;

    if (!script || !presentationId) {
      return res.status(400).json({ error: 'Script and presentationId are required' });
    }

    // Synthesizing podcast with selected voices
    // Processing script dialogue turns

    // Synthesize audio for each dialogue turn
    const audioSegments: Buffer[] = [];
    const dialogue = script.dialogue || [];

    for (let i = 0; i < dialogue.length; i++) {
      const turn = dialogue[i];
      const voiceName = turn.speaker === 'Host' ? voice1 : voice2;
      
      // Synthesizing dialogue turn

      try {
        // Prepare the TTS request
        const request = {
          input: { text: turn.text },
          voice: {
            languageCode: language,
            name: voiceName,
          },
          audioConfig: {
            audioEncoding: 'MP3' as const,
            speakingRate: 1.0,
            pitch: 0,
            volumeGainDb: 0,
          },
        };

        // Perform the text-to-speech request
        const [response] = await ttsClient.synthesizeSpeech(request);
        
        if (response.audioContent) {
          audioSegments.push(Buffer.from(response.audioContent as string, 'base64'));
        }
      } catch (error) {
        console.error(`Error synthesizing turn ${i + 1}:`, error);
        // Continue with other segments even if one fails
      }
    }

    if (audioSegments.length === 0) {
      throw new Error('No audio segments were successfully synthesized');
    }

    // Successfully synthesized audio segments

    // Combine all audio segments into a single buffer
    const combinedAudio = Buffer.concat(audioSegments);
    
    // Upload to Firebase Storage
    const storagePath = `presentations/${presentationId}/podcast`;
    const fileName = `podcast_${Date.now()}.mp3`;
    
    // Uploading audio to Firebase Storage
    const audioUrl = await uploadAudioToStorage(
      combinedAudio.toString('base64'),
      `${storagePath}/${fileName}`
    );

    // Audio uploaded successfully

    return res.status(200).json({ 
      success: true,
      audioUrl,
      metadata: {
        duration: dialogue.length,
        segments: audioSegments.length,
        totalSize: combinedAudio.length,
        voices: { host: voice1, expert: voice2 }
      }
    });

  } catch (error) {
    console.error('Error synthesizing audio:', error);
    return res.status(500).json({ 
      error: 'Failed to synthesize audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },
};