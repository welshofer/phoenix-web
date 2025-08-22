import { Presentation } from '@/lib/models/presentation';
import { Slide, TextObject, ImageObject, SlideObjectUnion } from '@/lib/models/slide';

export interface PresentationContent {
  title: string;
  slideCount: number;
  slides: Array<{
    slideNumber: number;
    title: string;
    content: string[];
    imageDescriptions: string[];  // Image generation prompts/descriptions
    speakerNotes: string;
  }>;
}

export type PodcastFormat = 'conversation' | 'interview' | 'educational' | 'debate';

function getGenderAppropriateName(gender: 'male' | 'female', speakerNumber: 1 | 2): string {
  const femaleNames = ['Sarah', 'Emily', 'Jessica', 'Rachel', 'Ashley', 'Lauren', 'Megan', 'Amanda'];
  const maleNames = ['Michael', 'David', 'James', 'Robert', 'Daniel', 'Matthew', 'Christopher', 'Andrew'];
  
  const nameIndex = speakerNumber === 1 ? 0 : 3;
  return gender === 'female' ? femaleNames[nameIndex] : maleNames[nameIndex];
}

function getLanguageInstructions(language: string): string {
  const instructions: Record<string, string> = {
    en: 'Write the entire podcast script in English. Use natural English expressions and idioms.',
    ar: 'اكتب نص البودكاست بالكامل باللغة العربية. استخدم التعبيرات والمصطلحات الطبيعية باللغة العربية.',
    bn: 'পুরো পডকাস্ট স্ক্রিপ্ট বাংলায় লিখুন। প্রাকৃতিক বাংলা অভিব্যক্তি এবং বাগধারা ব্যবহার করুন।',
    da: 'Skriv hele podcast-scriptet på dansk. Brug naturlige danske udtryk og talemåder.',
    de: 'Schreiben Sie das gesamte Podcast-Skript auf Deutsch. Verwenden Sie natürliche deutsche Ausdrücke und Redewendungen.',
    es: 'Escribe todo el guión del podcast en español. Usa expresiones naturales y modismos en español.',
    fi: 'Kirjoita koko podcast-käsikirjoitus suomeksi. Käytä luonnollisia suomalaisia ilmaisuja ja sanontoja.',
    fr: 'Écrivez tout le script du podcast en français. Utilisez des expressions naturelles et des idiomes français.',
    gu: 'આખી પોડકાસ્ટ સ્ક્રિપ્ટ ગુજરાતીમાં લખો. કુદરતી ગુજરાતી અભિવ્યક્તિઓ અને વાગ્મિતાઓનો ઉપયોગ કરો.',
    hi: 'पूरी पॉडकास्ट स्क्रिप्ट हिंदी में लिखें। प्राकृतिक हिंदी अभिव्यक्तियों और मुहावरों का उपयोग करें।',
    id: 'Tulis seluruh naskah podcast dalam bahasa Indonesia. Gunakan ungkapan dan idiom Indonesia yang alami.',
    it: 'Scrivi tutto lo script del podcast in italiano. Usa espressioni naturali e idiomi italiani.',
    ja: 'ポッドキャストの台本をすべて日本語で書いてください。自然な日本語の表現や慣用句を使ってください。',
    kn: 'ಸಂಪೂರ್ಣ ಪಾಡ್‌ಕಾಸ್ಟ್ ಸ್ಕ್ರಿಪ್ಟ್ ಅನ್ನು ಕನ್ನಡದಲ್ಲಿ ಬರೆಯಿರಿ. ನೈಸರ್ಗಿಕ ಕನ್ನಡ ಅಭಿವ್ಯಕ್ತಿಗಳು ಮತ್ತು ಭಾಷಾವಿಲಾಸಗಳನ್ನು ಬಳಸಿ.',
    ko: '팟캐스트 대본을 모두 한국어로 작성하세요. 자연스러운 한국어 표현과 관용구를 사용하세요.',
    ml: 'മുഴുവൻ പോഡ്കാസ്റ്റ് സ്ക്രിപ്റ്റും മലയാളത്തിൽ എഴുതുക. സ്വാഭാവിക മലയാള പദപ്രയോഗങ്ങളും ഭാഷാചാതുര്യവും ഉപയോഗിക്കുക.',
    mr: 'संपूर्ण पॉडकास्ट स्क्रिप्ट मराठीत लिहा. नैसर्गिक मराठी अभिव्यक्ती आणि वाक्प्रचार वापरा.',
    nb: 'Skriv hele podcast-manuset på norsk. Bruk naturlige norske uttrykk og talemåter.',
    nl: 'Schrijf het hele podcast-script in het Nederlands. Gebruik natuurlijke Nederlandse uitdrukkingen en idiomen.',
    pl: 'Napisz cały skrypt podcastu w języku polskim. Używaj naturalnych polskich wyrażeń i idiomów.',
    pt: 'Escreva todo o roteiro do podcast em português. Use expressões naturais e idiomas portugueses.',
    ru: 'Напишите весь сценарий подкаста на русском языке. Используйте естественные русские выражения и идиомы.',
    sv: 'Skriv hela podcast-manuset på svenska. Använd naturliga svenska uttryck och talesätt.',
    sw: 'Andika hati ya mazungumzo ya podcast kwa Kiswahili. Tumia maneno na nahau za asili za Kiswahili.',
    ta: 'முழு பாட்காஸ்ட் ஸ்கிரிப்டையும் தமிழில் எழுதுங்கள். இயல்பான தமிழ் வெளிப்பாடுகள் மற்றும் பழமொழிகளைப் பயன்படுத்துங்கள்.',
    te: 'మొత్తం పోడ్‌కాస్ట్ స్క్రిప్ట్‌ను తెలుగులో రాయండి. సహజమైన తెలుగు భావవ్యక్తీకరణలు మరియు భాషాలంకారాలను ఉపయోగించండి.',
    th: 'เขียนสคริปต์พอดแคสต์ทั้งหมดเป็นภาษาไทย ใช้สำนวนและสุภาษิตไทยที่เป็นธรรมชาติ',
    tr: 'Tüm podcast senaryosunu Türkçe yazın. Doğal Türkçe ifadeler ve deyimler kullanın.',
    uk: 'Напишіть весь сценарій подкасту українською мовою. Використовуйте природні українські вирази та ідіоми.',
    ur: 'پوری پوڈکاسٹ اسکرپٹ اردو میں لکھیں۔ قدرتی اردو تاثرات اور محاورے استعمال کریں۔',
    vi: 'Viết toàn bộ kịch bản podcast bằng tiếng Việt. Sử dụng các biểu hiện và thành ngữ tiếng Việt tự nhiên.',
    zh: '请用中文编写整个播客脚本。使用自然的中文表达和习语。'
  };
  
  return instructions[language] || instructions.en;
}

