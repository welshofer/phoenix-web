import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text } = req.query;
  
  // Generate a simple SVG placeholder with the text
  const svg = `
    <svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="450" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#999" text-anchor="middle" dominant-baseline="middle">
        Image placeholder
      </text>
      <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="12" fill="#bbb" text-anchor="middle" dominant-baseline="middle">
        ${text ? text.toString().substring(0, 50) + '...' : 'No description'}
      </text>
    </svg>
  `;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(svg);
}