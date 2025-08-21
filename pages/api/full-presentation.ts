import type { NextApiRequest, NextApiResponse } from 'next';
import { VertexAI } from '@google-cloud/vertexai';

// Full presentation generation matching macOS app
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();
  
  try {
    // Extract parameters
    const {
      topic = 'Artificial Intelligence',
      slideCount = 20,
      author = 'Phoenix Presenter',
      tone = 'professional',
      goal = 'inform',
      audience = 'general',
      modality = 'in-person'
    } = req.body || req.query;
    
    const todayDate = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // Initialize Vertex AI
    const vertex = new VertexAI({
      project: 'phoenix-web-app',
      location: 'us-central1',
    });
    
    const model = vertex.preview.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 16384, // Increased for larger responses
        topP: 0.95,
      },
    });
    
    // Build the full prompt (your exact prompt)
    const prompt = `Generate a presentation about: ${topic}

Return a JSON structure with sections and slides. Each section contains related slides.

CRITICAL REQUIREMENTS:

1. STRUCTURE:
{
  "title": "Presentation Title",
  "author": "${author}",
  "date": "${todayDate}",
  "tone": "${tone}",
  "goal": "${goal}",
  "audience": "${audience}",
  "sections": [
    {
      "title": "Section Name",
      "slides": [
        {
          "type": "slideType",
          "title": "Slide Title",
          "subtitle": "Optional Subtitle",
          "content": {
            // Content structure varies by type
          },
          "speakerNotes": "Detailed narrative (150-250 words)",
          "presenterNotes": ["Key point 1", "Key point 2"],
          "images": [
            {
              "id": "img_001",
              "description": "Detailed image description for AI generation"
            }
          ]
        }
      ]
    }
  ]
}

2. SLIDE TYPES AND CONTENT STRUCTURES:

- agenda: { "bullets": ["Section 1", "Section 2", "Section 3"] }
- sectionHeader: { "body": "Optional intro text" }
- bullets: { "bullets": ["Point 1", "Point 2", "Point 3"] }
- twoColumn: { "leftBullets": ["Left 1", "Left 2"], "rightBullets": ["Right 1", "Right 2"] }
- threeColumns: { "column1": {"title": "Col 1", "bullets": ["Item 1"]}, "column2": {...}, "column3": {...} }
- comparison: { "leftTitle": "Option A", "leftBullets": ["Pro 1"], "rightTitle": "Option B", "rightBullets": ["Pro 1"] }
- problemStatement: { "problem": "The challenge", "solution": "How we solve it" }
- quote: { "quote": "The quote text", "attribution": "Speaker Name" }
- timeline: { "events": [{"date": "2024", "title": "Event", "description": "Details"}] }
- table: { "headers": ["Col1", "Col2"], "rows": [["Data1", "Data2"]] }
- image: { "caption": "Image caption" }
- twoImages: { "leftCaption": "Left image", "rightCaption": "Right image" }
- threeImages: { "image1Caption": "First", "image2Caption": "Second", "image3Caption": "Third" }
- fourImages: { "image1Caption": "First", "image2Caption": "Second", "image3Caption": "Third", "image4Caption": "Fourth" }
- imageGrid: { "captions": ["Cap 1", "Cap 2", "Cap 3", "Cap 4", "Cap 5", "Cap 6"] }
- qAndA: { "body": "We welcome your questions" }
- thankYou: { "body": "Thank you message" }

3. CONTENT GUIDELINES:
- Create exactly ${slideCount} content slides
- First slide MUST be "agenda" type listing all sections
- Organize into 3-5 logical sections
- Use "sectionHeader" to introduce each section
- Use "threeImages" for AT LEAST 20-25% of slides
- Vary slide types for visual interest
- ALL bullet arrays MUST have 3-7 items
- Body text is OPTIONAL (1-2 sentences, 20-40 words)

4. SPEAKER NOTES:
- Every slide MUST have detailed speaker notes (150-250 words)
- Tell the story behind the bullets
- Include specific examples and statistics
- Use conversational language

5. PRESENTER NOTES:
- 5-8 concise points for live delivery
- NO bullet symbols, just text
- Return as array: ["Point 1", "Point 2"]

6. IMAGES:
- Every slide MUST have exactly 4 image descriptions
- Detailed and AI-generation ready (30-50 words each)
- Vary styles: photorealistic, illustrated, abstract

7. FINAL SLIDES:
- Second-to-last slide: type "qAndA"
- Last slide: type "thankYou"

TARGET PARAMETERS:
- Goal: ${goal}
- Audience: ${audience}
- Tone: ${tone}
- Modality: ${modality}
- Length: ${slideCount} slides

Return ONLY the JSON structure with no additional text or formatting.`;

    // Generate presentation
    console.log(`Generating ${slideCount}-slide presentation about "${topic}"...`);
    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from Gemini');
    }
    
    // Parse JSON with better error handling
    let presentation;
    try {
      // Clean up the response - remove markdown code blocks and any trailing content
      let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find the actual JSON object (starts with { and ends with })
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No valid JSON found in response');
      }
      
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      
      // Remove any control characters that might break JSON parsing
      cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      // Fix common JSON issues
      cleaned = cleaned
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
        .replace(/"\s*:\s*"([^"]*)"([^,}\]])/g, '": "$1"$2') // Fix missing commas after strings
        .replace(/}\s*{/g, '},{'); // Fix missing commas between objects
      
      presentation = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw text length:', text?.length);
      console.error('First 500 chars:', text?.substring(0, 500));
      console.error('Last 500 chars:', text?.substring(text.length - 500));
      
      // Return a minimal valid presentation structure
      presentation = {
        title: topic,
        author: author,
        date: todayDate,
        tone: tone,
        goal: goal,
        audience: audience,
        sections: [
          {
            title: "Content Generation Error",
            slides: [
              {
                type: "title",
                title: topic,
                subtitle: "Presentation Generated with Errors",
                content: { body: "The AI response was too complex to parse. Please try again with fewer slides or a simpler topic." },
                speakerNotes: "There was an issue parsing the full presentation content.",
                presenterNotes: ["Technical issue", "Retry recommended"],
                images: []
              }
            ]
          }
        ]
      };
    }
    
    // Calculate timing
    const elapsedMs = Date.now() - startTime;
    
    // Log performance
    console.log(`Generated in ${(elapsedMs / 1000).toFixed(2)} seconds`);
    
    // Return response
    return res.status(200).json({
      success: true,
      presentation,
      metadata: {
        topic,
        slideCount,
        actualSlideCount: presentation.sections?.reduce((acc: number, s: any) => 
          acc + (s.slides?.length || 0), 0) || 0,
        sectionCount: presentation.sections?.length || 0,
        timing: {
          totalMs: elapsedMs,
          totalSeconds: (elapsedMs / 1000).toFixed(2)
        }
      }
    });
    
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    console.error('Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timing: {
        totalMs: elapsedMs,
        totalSeconds: (elapsedMs / 1000).toFixed(2)
      }
    });
  }
}

export const config = {
  api: {
    responseLimit: false,
    externalResolver: true,
  },
};