function getTaskInstructions(language: string, duration: number, format: string): string {
  const instructions: Record<string, string> = {
    en: `Based on the following presentation content, create a ${duration}-minute ${format} podcast script:

Remember to:
1. Start with a brief introduction
2. Cover the main points from the presentation
3. Keep the dialogue natural and engaging
4. End with a summary or conclusion
5. Target approximately ${duration} minutes of speaking time (roughly ${duration * 150} words)`,
    es: `Basándote en el siguiente contenido de presentación, crea un guión de podcast de ${duration} minutos en formato ${format}:

Recuerda:
1. Comenzar con una breve introducción
2. Cubrir los puntos principales de la presentación
3. Mantener el diálogo natural y atractivo
4. Terminar con un resumen o conclusión
5. Apuntar a aproximadamente ${duration} minutos de tiempo de conversación (aproximadamente ${duration * 150} palabras)`,
    fr: `Basé sur le contenu de présentation suivant, créez un script de podcast de ${duration} minutes au format ${format}:

N'oubliez pas de:
1. Commencer par une brève introduction
2. Couvrir les points principaux de la présentation
3. Garder le dialogue naturel et engageant
4. Terminer par un résumé ou une conclusion
5. Viser environ ${duration} minutes de temps de parole (environ ${duration * 150} mots)`,
    de: `Basierend auf dem folgenden Präsentationsinhalt, erstellen Sie ein ${duration}-minütiges ${format} Podcast-Skript:

Denken Sie daran:
1. Mit einer kurzen Einführung beginnen
2. Die Hauptpunkte der Präsentation abdecken
3. Den Dialog natürlich und ansprechend halten
4. Mit einer Zusammenfassung oder einem Fazit enden
5. Etwa ${duration} Minuten Sprechzeit anstreben (etwa ${duration * 150} Wörter)`,
    it: `Basandoti sul seguente contenuto della presentazione, crea uno script podcast di ${duration} minuti in formato ${format}:

Ricorda di:
1. Iniziare con una breve introduzione
2. Coprire i punti principali della presentazione
3. Mantenere il dialogo naturale e coinvolgente
4. Terminare con un riassunto o conclusione
5. Mirare a circa ${duration} minuti di tempo di conversazione (circa ${duration * 150} parole)`,
    pt: `Com base no seguinte conteúdo da apresentação, crie um roteiro de podcast de ${duration} minutos no formato ${format}:

Lembre-se de:
1. Começar com uma breve introdução
2. Cobrir os pontos principais da apresentação
3. Manter o diálogo natural e envolvente
4. Terminar com um resumo ou conclusão
5. Visar aproximadamente ${duration} minutos de tempo de fala (aproximadamente ${duration * 150} palavras)`,
    nl: `Gebaseerd op de volgende presentatie-inhoud, maak een ${duration}-minuten ${format} podcast script:

Vergeet niet om:
1. Te beginnen met een korte introductie
2. De hoofdpunten van de presentatie te behandelen
3. De dialoog natuurlijk en boeiend te houden
4. Te eindigen met een samenvatting of conclusie
5. Ongeveer ${duration} minuten spreektijd na te streven (ongeveer ${duration * 150} woorden)`,
    ja: `以下のプレゼンテーション内容に基づいて、${duration}分間の${format}形式のポッドキャスト台本を作成してください：

以下を忘れずに：
1. 簡潔な導入で始める
2. プレゼンテーションの要点をカバーする
3. 対話を自然で魅力的に保つ
4. 要約または結論で終える
5. 約${duration}分の話し時間を目標にする（約${duration * 150}語）`,
    ko: `다음 프레젠테이션 내용을 바탕으로 ${duration}분 ${format} 팟캐스트 대본을 작성하세요:

다음 사항을 기억하세요:
1. 간단한 소개로 시작하기
2. 프레젠테이션의 주요 포인트 다루기
3. 대화를 자연스럽고 매력적으로 유지하기
4. 요약이나 결론으로 마무리하기
5. 약 ${duration}분의 발화 시간을 목표로 하기 (약 ${duration * 150}단어)`,
    zh: `基于以下演示内容，创建一个${duration}分钟的${format}播客脚本：

记住要：
1. 以简短的介绍开始
2. 涵盖演示的要点
3. 保持对话自然和引人入胜
4. 以总结或结论结束
5. 目标大约${duration}分钟的说话时间（大约${duration * 150}个字）`,
    ru: `На основе следующего содержания презентации создайте ${duration}-минутный сценарий подкаста в формате ${format}:

Помните:
1. Начать с краткого введения
2. Охватить основные моменты презентации
3. Сохранить диалог естественным и увлекательным
4. Закончить резюме или заключением
5. Нацелиться на примерно ${duration} минут времени разговора (примерно ${duration * 150} слов)`
  };
  
  return instructions[language] || instructions.en;
}

