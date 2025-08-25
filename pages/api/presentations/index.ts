import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const presentationsRef = collection(db, 'presentations');
      const q = query(presentationsRef, orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      
      const presentations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return res.status(200).json(presentations);
    } catch (error) {
      console.error('Error fetching presentations:', error);
      return res.status(500).json({ error: 'Failed to fetch presentations' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}