// Client-safe voice configuration file
// This file can be safely imported in both client and server components

export type PodcastFormat = 'conversation' | 'interview' | 'educational' | 'debate';

// CHIRP VOICES ONLY - The best and most natural TTS voices
export const availableVoices = {
  'en-US': [
    { id: 'en-US-Polyglot-1', name: 'Polyglot 1', gender: 'male', type: 'Chirp' },
    { id: 'en-US-Casual-K', name: 'Casual K', gender: 'male', type: 'Chirp' },
  ]
};

// CHIRP VOICES ONLY - Google's latest and most advanced TTS model
// Chirp provides superior naturalness and expressiveness compared to all other models
export const TTSVoiceMapping: Record<string, { host: string; expert: string }> = {
  'en': { 
    host: 'en-US-Polyglot-1',   // Chirp multilingual voice
    expert: 'en-US-Casual-K'    // Chirp casual voice
  },
  'es': { 
    host: 'es-US-Polyglot-1',   // Spanish Chirp
    expert: 'es-US-Polyglot-1'
  },
  'es-MX': { 
    host: 'es-US-Polyglot-1',
    expert: 'es-US-Polyglot-1'
  },
  'fr': { 
    host: 'fr-FR-Polyglot-1',   // French Chirp
    expert: 'fr-FR-Polyglot-1'
  },
  'de': { 
    host: 'de-DE-Polyglot-1',   // German Chirp
    expert: 'de-DE-Polyglot-1'
  },
  'it': { 
    host: 'it-IT-Journey-F',   // Using Journey until Chirp available
    expert: 'it-IT-Journey-D'
  },
  'pt-BR': { 
    host: 'pt-BR-Neural2-C',   // Using Neural2 until Chirp available
    expert: 'pt-BR-Neural2-B'
  },
  'ja': { 
    host: 'ja-JP-Neural2-C',   // Using Neural2 until Chirp available
    expert: 'ja-JP-Neural2-D'
  },
  'ko': { 
    host: 'ko-KR-Neural2-C',   // Using Neural2 until Chirp available
    expert: 'ko-KR-Neural2-A'
  },
  'zh-CN': { 
    host: 'cmn-CN-Standard-A', // Using Standard until Chirp available
    expert: 'cmn-CN-Standard-B'
  },
  'zh-TW': { 
    host: 'cmn-TW-Standard-A',
    expert: 'cmn-TW-Standard-B'
  },
  'nl': { 
    host: 'nl-NL-Wavenet-D',   // Using Wavenet until Chirp available
    expert: 'nl-NL-Wavenet-B'
  },
  'ru': { 
    host: 'ru-RU-Wavenet-C',   // Using Wavenet until Chirp available
    expert: 'ru-RU-Wavenet-D'
  },
  'ar': { 
    host: 'ar-XA-Wavenet-C',   // Using Wavenet until Chirp available
    expert: 'ar-XA-Wavenet-B'
  },
  'hi': { 
    host: 'hi-IN-Neural2-C',   // Using Neural2 until Chirp available
    expert: 'hi-IN-Neural2-B'
  }
};