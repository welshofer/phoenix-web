import type { NextApiRequest, NextApiResponse } from 'next';
import { getPresentation } from '@/lib/firebase/presentations';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Presentation ID required' });
  }

  if (req.method === 'GET') {
    try {
      const presentation = await getPresentation(id);
      
      if (!presentation) {
        return res.status(404).json({ error: 'Presentation not found' });
      }

      return res.status(200).json(presentation);
    } catch (error) {
      console.error('Error fetching presentation:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch presentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}