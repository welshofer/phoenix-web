import type { NextApiRequest, NextApiResponse } from 'next';
import { VertexAI } from '@google-cloud/vertexai';

/**
 * Simplified presentation generation API
 * More reliable with shorter, structured prompts
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();
  
  try {
    const {
      topic = 'Technology Trends',
      slideCount = 5,
      style = 'professional'
    } = req.body || req.query;
    
    // Initialize Vertex AI
    const vertex = new VertexAI({
      project: 'phoenix-web-app',
      location: 'us-central1',
    });
    
    const model = vertex.preview.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        topP: 0.95,
      },
    });
    
    // Simpler, more structured prompt
    const prompt = `Create a ${slideCount}-slide ${style} presentation about "${topic}".

Return ONLY valid JSON with this exact structure:
{
  "title": "Presentation Title",
  "author": "Phoenix AI",
  "sections": [
    {
      "title": "Introduction",
      "slides": [
        {
          "type": "title",
          "title": "Main Title",
          "subtitle": "Subtitle",
          "content": {
            "body": "Optional body text"
          },
          "speakerNotes": "What to say"
        },
        {
          "type": "bullets",
          "title": "Key Points",
          "content": {
            "bullets": ["Point 1", "Point 2", "Point 3"]
          },
          "speakerNotes": "Explain each point"
        }
      ]
    }
  ]
}

Rules:
- Create exactly ${slideCount} slides
- Keep all text concise
- First slide must be type "title"
- Use only these types: title, bullets, content
- Keep speaker notes under 100 words
- Return ONLY the JSON, no other text`;

    console.log(`Generating ${slideCount}-slide presentation about "${topic}"...`);
    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from Gemini');
    }
    
    // Parse with robust error handling
    let presentation;
    try {
      // Extract JSON from response
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Find JSON boundaries
      const start = cleanText.indexOf('{');
      const end = cleanText.lastIndexOf('}');
      
      if (start >= 0 && end > start) {
        const jsonStr = cleanText.substring(start, end + 1);
        presentation = JSON.parse(jsonStr);
      } else {
        throw new Error('No valid JSON structure found');
      }
    } catch (e) {
      console.error('Parse error:', e);
      
      // Fallback presentation
      presentation = {
        title: topic,
        author: "Phoenix AI",
        sections: [
          {
            title: "Main Content",
            slides: [
              {
                type: "title",
                title: topic,
                subtitle: "Generated Presentation",
                content: { body: "" },
                speakerNotes: "Welcome to this presentation"
              },
              {
                type: "bullets",
                title: "Key Points",
                content: {
                  bullets: [
                    "Important point about " + topic,
                    "Another key consideration",
                    "Final thought to consider"
                  ]
                },
                speakerNotes: "These are the main points to discuss"
              },
              {
                type: "content",
                title: "Conclusion",
                content: {
                  body: "Thank you for your attention. This presentation covered the key aspects of " + topic
                },
                speakerNotes: "Wrap up the presentation"
              }
            ]
          }
        ]
      };
    }
    
    // Add metadata
    presentation.date = new Date().toLocaleDateString();
    presentation.tone = style;
    presentation.goal = 'inform';
    presentation.audience = 'general';
    
    const elapsedMs = Date.now() - startTime;
    
    return res.status(200).json({
      success: true,
      presentation,
      metadata: {
        topic,
        slideCount: presentation.sections?.reduce((acc: number, s: any) => 
          acc + (s.slides?.length || 0), 0) || slideCount,
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