import React from 'react'
import { render, screen, fireEvent } from '@/test-utils/render'
import { SlideRenderer } from '../SlideRenderer'
import { Slide, SlideType } from '@/lib/models/slide'
import { SLIDE_DIMENSIONS } from '@/lib/models/coordinates'

describe('SlideRenderer', () => {
  const mockSlide: Slide = {
    id: 'slide-1',
    type: SlideType.TITLE,
    order: 0,
    objects: [
      {
        id: 'obj-1',
        type: 'text',
        role: 'heading',
        content: 'Test Title',
        coordinates: {
          x: 100,
          y: 100,
          width: 500,
          height: 100,
        },
        visible: true,
        locked: false,
        customStyles: {
          fontSize: 48,
          fontWeight: 700,
          color: '#000000',
        },
      },
      {
        id: 'obj-2',
        type: 'text',
        role: 'subheading',
        content: 'Test Subtitle',
        coordinates: {
          x: 100,
          y: 250,
          width: 500,
          height: 50,
        },
        visible: true,
        locked: false,
        customStyles: {
          fontSize: 24,
          fontWeight: 400,
          color: '#666666',
        },
      },
    ],
    background: {
      type: 'solid',
      value: '#ffffff',
    },
    transitions: {
      entry: 'fade',
      exit: 'slide',
    },
    notes: 'Speaker notes for this slide',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('Rendering', () => {
    it('should render slide with correct dimensions', () => {
      const { container } = render(<SlideRenderer slide={mockSlide} />)
      
      const slideContainer = container.querySelector('[data-testid="slide-container"]')
      expect(slideContainer).toBeInTheDocument()
    })

    it('should render all visible objects', () => {
      render(<SlideRenderer slide={mockSlide} />)
      
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
    })

    it('should not render invisible objects', () => {
      const slideWithHiddenObject = {
        ...mockSlide,
        objects: [
          ...mockSlide.objects,
          {
            id: 'obj-3',
            type: 'text',
            role: 'body',
            content: 'Hidden Text',
            coordinates: { x: 0, y: 0, width: 100, height: 100 },
            visible: false,
            locked: false,
          },
        ],
      }
      
      render(<SlideRenderer slide={slideWithHiddenObject} />)
      
      expect(screen.queryByText('Hidden Text')).not.toBeInTheDocument()
    })

    it('should apply custom width and height', () => {
      const customWidth = 1280
      const customHeight = 720
      
      const { container } = render(
        <SlideRenderer 
          slide={mockSlide} 
          width={customWidth} 
          height={customHeight} 
        />
      )
      
      const slideContainer = container.firstChild as HTMLElement
      expect(slideContainer).toHaveStyle({
        width: `${customWidth}px`,
        height: `${customHeight}px`,
      })
    })
  })

  describe('Interactivity', () => {
    it('should handle object click when callback provided', () => {
      const onObjectClick = jest.fn()
      
      render(
        <SlideRenderer 
          slide={mockSlide} 
          onObjectClick={onObjectClick}
        />
      )
      
      const title = screen.getByText('Test Title')
      fireEvent.click(title)
      
      expect(onObjectClick).toHaveBeenCalledWith('obj-1')
    })

    it('should not be clickable without callback', () => {
      const { container } = render(<SlideRenderer slide={mockSlide} />)
      
      const objects = container.querySelectorAll('[data-object-id]')
      objects.forEach(obj => {
        expect(obj).toHaveStyle({ cursor: 'default' })
      })
    })

    it('should highlight selected object', () => {
      const { container } = render(
        <SlideRenderer 
          slide={mockSlide} 
          selectedObjectId="obj-1"
          onObjectClick={jest.fn()}
        />
      )
      
      const selectedObject = container.querySelector('[data-object-id="obj-1"]')
      expect(selectedObject).toHaveStyle({
        border: '2px solid #1976d2',
      })
    })
  })

  describe('Presentation Mode', () => {
    it('should apply presentation mode styles', () => {
      const { container } = render(
        <SlideRenderer 
          slide={mockSlide} 
          isPresenting={true}
        />
      )
      
      const slideContainer = container.firstChild as HTMLElement
      expect(slideContainer).toHaveClass('presenting')
    })

    it('should disable interactions in presentation mode', () => {
      const onObjectClick = jest.fn()
      
      render(
        <SlideRenderer 
          slide={mockSlide} 
          isPresenting={true}
          onObjectClick={onObjectClick}
        />
      )
      
      const title = screen.getByText('Test Title')
      fireEvent.click(title)
      
      expect(onObjectClick).not.toHaveBeenCalled()
    })
  })

  describe('Object Types', () => {
    it('should render text objects correctly', () => {
      render(<SlideRenderer slide={mockSlide} />)
      
      const heading = screen.getByText('Test Title')
      expect(heading).toHaveStyle({
        fontSize: '48px',
        fontWeight: '700',
        color: 'rgb(0, 0, 0)',
      })
    })

    it('should render image objects', () => {
      const slideWithImage = {
        ...mockSlide,
        objects: [
          {
            id: 'img-1',
            type: 'image',
            source: 'https://example.com/image.jpg',
            alt: 'Test Image',
            coordinates: { x: 0, y: 0, width: 200, height: 200 },
            visible: true,
            locked: false,
          },
        ],
      }
      
      render(<SlideRenderer slide={slideWithImage} />)
      
      const image = screen.getByAltText('Test Image')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    it('should render shape objects', () => {
      const slideWithShape = {
        ...mockSlide,
        objects: [
          {
            id: 'shape-1',
            type: 'shape',
            shapeType: 'rectangle',
            coordinates: { x: 0, y: 0, width: 100, height: 100 },
            visible: true,
            locked: false,
            customStyles: {
              backgroundColor: '#ff0000',
              borderColor: '#000000',
              borderWidth: 2,
            },
          },
        ],
      }
      
      render(<SlideRenderer slide={slideWithShape} />)
      
      const shape = screen.getByTestId('shape-rectangle')
      expect(shape).toBeInTheDocument()
      expect(shape).toHaveStyle({
        backgroundColor: 'rgb(255, 0, 0)',
        borderColor: 'rgb(0, 0, 0)',
        borderWidth: '2px',
      })
    })
  })

  describe('Background Rendering', () => {
    it('should render solid background', () => {
      const { container } = render(<SlideRenderer slide={mockSlide} />)
      
      const slideContainer = container.firstChild as HTMLElement
      expect(slideContainer).toHaveStyle({
        backgroundColor: 'rgb(255, 255, 255)',
      })
    })

    it('should render gradient background', () => {
      const slideWithGradient = {
        ...mockSlide,
        background: {
          type: 'gradient',
          value: 'linear-gradient(180deg, #ff0000 0%, #0000ff 100%)',
        },
      }
      
      const { container } = render(<SlideRenderer slide={slideWithGradient} />)
      
      const slideContainer = container.firstChild as HTMLElement
      expect(slideContainer).toHaveStyle({
        background: 'linear-gradient(180deg, #ff0000 0%, #0000ff 100%)',
      })
    })

    it('should render image background', () => {
      const slideWithImageBg = {
        ...mockSlide,
        background: {
          type: 'image',
          value: 'https://example.com/bg.jpg',
        },
      }
      
      const { container } = render(<SlideRenderer slide={slideWithImageBg} />)
      
      const slideContainer = container.firstChild as HTMLElement
      expect(slideContainer).toHaveStyle({
        backgroundImage: 'url(https://example.com/bg.jpg)',
      })
    })
  })

  describe('Performance', () => {
    it('should handle large number of objects', () => {
      const manyObjects = Array.from({ length: 100 }, (_, i) => ({
        id: `obj-${i}`,
        type: 'text',
        role: 'body',
        content: `Object ${i}`,
        coordinates: {
          x: (i % 10) * 100,
          y: Math.floor(i / 10) * 50,
          width: 90,
          height: 40,
        },
        visible: true,
        locked: false,
      }))
      
      const slideWithManyObjects = {
        ...mockSlide,
        objects: manyObjects,
      }
      
      const { container } = render(<SlideRenderer slide={slideWithManyObjects} />)
      
      const objects = container.querySelectorAll('[data-object-id]')
      expect(objects).toHaveLength(100)
    })

    it('should update efficiently when slide changes', () => {
      const { rerender } = render(<SlideRenderer slide={mockSlide} />)
      
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      
      const updatedSlide = {
        ...mockSlide,
        objects: [
          {
            ...mockSlide.objects[0],
            content: 'Updated Title',
          },
          ...mockSlide.objects.slice(1),
        ],
      }
      
      rerender(<SlideRenderer slide={updatedSlide} />)
      
      expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
      expect(screen.getByText('Updated Title')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing coordinates gracefully', () => {
      const slideWithBadObject = {
        ...mockSlide,
        objects: [
          {
            id: 'bad-obj',
            type: 'text',
            content: 'Bad Object',
            coordinates: null as any,
            visible: true,
            locked: false,
          },
        ],
      }
      
      // Should not throw error
      expect(() => render(<SlideRenderer slide={slideWithBadObject} />)).not.toThrow()
    })

    it('should handle invalid object types', () => {
      const slideWithInvalidType = {
        ...mockSlide,
        objects: [
          {
            id: 'invalid',
            type: 'invalid-type' as any,
            content: 'Invalid',
            coordinates: { x: 0, y: 0, width: 100, height: 100 },
            visible: true,
            locked: false,
          },
        ],
      }
      
      // Should not throw error
      expect(() => render(<SlideRenderer slide={slideWithInvalidType} />)).not.toThrow()
    })
  })
})