import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { TTSVoiceMapping } from './podcast-voices';

// Initialize the Text-to-Speech client
const ttsClient = new TextToSpeechClient();

export interface SpeakerSegment {
  speaker: string;
  text: string;
  voiceName: string;
}

export interface AudioGenerationOptions {
  language: string;
  voice1?: string;  // Voice ID
  voice2?: string;  // Voice ID
  voice1Gender?: 'male' | 'female';  // Legacy support
  voice2Gender?: 'male' | 'female';  // Legacy support
  speakingRate?: number;
  pitch?: number;
}

// Parse the script to extract speaker segments
export function parseScriptToSegments(
  script: string,
  language: string,
  voice1?: string,
  voice2?: string,
  voice1Gender?: 'male' | 'female',
  voice2Gender?: 'male' | 'female'
): SpeakerSegment[] {
  const segments: SpeakerSegment[] = [];
  
  // Handle null/undefined/empty script
  if (!script || typeof script !== 'string' || script.trim().length === 0) {
    console.error('Script is empty or invalid:', script);
    return segments;
  }
  
  const lines = script.split('\n');
  
  console.log('=== PARSING SCRIPT ===');
  console.log('Script type:', typeof script);
  console.log('Script length:', script.length);
  console.log('Number of lines:', lines.length);
  console.log('First 10 lines:', lines.slice(0, 10));
  console.log('Script preview:', script.substring(0, 500));
  console.log('=====================');
  
  // Use provided voice IDs or fall back to gender-based selection
  let voice1Name: string;
  let voice2Name: string;
  
  if (voice1 && voice2) {
    voice1Name = voice1;
    voice2Name = voice2;
  } else {
    // Legacy: Get voice mapping for the language based on gender
    const voices = TTSVoiceMapping[language] || TTSVoiceMapping['en'];
    voice1Name = voice1Gender === 'female' ? voices.host : voices.expert;
    voice2Name = voice2Gender === 'female' ? voices.host : voices.expert;
  }
  
  // Regular expression to match speaker lines
  // Try multiple patterns in case AI uses slightly different formatting
  const speakerRegex = /^\*\*([^:]+):\*\*\s*(.+)$/;
  const altSpeakerRegex = /^([A-Za-z]+):\s*(.+)$/;  // Fallback for plain "Name: text"
  
  let currentSpeaker: string | null = null;
  let currentVoice: string | null = null;
  let matchCount = 0;
  
  for (const line of lines) {
    let match = line.match(speakerRegex);
    
    // If primary regex doesn't match, try alternative
    if (!match) {
      match = line.match(altSpeakerRegex);
    }
    
    if (match) {
      matchCount++;
      console.log(`Match ${matchCount}:`, match[1], ':', match[2].substring(0, 50));
      const speakerName = match[1].trim();
      const dialogue = match[2].trim();
      
      // Determine which voice to use based on speaker order
      if (!currentSpeaker) {
        currentSpeaker = speakerName;
        currentVoice = voice1Name;
      } else if (speakerName !== currentSpeaker) {
        currentVoice = currentVoice === voice1Name ? voice2Name : voice1Name;
        currentSpeaker = speakerName;
      }
      
      segments.push({
        speaker: speakerName,
        text: dialogue,
        voiceName: currentVoice || voice1Name
      });
    }
  }
  
  console.log(`Total matches found: ${matchCount}`);
  console.log(`Total segments created: ${segments.length}`);
  
  return segments;
}

// Generate audio for a single text segment
export async function generateAudioForSegment(
  text: string,
  voiceName: string,
  languageCode: string,
  speakingRate: number = 1.0,
  pitch: number = 0.0
): Promise<Buffer> {
  // Use LINEAR16 for highest quality, then convert to MP3 if needed
  // Or use MP3 with highest quality settings
  const request = {
    input: { text },
    voice: {
      languageCode,
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: 'MP3' as const,
      speakingRate,
      pitch,
      // Maximum quality settings
      sampleRateHertz: 24000,  // 24kHz for high quality
      effectsProfileId: ['headphone-class-device'], // Optimized for headphones/speakers
    },
  };
  
  const [response] = await ttsClient.synthesizeSpeech(request);
  
  if (!response.audioContent) {
    throw new Error('No audio content received from TTS');
  }
  
  return Buffer.from(response.audioContent);
}

// Combine multiple audio buffers into a single audio file
export function combineAudioBuffers(audioBuffers: Buffer[]): Buffer {
  // For MP3 files, we can simply concatenate them
  // Note: This is a simple approach. For production, you might want to use
  // a proper audio processing library like ffmpeg
  return Buffer.concat(audioBuffers);
}

// Get language code from language identifier
export function getLanguageCode(language: string): string {
  const languageCodes: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'es-MX': 'es-MX',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-BR',
    'pt-BR': 'pt-BR',
    'nl': 'nl-NL',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'zh': 'zh-CN',
    'zh-CN': 'cmn-CN',
    'zh-TW': 'cmn-TW',
    'ru': 'ru-RU',
    'ar': 'ar-XA',
    'hi': 'hi-IN',
    'id': 'id-ID',
    'th': 'th-TH',
    'vi': 'vi-VN',
    'tr': 'tr-TR',
    'pl': 'pl-PL',
    'uk': 'uk-UA',
    'sv': 'sv-SE',
    'da': 'da-DK',
    'nb': 'nb-NO',
    'fi': 'fi-FI'
  };
  
  return languageCodes[language] || 'en-US';
}

// Main function to generate complete podcast audio
export async function generatePodcastAudio(
  script: string,
  options: AudioGenerationOptions
): Promise<Buffer> {
  const { language, voice1, voice2, voice1Gender, voice2Gender, speakingRate = 1.0, pitch = 0.0 } = options;
  
  // Parse script into segments
  const segments = parseScriptToSegments(script, language, voice1, voice2, voice1Gender, voice2Gender);
  
  if (segments.length === 0) {
    throw new Error('No speaker segments found in script');
  }
  
  // Get language code
  const languageCode = getLanguageCode(language);
  
  // Generate audio for each segment
  const audioBuffers: Buffer[] = [];
  
  for (const segment of segments) {
    try {
      const audioBuffer = await generateAudioForSegment(
        segment.text,
        segment.voiceName,
        languageCode,
        speakingRate,
        pitch
      );
      audioBuffers.push(audioBuffer);
      
      // Add a small pause between speakers (silence)
      // This is a simplified approach - in production you'd generate actual silence
      // For now, we'll just concatenate directly
    } catch (error) {
      console.error(`Error generating audio for segment: ${segment.text.substring(0, 50)}...`, error);
      throw error;
    }
  }
  
  // Combine all audio buffers
  const finalAudio = combineAudioBuffers(audioBuffers);
  
  return finalAudio;
}