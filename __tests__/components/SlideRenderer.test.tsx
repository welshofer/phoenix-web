import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SlideRenderer } from '@/components/slides/SlideRenderer';
import { Slide } from '@/lib/models/slide';

// Mock child components
jest.mock('@/components/slides/renderers/TitleSlide', () => ({
  TitleSlide: ({ slide }: any) => <div data-testid="title-slide">{slide.heading}</div>,
}));

jest.mock('@/components/slides/renderers/BulletsSlide', () => ({
  BulletsSlide: ({ slide }: any) => (
    <div data-testid="bullets-slide">
      {slide.heading}
      <ul>
        {slide.bullets?.map((bullet: string, i: number) => (
          <li key={i}>{bullet}</li>
        ))}
      </ul>
    </div>
  ),
}));

jest.mock('@/components/slides/renderers/ContentSlide', () => ({
  ContentSlide: ({ slide }: any) => (
    <div data-testid="content-slide">
      {slide.heading}
      <p>{slide.body}</p>
    </div>
  ),
}));

jest.mock('@/components/slides/renderers/ImageSlide', () => ({
  ImageSlide: ({ slide }: any) => (
    <div data-testid="image-slide">
      {slide.heading}
      <img alt={slide.imageDescription} />
    </div>
  ),
}));

jest.mock('@/components/slides/renderers/ThreeImagesSlide', () => ({
  ThreeImagesSlide: ({ slide }: any) => (
    <div data-testid="three-images-slide">
      {slide.heading}
      {slide.imageDescriptions?.map((desc: string, i: number) => (
        <img key={i} alt={desc} />
      ))}
    </div>
  ),
}));

