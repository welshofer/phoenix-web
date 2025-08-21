// Browser-based Text-to-Speech fallback
// This provides a free alternative using the Web Speech API

export interface BrowserTTSOptions {
  language: string;
  voice1Gender: 'male' | 'female';
  voice2Gender: 'male' | 'female';
  rate?: number;
  pitch?: number;
}

export function parseScriptForBrowserTTS(script: string): Array<{speaker: string; text: string}> {
  const segments: Array<{speaker: string; text: string}> = [];
  const lines = script.split('\n');
  const speakerRegex = /^\*\*([^:]+):\*\*\s*(.+)$/;
  
  for (const line of lines) {
    const match = line.match(speakerRegex);
    if (match) {
      segments.push({
        speaker: match[1].trim(),
        text: match[2].trim()
      });
    }
  }
  
  return segments;
}

export async function generateBrowserAudio(
  script: string,
  options: BrowserTTSOptions
): Promise<Blob> {
  // This is a placeholder that demonstrates the concept
  // In a real implementation, you'd use MediaRecorder API to capture the audio
  
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Browser does not support Text-to-Speech'));
      return;
    }
    
    const segments = parseScriptForBrowserTTS(script);
    
    if (segments.length === 0) {
      reject(new Error('No dialogue found in script'));
      return;
    }
    
    // Note: Browser TTS doesn't allow direct audio file generation
    // This would need to be recorded using MediaRecorder API
    // For now, we'll return a placeholder
    
    // Create a simple notification that browser TTS will play the audio
    const playAudio = () => {
      let index = 0;
      
      const speakNext = () => {
        if (index >= segments.length) {
          // Create a placeholder blob
          const placeholderText = 'Browser TTS playback completed. Note: Browser-based TTS cannot generate downloadable files. Please use Google Cloud TTS for file generation.';
          const blob = new Blob([placeholderText], { type: 'text/plain' });
          resolve(blob);
          return;
        }
        
        const segment = segments[index];
        const utterance = new SpeechSynthesisUtterance(segment.text);
        
        // Set language
        utterance.lang = getLanguageCodeForBrowser(options.language);
        
        // Set rate and pitch
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        
        // Try to select appropriate voice based on gender
        const voices = speechSynthesis.getVoices();
        const isFirstSpeaker = index === 0 || segments[index - 1].speaker !== segment.speaker;
        const targetGender = isFirstSpeaker ? options.voice1Gender : options.voice2Gender;
        
        const voice = selectVoice(voices, utterance.lang, targetGender);
        if (voice) {
          utterance.voice = voice;
        }
        
        utterance.onend = () => {
          index++;
          setTimeout(speakNext, 300); // Small pause between speakers
        };
        
        utterance.onerror = (event) => {
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };
        
        speechSynthesis.speak(utterance);
      };
      
      speakNext();
    };
    
    // Wait for voices to load
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', playAudio, { once: true });
    } else {
      playAudio();
    }
  });
}

function getLanguageCodeForBrowser(language: string): string {
  const codes: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-BR',
    'nl': 'nl-NL',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'zh': 'zh-CN',
    'ru': 'ru-RU',
    'ar': 'ar-SA',
    'hi': 'hi-IN'
  };
  
  return codes[language] || 'en-US';
}

function selectVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
  gender: 'male' | 'female'
): SpeechSynthesisVoice | null {
  // Try to find a voice matching language and gender
  const langVoices = voices.filter(v => v.lang.startsWith(lang.split('-')[0]));
  
  if (langVoices.length === 0) {
    return voices[0]; // Fallback to first available voice
  }
  
  // Try to guess gender from voice name
  const genderKeywords = gender === 'female' 
    ? ['female', 'woman', 'girl', 'fem', 'elle', 'she']
    : ['male', 'man', 'boy', 'masc', 'il', 'he'];
  
  const matchingVoice = langVoices.find(v => 
    genderKeywords.some(keyword => 
      v.name.toLowerCase().includes(keyword)
    )
  );
  
  return matchingVoice || langVoices[0];
}

export function isBrowserTTSAvailable(): boolean {
  return 'speechSynthesis' in window;
}