import React from 'react';
import { PresentationEditor } from '@/app/components/editor/PresentationEditor';
import { Presentation } from '@/lib/models/presentation';
import { Slide, SlideType, TextObject, ImageObject, SlideObjectUnion } from '@/lib/models/slide';
import { Timestamp } from 'firebase/firestore';

// Simple slide interface for the editor demo
interface SimpleSlide {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  order: number;
}

const sampleSlides: SimpleSlide[] = [
  {
    id: 'slide-1',
    type: 'title',
    title: 'Welcome to Phoenix',
    subtitle: 'AI-Powered Presentations',
    content: '',
    order: 0,
  },
  {
    id: 'slide-2',
    type: 'content',
    title: 'Introduction',
    subtitle: 'About Our Platform',
    content: 'Phoenix Web is a cutting-edge presentation platform that leverages AI to create stunning presentations in seconds.',
    order: 1,
  },
  {
    id: 'slide-3',
    type: 'bullet',
    title: 'Key Features',
    subtitle: '',
    content: JSON.stringify({
      bullets: [
        'AI-powered content generation',
        'Professional design templates',
        'Real-time collaboration',
        'Cloud storage and sync',
        'Export to multiple formats',
      ],
    }),
    order: 2,
  },
  {
    id: 'slide-4',
    type: 'quote',
    title: '',
    subtitle: '',
    content: JSON.stringify({
      quote: 'The best way to predict the future is to invent it.',
      author: 'Alan Kay',
    }),
    order: 3,
  },
  {
    id: 'slide-5',
    type: 'image',
    title: 'Visual Impact',
    subtitle: 'Images that speak louder than words',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200',
    order: 4,
  },
  {
    id: 'slide-6',
    type: 'two-column',
    title: 'Two Column Layout',
    subtitle: 'Compare and Contrast',
    content: JSON.stringify({
      leftTitle: 'Traditional Presentations',
      leftContent: 'Time-consuming to create\nLimited design options\nStatic content\nManual updates',
      rightTitle: 'Phoenix Presentations',
      rightContent: 'Created in seconds\nAI-powered designs\nDynamic content\nAuto-sync across devices',
    }),
    order: 5,
  },
  {
    id: 'slide-7',
    type: 'content',
    title: 'Getting Started',
    subtitle: 'Three Simple Steps',
    content: '1. Enter your topic or upload content\n2. Choose a design template\n3. Let AI generate your presentation',
    order: 6,
  },
  {
    id: 'slide-8',
    type: 'title',
    title: 'Thank You',
    subtitle: 'Questions?',
    content: '',
    order: 7,
  },
];

// Create a demo presentation with simplified slide structure
const samplePresentation = {
  id: 'demo-presentation',
  title: 'Phoenix Web Demo',
  description: 'A demonstration of the presentation editor capabilities',
  userId: 'demo-user',
  slides: sampleSlides,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  theme: {
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    fontFamily: 'Roboto',
  },
} as any;

export default function EditorDemo() {
  const handleSave = (presentation: any) => {
    console.log('Saving presentation:', presentation);
    alert('Presentation saved! (Demo mode - not actually saved)');
  };

  const handlePresent = () => {
    console.log('Starting presentation mode');
    alert('Presentation mode would start here');
  };

  return (
    <PresentationEditor
      presentation={samplePresentation}
      onSave={handleSave}
      onPresent={handlePresent}
    />
  );
}