describe('SlideRenderer', () => {
  const mockSlides: Slide[] = [
    {
      id: '1',
      type: 'title',
      heading: 'Title Slide',
      subheading: 'Subtitle',
      theme: 'default',
    },
    {
      id: '2',
      type: 'bullets',
      heading: 'Bullet Points',
      bullets: ['Point 1', 'Point 2', 'Point 3'],
      theme: 'default',
    },
    {
      id: '3',
      type: 'content',
      heading: 'Content Slide',
      body: 'This is the content body',
      theme: 'default',
    },
    {
      id: '4',
      type: 'image',
      heading: 'Image Slide',
      imageDescription: 'Test image description',
      theme: 'default',
    },
    {
      id: '5',
      type: 'threeImages',
      heading: 'Three Images',
      imageDescriptions: ['Image 1', 'Image 2', 'Image 3'],
      theme: 'default',
    },
  ];

  describe('Rendering', () => {
    it('should render the correct slide type', () => {
      render(<SlideRenderer slides={mockSlides} currentSlideIndex={0} />);
      expect(screen.getByTestId('title-slide')).toBeInTheDocument();
      expect(screen.getByText('Title Slide')).toBeInTheDocument();
    });

    it('should render bullets slide correctly', () => {
      render(<SlideRenderer slides={mockSlides} currentSlideIndex={1} />);
      expect(screen.getByTestId('bullets-slide')).toBeInTheDocument();
      expect(screen.getByText('Point 1')).toBeInTheDocument();
      expect(screen.getByText('Point 2')).toBeInTheDocument();
      expect(screen.getByText('Point 3')).toBeInTheDocument();
    });

    it('should render content slide correctly', () => {
      render(<SlideRenderer slides={mockSlides} currentSlideIndex={2} />);
      expect(screen.getByTestId('content-slide')).toBeInTheDocument();
      expect(screen.getByText('This is the content body')).toBeInTheDocument();
    });

    it('should render image slide correctly', () => {
      render(<SlideRenderer slides={mockSlides} currentSlideIndex={3} />);
      expect(screen.getByTestId('image-slide')).toBeInTheDocument();
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Test image description');
    });

    it('should render three images slide correctly', () => {
      render(<SlideRenderer slides={mockSlides} currentSlideIndex={4} />);
      expect(screen.getByTestId('three-images-slide')).toBeInTheDocument();
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
    });
  });

  describe('Navigation', () => {
    it('should navigate to next slide', () => {
      const onNavigate = jest.fn();
      const { rerender } = render(
        <SlideRenderer 
          slides={mockSlides} 
          currentSlideIndex={0} 
          onNavigate={onNavigate}
        />
      );

      // Simulate next navigation
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(onNavigate).toHaveBeenCalledWith(1);

      rerender(
        <SlideRenderer 
          slides={mockSlides} 
          currentSlideIndex={1} 
          onNavigate={onNavigate}
        />
      );
      
      expect(screen.getByTestId('bullets-slide')).toBeInTheDocument();
    });

    it('should navigate to previous slide', () => {
      const onNavigate = jest.fn();
      render(
        <SlideRenderer 
          slides={mockSlides} 
          currentSlideIndex={2} 
          onNavigate={onNavigate}
        />
      );

      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(onNavigate).toHaveBeenCalledWith(1);
    });

    it('should not navigate past first slide', () => {
      const onNavigate = jest.fn();
      render(
        <SlideRenderer 
          slides={mockSlides} 
          currentSlideIndex={0} 
          onNavigate={onNavigate}
        />
      );

      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('should not navigate past last slide', () => {
      const onNavigate = jest.fn();
      render(
        <SlideRenderer 
          slides={mockSlides} 
          currentSlideIndex={mockSlides.length - 1} 
          onNavigate={onNavigate}
        />
      );

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty slides array', () => {
      render(<SlideRenderer slides={[]} currentSlideIndex={0} />);
      expect(screen.getByText(/No slides available/i)).toBeInTheDocument();
    });

    it('should handle invalid slide index', () => {
      render(<SlideRenderer slides={mockSlides} currentSlideIndex={10} />);
      // Should default to first slide or show error
      expect(screen.getByTestId('title-slide')).toBeInTheDocument();
    });

    it('should handle missing slide data gracefully', () => {
      const invalidSlide: Slide = {
        id: 'invalid',
        type: 'unknown' as any,
        theme: 'default',
      };
      
      render(<SlideRenderer slides={[invalidSlide]} currentSlideIndex={0} />);
      // Should show error or fallback
      expect(screen.queryByText(/unsupported slide type/i)).toBeInTheDocument();
    });
  });

  describe('Theming', () => {
    it('should apply theme correctly', () => {
      const themedSlide: Slide = {
        id: 'themed',
        type: 'title',
        heading: 'Themed Slide',
        theme: 'dark',
      };
      
      const { container } = render(
        <SlideRenderer slides={[themedSlide]} currentSlideIndex={0} />
      );
      
      expect(container.firstChild).toHaveClass('theme-dark');
    });

    it('should handle theme changes', () => {
      const { rerender, container } = render(
        <SlideRenderer slides={mockSlides} currentSlideIndex={0} theme="light" />
      );
      
      expect(container.firstChild).toHaveClass('theme-light');
      
      rerender(
        <SlideRenderer slides={mockSlides} currentSlideIndex={0} theme="dark" />
      );
      
      expect(container.firstChild).toHaveClass('theme-dark');
    });
  });

  describe('Callbacks', () => {
    it('should call onSlideChange callback', () => {
      const onSlideChange = jest.fn();
      const { rerender } = render(
        <SlideRenderer 
          slides={mockSlides} 
          currentSlideIndex={0} 
          onSlideChange={onSlideChange}
        />
      );

      rerender(
        <SlideRenderer 
          slides={mockSlides} 
          currentSlideIndex={1} 
          onSlideChange={onSlideChange}
        />
      );

      expect(onSlideChange).toHaveBeenCalledWith(1, mockSlides[1]);
    });

    it('should call onComplete when reaching last slide', () => {
      const onComplete = jest.fn();
      const onNavigate = jest.fn();
      
      render(
        <SlideRenderer 
          slides={mockSlides} 
          currentSlideIndex={mockSlides.length - 1} 
          onComplete={onComplete}
          onNavigate={onNavigate}
        />
      );

      // Try to navigate past last slide
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(onComplete).toHaveBeenCalled();
    });
  });
});