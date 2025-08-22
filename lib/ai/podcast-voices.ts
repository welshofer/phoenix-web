// Client-safe voice configuration file
// This file can be safely imported in both client and server components

export type PodcastFormat = 'conversation' | 'interview' | 'educational' | 'debate';

export interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female';
  type: string;
}

// ALL CHIRP3-HD VOICES FROM GOOGLE CLOUD DOCUMENTATION
// Female voices: 14 total
// Male voices: 16 total

const femaleVoiceNames = [
  'Achernar', 'Aoede', 'Autonoe', 'Callirrhoe', 'Despina', 'Erinome', 'Gacrux',
  'Kore', 'Laomedeia', 'Leda', 'Pulcherrima', 'Sulafat', 'Vindemiatrix', 'Zephyr'
];

const maleVoiceNames = [
  'Achird', 'Algenib', 'Algieba', 'Alnilam', 'Charon', 'Enceladus', 'Fenrir',
  'Iapetus', 'Orus', 'Puck', 'Rasalgethi', 'Sadachbia', 'Sadaltager', 'Schedar',
  'Umbriel', 'Zubenelgenubi'
];

// Generate voices for each supported language
// Chirp3-HD supports many languages with the same voice names
export const availableVoices: Record<string, Voice[]> = {
  'en-US': [
    ...femaleVoiceNames.map(name => ({
      id: `en-US-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `en-US-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'en-GB': [
    ...femaleVoiceNames.map(name => ({
      id: `en-GB-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `en-GB-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'en-AU': [
    ...femaleVoiceNames.map(name => ({
      id: `en-AU-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `en-AU-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'en-IN': [
    ...femaleVoiceNames.map(name => ({
      id: `en-IN-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `en-IN-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'es-ES': [
    ...femaleVoiceNames.map(name => ({
      id: `es-ES-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `es-ES-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'es-US': [
    ...femaleVoiceNames.map(name => ({
      id: `es-US-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `es-US-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'fr-FR': [
    ...femaleVoiceNames.map(name => ({
      id: `fr-FR-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `fr-FR-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'de-DE': [
    ...femaleVoiceNames.map(name => ({
      id: `de-DE-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `de-DE-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'it-IT': [
    ...femaleVoiceNames.map(name => ({
      id: `it-IT-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `it-IT-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'pt-BR': [
    ...femaleVoiceNames.map(name => ({
      id: `pt-BR-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `pt-BR-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'pt-PT': [
    ...femaleVoiceNames.map(name => ({
      id: `pt-PT-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `pt-PT-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'nl-NL': [
    ...femaleVoiceNames.map(name => ({
      id: `nl-NL-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `nl-NL-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'nl-BE': [
    ...femaleVoiceNames.map(name => ({
      id: `nl-BE-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `nl-BE-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'ja-JP': [
    ...femaleVoiceNames.map(name => ({
      id: `ja-JP-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `ja-JP-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'ko-KR': [
    ...femaleVoiceNames.map(name => ({
      id: `ko-KR-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `ko-KR-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'ru-RU': [
    ...femaleVoiceNames.map(name => ({
      id: `ru-RU-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `ru-RU-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'zh-CN': [
    ...femaleVoiceNames.map(name => ({
      id: `zh-CN-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `zh-CN-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'ar-XA': [
    ...femaleVoiceNames.map(name => ({
      id: `ar-XA-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `ar-XA-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'hi-IN': [
    ...femaleVoiceNames.map(name => ({
      id: `hi-IN-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `hi-IN-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'bn-IN': [
    ...femaleVoiceNames.map(name => ({
      id: `bn-IN-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `bn-IN-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'id-ID': [
    ...femaleVoiceNames.map(name => ({
      id: `id-ID-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `id-ID-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'th-TH': [
    ...femaleVoiceNames.map(name => ({
      id: `th-TH-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `th-TH-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'vi-VN': [
    ...femaleVoiceNames.map(name => ({
      id: `vi-VN-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `vi-VN-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'tr-TR': [
    ...femaleVoiceNames.map(name => ({
      id: `tr-TR-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `tr-TR-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'pl-PL': [
    ...femaleVoiceNames.map(name => ({
      id: `pl-PL-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `pl-PL-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'sv-SE': [
    ...femaleVoiceNames.map(name => ({
      id: `sv-SE-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `sv-SE-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'da-DK': [
    ...femaleVoiceNames.map(name => ({
      id: `da-DK-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `da-DK-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'nb-NO': [
    ...femaleVoiceNames.map(name => ({
      id: `nb-NO-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `nb-NO-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
  'fi-FI': [
    ...femaleVoiceNames.map(name => ({
      id: `fi-FI-Chirp3-HD-${name}`,
      name,
      gender: 'female' as const,
      type: 'chirp3-hd'
    })),
    ...maleVoiceNames.map(name => ({
      id: `fi-FI-Chirp3-HD-${name}`,
      name,
      gender: 'male' as const,
      type: 'chirp3-hd'
    }))
  ],
};

// Export the voice names for gender detection
export const CHIRP_FEMALE_VOICES = femaleVoiceNames;
export const CHIRP_MALE_VOICES = maleVoiceNames;