function getFinalInstruction(language: string): string {
  const instructions: Record<string, string> = {
    en: 'Generate the podcast script now',
    es: 'Genera el guión del podcast ahora',
    fr: 'Générez le script du podcast maintenant',
    de: 'Generieren Sie das Podcast-Skript jetzt',
    it: 'Genera lo script del podcast ora',
    pt: 'Gere o roteiro do podcast agora',
    nl: 'Genereer het podcast script nu',
    ja: '今すぐポッドキャスト台本を生成してください',
    ko: '지금 팟캐스트 대본을 생성하세요',
    zh: '现在生成播客脚本',
    ru: 'Сгенерируйте сценарий подкаста сейчас'
  };
  
  return instructions[language] || instructions.en;
}

function getSystemPromptForFormat(
  format: PodcastFormat, 
  duration: number,
  voice1Gender: 'male' | 'female',
  voice2Gender: 'male' | 'female',
  language: string = 'en'
): string {
  const speaker1Name = getGenderAppropriateName(voice1Gender, 1);
  const speaker2Name = getGenderAppropriateName(voice2Gender, 2);
  
  const languageInstructions = getLanguageInstructions(language);
  
  const basePrompt = `You are a professional podcast script writer. Create an engaging, natural-sounding dialogue script for a ${duration}-minute podcast episode. 

${languageInstructions}

CRITICAL: Format each line EXACTLY as shown below with markdown bold formatting:
**${speaker1Name}:** [dialogue]
**${speaker2Name}:** [dialogue]

DO NOT use any other format. Each speaker line MUST start with **${speaker1Name}:** or **${speaker2Name}:** in bold markdown.

The speakers are:
- ${speaker1Name} (${voice1Gender})
- ${speaker2Name} (${voice2Gender})

Important guidelines:
- Make the conversation feel natural and conversational
- Include verbal fillers occasionally for realism (appropriate to the language)
- Add personality and emotion to the speakers
- Keep the pace appropriate for a ${duration}-minute episode
- Include smooth transitions between topics
- Make sure both speakers have roughly equal speaking time
- Each speaker's dialogue should be on a single line (no line breaks within dialogue)
- IMPORTANT: Incorporate descriptions of the visual elements naturally into the conversation
- When discussing images, describe them vividly as if painting a picture for the listener
- Use the image descriptions to add richness and context to the discussion`;

  const formatSpecific = {
    conversation: `
Style: Casual conversation between two podcast hosts discussing the presentation content
- ${speaker1Name} is the main host who guides the conversation
- ${speaker2Name} is the co-host who adds insights and asks clarifying questions
- Include friendly banter and personal reactions
- Make it feel like a natural discussion between colleagues`,
    
    interview: `
Style: Professional interview format
- ${speaker1Name} is the interviewer asking thoughtful questions
- ${speaker2Name} is the expert/guest providing detailed answers
- Include follow-up questions and requests for clarification
- Make ${speaker2Name} sound knowledgeable and authoritative`,
    
    educational: `
Style: Educational/teaching format
- ${speaker1Name} is the teacher/instructor explaining concepts
- ${speaker2Name} is the curious student asking questions
- Include "aha" moments and learning confirmations
- Break down complex topics into digestible pieces`,
    
    debate: `
Style: Friendly debate/discussion with different perspectives
- ${speaker1Name} presents one viewpoint
- ${speaker2Name} presents alternative perspectives or counterpoints
- Keep it respectful and constructive
- Include moments of agreement and synthesis`
  };

  return basePrompt + formatSpecific[format];
}

