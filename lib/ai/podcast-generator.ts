import { Presentation } from '@/lib/models/presentation';
import { Slide, TextObject, ImageObject, SlideObjectUnion } from '@/lib/models/slide';
import { PodcastFormat } from './podcast-voices';

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
  
  const basePrompt = `You are a professional podcast script writer creating a ${duration}-minute ${format} podcast episode.

${languageInstructions}

CRITICAL FORMATTING REQUIREMENTS:
Each speaker line MUST be formatted EXACTLY as:
**${speaker1Name}:** [dialogue]
**${speaker2Name}:** [dialogue]

The speakers are:
- ${speaker1Name} (${voice1Gender})
- ${speaker2Name} (${voice2Gender})

CONTENT REQUIREMENTS:
- Create a natural, engaging conversation that covers ALL the presentation content
- Include discussions about EVERY slide, including titles, bullet points, and speaker notes
- Describe and discuss ALL images mentioned in the presentation
- Incorporate ALL speaker notes as insider knowledge or additional context
- Make the dialogue feel natural with occasional verbal fillers (um, you know, well, etc.)
- Include reactions, questions, and insights about the content
- Ensure both speakers contribute roughly equally
- Target ${duration} minutes of speaking time (approximately ${duration * 150} words)
- Include smooth transitions between topics
- Add personality and emotion to make it engaging`;

  const formatSpecific = {
    conversation: `
STYLE: Casual conversation between two knowledgeable podcast hosts
- ${speaker1Name} is the main host who guides the discussion
- ${speaker2Name} is the co-host who adds insights and asks clarifying questions
- Include friendly banter and personal reactions to the content
- Both hosts should sound excited about interesting points
- Make references to the visual elements ("That image really drives home the point...")
- Include moments where they expand on bullet points with examples`,
    
    interview: `
STYLE: Professional interview format
- ${speaker1Name} is the interviewer asking insightful questions
- ${speaker2Name} is the expert guest with deep knowledge of the presentation
- Include follow-up questions and requests for elaboration
- ${speaker2Name} should reference specific slides and data points
- The expert should explain complex concepts clearly
- Include discussion of the visual elements and what they represent`,
    
    educational: `
STYLE: Educational/teaching format
- ${speaker1Name} is the teacher/instructor explaining the presentation
- ${speaker2Name} is an engaged student asking clarifying questions
- Include "aha" moments and learning confirmations
- Break down complex topics from the slides into digestible explanations
- The teacher should reference specific slides and images
- Include explanations of why certain points are important`,
    
    debate: `
STYLE: Friendly debate with different perspectives
- ${speaker1Name} presents viewpoints aligned with the presentation
- ${speaker2Name} offers alternative perspectives or plays devil's advocate
- Keep it respectful and constructive
- Include discussion of the evidence presented in slides
- Reference specific data points and images to support arguments
- Find common ground while exploring different angles`
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
  
  // Get all text content, not just specific roles
  const titleObj = textObjects.find(obj => 
    obj.role === 'title' || obj.role === 'heading' || obj.role === 'header'
  );
  const title = titleObj?.content || '';
  
  // Get ALL text content from the slide
  const contentObjects = textObjects.filter(obj => 
    obj.role !== 'footer' && obj.role !== 'pageNumber'
  );
  const content = contentObjects.map(obj => obj.content);
  
  // Extract image descriptions - get both generationDescription and alt text
  const imageObjects = slide.objects.filter(obj => obj.type === 'image') as ImageObject[];
  const imageDescriptions = imageObjects
    .map(obj => {
      const desc = obj.generationDescription || obj.alt || '';
      return desc ? `Image: ${desc}` : '';
    })
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
  let formatted = `PRESENTATION: ${content.title}
Total Slides: ${content.slideCount}

DETAILED SLIDE CONTENT:
`;
  
  for (const slide of content.slides) {
    formatted += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLIDE ${slide.slideNumber}${slide.title ? `: ${slide.title}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    
    if (slide.content.length > 0) {
      formatted += `CONTENT:\n`;
      slide.content.forEach(c => {
        formatted += `• ${c}\n`;
      });
    }
    
    if (slide.imageDescriptions.length > 0) {
      formatted += `\nVISUAL ELEMENTS:\n`;
      slide.imageDescriptions.forEach(desc => {
        formatted += `• ${desc}\n`;
      });
    }
    
    if (slide.speakerNotes) {
      formatted += `\nSPEAKER NOTES:\n${slide.speakerNotes}\n`;
    }
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
  // Use the server-side Vertex AI client
  const { getGeminiModel } = await import('../server/vertex-ai');
  const model = await getGeminiModel();
  
  const systemPrompt = getSystemPromptForFormat(format, duration, voice1Gender, voice2Gender, language);
  const presentationData = formatPresentationContent(content);
  
  // Log the actual presentation content being used
  console.log('=== PODCAST GENERATION DEBUG ===');
  console.log('Presentation Title:', content.title);
  console.log('Slide Count:', content.slideCount);
  console.log('First 3 slides:', content.slides.slice(0, 3));
  console.log('Formatted content preview:', presentationData.substring(0, 1000));
  console.log('================================');
  
  const prompt = `${systemPrompt}

Based on the following presentation content, create a ${duration}-minute ${format} podcast script.

IMPORTANT: You MUST discuss ALL of the following content. Do not skip any slides or information.

${presentationData}

REMEMBER:
1. Start with an engaging introduction that mentions the presentation title
2. Discuss EVERY slide in order, covering all bullet points and content
3. Describe and react to ALL visual elements and images
4. Incorporate the speaker notes as additional insights
5. Keep the dialogue natural and conversational
6. Include reactions, questions, and elaborations
7. End with a meaningful summary and conclusion
8. Target approximately ${duration} minutes of speaking time (roughly ${duration * 150} words)

Generate the podcast script now. Use ONLY the format **SpeakerName:** for each line.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  
  // Get the text from the response
  let text: string;
  if (typeof response.text === 'function') {
    text = response.text();
  } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
    text = response.candidates[0].content.parts[0].text;
  } else {
    console.error('Response structure:', JSON.stringify(response, null, 2));
    throw new Error('Unable to extract text from response');
  }
  
  // Return the script directly as markdown text
  return text.trim();
}