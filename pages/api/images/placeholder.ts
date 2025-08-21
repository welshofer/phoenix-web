import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * API Route: /api/images/placeholder
 * Generates SVG placeholder images for slides
 */

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { 
    text = 'Placeholder', 
    width = '1920',
    height = '1080',
    bg = '667eea',
    color = 'ffffff',
    fontSize = '72'
  } = req.query;

  const w = parseInt(width as string);
  const h = parseInt(height as string);
  const fs = parseInt(fontSize as string);

  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#${bg};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#${bg}cc;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#grad)"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
            fill="#${color}" font-size="${fs}" font-family="system-ui, sans-serif" 
            font-weight="600" opacity="0.9">
        ${decodeURIComponent(text as string)}
      </text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(svg.trim());
}