function extractTextFromSlide(slide: Slide): { 
  title: string; 
  content: string[]; 
  imageDescriptions: string[];
  speakerNotes: string 
} {
  const textObjects = slide.objects.filter(obj => obj.type === 'text') as TextObject[];
  
  const titleObj = textObjects.find(obj => obj.role === 'title' || obj.role === 'heading');
  const title = titleObj?.content || '';
  
  const contentObjects = textObjects.filter(obj => 
    obj.role !== 'title' && obj.role !== 'heading' && obj.role !== 'footer'
  );
  const content = contentObjects.map(obj => obj.content);
  
  // Extract image descriptions from generationDescription field (clean descriptions without style)
  const imageObjects = slide.objects.filter(obj => obj.type === 'image') as ImageObject[];
  const imageDescriptions = imageObjects
    .map(obj => obj.generationDescription || obj.alt || '')
    .filter(desc => desc.length > 0);
  
  const speakerNotes = slide.notes || '';
  
  return { title, content, imageDescriptions, speakerNotes };
}

export function convertPresentationToContent(
  presentation: Presentation,
  slides: Slide[]
): PresentationContent {
  const slideContents = slides.map((slide, index) => {
    const { title, content, imageDescriptions, speakerNotes } = extractTextFromSlide(slide);
    return {
      slideNumber: index + 1,
      title,
      content,
      imageDescriptions,
      speakerNotes
    };
  });

  return {
    title: presentation.title,
    slideCount: slides.length,
    slides: slideContents
  };
}

function formatPresentationContent(content: PresentationContent): string {
  let formatted = `Presentation Title: ${content.title}\n\n`;
  
  for (const slide of content.slides) {
    formatted += `Slide ${slide.slideNumber}: ${slide.title}\n`;
    if (slide.content.length > 0) {
      formatted += `Content:\n${slide.content.map(c => `- ${c}`).join('\n')}\n`;
    }
    if (slide.imageDescriptions.length > 0) {
      formatted += `Visual Elements:\n${slide.imageDescriptions.map(desc => `- Image: ${desc}`).join('\n')}\n`;
    }
    if (slide.speakerNotes) {
      formatted += `Speaker Notes: ${slide.speakerNotes}\n`;
    }
    formatted += '\n';
  }
  
  return formatted;
}

export async function generatePodcastScript(
  content: PresentationContent,
  format: PodcastFormat,
  duration: number,
  voice1Gender: 'male' | 'female' = 'female',
  voice2Gender: 'male' | 'female' = 'male',
  language: string = 'en'
): Promise<string> {
  // Dynamically import gemini only on server-side
  const { geminiModel } = await import('./gemini');
  const model = geminiModel;
  
  const systemPrompt = getSystemPromptForFormat(format, duration, voice1Gender, voice2Gender, language);
  const presentationData = formatPresentationContent(content);
  
  const taskInstructions = getTaskInstructions(language, duration, format);
  
  const prompt = `${systemPrompt}

${taskInstructions}

${presentationData}

${getFinalInstruction(language)}:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

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
    host: 'ru-RU-Wavenet-A',   // Using Wavenet until Chirp available
    expert: 'ru-RU-Wavenet-B'
  }
};