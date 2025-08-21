import type { NextApiRequest, NextApiResponse } from 'next';
import { VertexAI } from '@google-cloud/vertexai';

// Direct minimal implementation - matching macOS app behavior
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Start timing
  const startTime = Date.now();
  
  try {
    // Initialize once per request
    const vertex = new VertexAI({
      project: 'phoenix-web-app',
      location: 'us-central1',
    });
    
    const model = vertex.preview.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        topP: 0.95,
      },
    });
    
    // Get topic from request or use default
    const topic = req.body?.topic || req.query?.topic || 'Artificial Intelligence';
    const slideCount = req.body?.slideCount || req.query?.slideCount || 10;
    
    // Build the prompt - similar to macOS app
    const prompt = `Generate a ${slideCount}-slide presentation about "${topic}".

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "Main Presentation Title",
  "subtitle": "Optional subtitle",
  "slides": [
    {
      "type": "title",
      "heading": "Slide heading",
      "subheading": "Optional subheading"
    },
    {
      "type": "bullets",
      "heading": "Slide heading",
      "bullets": ["Point 1", "Point 2", "Point 3"]
    },
    {
      "type": "content",
      "heading": "Slide heading",
      "body": "Paragraph text for content slides"
    }
  ]
}

Guidelines:
- First slide should be type "title" with the presentation title
- Include a mix of slide types (title, bullets, content)
- Make bullets concise and impactful
- Keep text concise and presentation-friendly`;

    // Single API call
    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from Gemini');
    }
    
    // Parse JSON
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const presentation = JSON.parse(cleaned);
    
    // Calculate timing
    const elapsedMs = Date.now() - startTime;
    
    // Return response
    return res.status(200).json({
      success: true,
      presentation,
      timing: {
        totalMs: elapsedMs,
        totalSeconds: (elapsedMs / 1000).toFixed(2)
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

// Ensure we don't have any timeouts
export const config = {
  api: {
    responseLimit: false,
    externalResolver: true,
  },
};