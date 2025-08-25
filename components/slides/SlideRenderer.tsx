import { Slide, SlideType } from '@/lib/models/slide';
import TitleSlide from './renderers/TitleSlide';
import BulletSlide from './renderers/BulletSlide';
import ImageSlide from './renderers/ImageSlide';
import TwoColumnSlide from './renderers/TwoColumnSlide';
import QuoteSlide from './renderers/QuoteSlide';
import ContentSlide from './renderers/ContentSlide';
import ThreeImagesSlide from './renderers/ThreeImagesSlide';

interface SlideRendererProps {
  slide: Slide;
  isEditing?: boolean;
  scale?: number;
}

export default function SlideRenderer({ slide, isEditing = false, scale = 1 }: SlideRendererProps) {
  const slideComponents = {
    [SlideType.TITLE]: TitleSlide,
    [SlideType.BULLETS]: BulletSlide,
    [SlideType.IMAGE]: ImageSlide,
    [SlideType.TWO_COLUMN]: TwoColumnSlide,
    [SlideType.QUOTE]: QuoteSlide,
    [SlideType.CONTENT]: ContentSlide,
    [SlideType.THREE_IMAGES]: ThreeImagesSlide,
  };

  // Default to ContentSlide for unknown types (better than blank)
  const Component = slideComponents[slide.type] || ContentSlide;

  return (
    <div 
      className="relative bg-white shadow-lg"
      style={{
        width: `${1920 * scale}px`,
        height: `${1080 * scale}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
      }}
    >
      <Component slide={slide} isEditing={isEditing} />
    </div>
  );
}