import { PptxExporter } from './pptx-export';
import { Slide, TextObject, ImageObject, ShapeObject, TableObject, ChartObject, SlideType } from '@/lib/models/slide';
import { Presentation } from '@/lib/models/presentation';

/**
 * Comprehensive test suite for PowerPoint export
 * Demonstrates all object types with precise positioning
 */

export class PptxExportTest {
  private exporter: PptxExporter;

  constructor() {
    this.exporter = new PptxExporter();
  }

  /**
   * Create a test slide showing grid alignment
   */
  createGridTestSlide(): Slide {
    const objects: any[] = [];
    
    // Add grid lines every 192 pixels (10% of width)
    for (let x = 0; x <= 1920; x += 192) {
      objects.push({
        id: `vline-${x}`,
        type: 'shape',
        shape: 'line',
        coordinates: { x, y: 0, width: 1, height: 1080 },
        stroke: x % 384 === 0 ? '#FF0000' : '#CCCCCC',
        strokeWidth: x % 384 === 0 ? 2 : 1,
        zIndex: 0
      } as ShapeObject);
    }
    
    // Add horizontal grid lines every 108 pixels (10% of height)
    for (let y = 0; y <= 1080; y += 108) {
      objects.push({
        id: `hline-${y}`,
        type: 'shape',
        shape: 'line',
        coordinates: { x: 0, y, width: 1920, height: 1 },
        stroke: y % 216 === 0 ? '#FF0000' : '#CCCCCC',
        strokeWidth: y % 216 === 0 ? 2 : 1,
        zIndex: 0
      } as ShapeObject);
    }
    
    // Add coordinate labels at corners
    const corners = [
      { x: 0, y: 0, label: '(0, 0)' },
      { x: 1920 - 200, y: 0, label: '(1920, 0)' },
      { x: 0, y: 1080 - 50, label: '(0, 1080)' },
      { x: 1920 - 200, y: 1080 - 50, label: '(1920, 1080)' }
    ];
    
    corners.forEach(corner => {
      objects.push({
        id: `label-${corner.x}-${corner.y}`,
        type: 'text',
        content: corner.label,
        coordinates: { x: corner.x, y: corner.y, width: 200, height: 50 },
        role: 'caption',
        customStyles: {
          fontSize: 14,
          fontWeight: 700,
          color: '#FF0000'
        },
        zIndex: 10
      } as TextObject);
    });
    
    // Add title
    objects.push({
      id: 'grid-title',
      type: 'text',
      content: 'Grid Mapping Test: 1920x1080 Canvas',
      coordinates: { x: 480, y: 500, width: 960, height: 80 },
      role: 'heading',
      customStyles: {
        fontSize: 32,
        fontWeight: 700,
        color: '#000000',
        textAlign: 'center'
      },
      zIndex: 10
    } as TextObject);
    
    return {
      id: 'grid-test',
      type: SlideType.CUSTOM,
      order: 0,
      objects,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Create a slide with all text positioning options
   */
  createTextPositioningSlide(): Slide {
    const objects: any[] = [
      // Title
      {
        id: 'title',
        type: 'text',
        content: 'Text Positioning Demonstration',
        coordinates: { x: 100, y: 50, width: 1720, height: 100 },
        role: 'heading',
        customStyles: {
          fontSize: 36,
          fontWeight: 700,
          color: '#2C3E50',
          textAlign: 'center'
        }
      } as TextObject,
      
      // Left aligned text
      {
        id: 'left-text',
        type: 'text',
        content: 'Left Aligned\nPosition: (100, 200)\nSize: 500x150',
        coordinates: { x: 100, y: 200, width: 500, height: 150 },
        role: 'body',
        customStyles: {
          fontSize: 18,
          color: '#34495E',
          textAlign: 'left'
        }
      } as TextObject,
      
      // Center aligned text
      {
        id: 'center-text',
        type: 'text',
        content: 'Center Aligned\nPosition: (710, 200)\nSize: 500x150',
        coordinates: { x: 710, y: 200, width: 500, height: 150 },
        role: 'body',
        customStyles: {
          fontSize: 18,
          color: '#16A085',
          textAlign: 'center'
        }
      } as TextObject,
      
      // Right aligned text
      {
        id: 'right-text',
        type: 'text',
        content: 'Right Aligned\nPosition: (1320, 200)\nSize: 500x150',
        coordinates: { x: 1320, y: 200, width: 500, height: 150 },
        role: 'body',
        customStyles: {
          fontSize: 18,
          color: '#8E44AD',
          textAlign: 'right'
        }
      } as TextObject,
      
      // Multiline text with wrapping
      {
        id: 'multiline-text',
        type: 'text',
        content: 'This is a longer text block that demonstrates text wrapping within a defined boundary. The text should automatically wrap to fit within the specified width and height. This is positioned at coordinates (100, 400) with a size of 800x200 pixels.',
        coordinates: { x: 100, y: 400, width: 800, height: 200 },
        role: 'body',
        customStyles: {
          fontSize: 16,
          color: '#2C3E50',
          textAlign: 'justify'
        }
      } as TextObject,
      
      // Small text blocks at precise positions
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `small-text-${i}`,
        type: 'text',
        content: `Box ${i + 1}`,
        coordinates: { 
          x: 1000 + (i % 3) * 200, 
          y: 400 + Math.floor(i / 3) * 100, 
          width: 150, 
          height: 80 
        },
        role: 'caption',
        customStyles: {
          fontSize: 14,
          color: '#E74C3C',
          textAlign: 'center'
        }
      } as TextObject))
    ];
    
    return {
      id: 'text-positioning',
      type: SlideType.CUSTOM,
      order: 1,
      objects,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Create a slide with shapes at specific positions
   */
  createShapePositioningSlide(): Slide {
    const objects: any[] = [
      // Title
      {
        id: 'title',
        type: 'text',
        content: 'Shape Positioning & Sizing',
        coordinates: { x: 100, y: 50, width: 1720, height: 80 },
        role: 'heading',
        customStyles: {
          fontSize: 32,
          fontWeight: 700,
          color: '#2C3E50',
          textAlign: 'center'
        }
      } as TextObject,
      
      // Rectangle
      {
        id: 'rect',
        type: 'shape',
        shape: 'rectangle',
        coordinates: { x: 100, y: 200, width: 300, height: 200 },
        fill: '#3498DB',
        stroke: '#2980B9',
        strokeWidth: 3
      } as ShapeObject,
      
      // Circle (using square dimensions for perfect circle)
      {
        id: 'circle',
        type: 'shape',
        shape: 'circle',
        coordinates: { x: 500, y: 200, width: 200, height: 200 },
        fill: '#E74C3C',
        stroke: '#C0392B',
        strokeWidth: 3
      } as ShapeObject,
      
      // Triangle
      {
        id: 'triangle',
        type: 'shape',
        shape: 'triangle',
        coordinates: { x: 800, y: 200, width: 200, height: 200 },
        fill: '#F39C12',
        stroke: '#E67E22',
        strokeWidth: 3
      } as ShapeObject,
      
      // Arrow
      {
        id: 'arrow',
        type: 'shape',
        shape: 'arrow',
        coordinates: { x: 1100, y: 250, width: 250, height: 100 },
        fill: '#27AE60',
        stroke: '#229954',
        strokeWidth: 3
      } as ShapeObject,
      
      // Line
      {
        id: 'line',
        type: 'shape',
        shape: 'line',
        coordinates: { x: 1450, y: 300, width: 300, height: 1 },
        stroke: '#8E44AD',
        strokeWidth: 5
      } as ShapeObject,
      
      // Overlapping shapes to show z-index
      {
        id: 'back-rect',
        type: 'shape',
        shape: 'rectangle',
        coordinates: { x: 200, y: 500, width: 400, height: 300 },
        fill: '#95A5A6',
        zIndex: 1
      } as ShapeObject,
      
      {
        id: 'middle-rect',
        type: 'shape',
        shape: 'rectangle',
        coordinates: { x: 350, y: 550, width: 400, height: 300 },
        fill: '#34495E',
        zIndex: 2
      } as ShapeObject,
      
      {
        id: 'front-rect',
        type: 'shape',
        shape: 'rectangle',
        coordinates: { x: 500, y: 600, width: 400, height: 300 },
        fill: '#2C3E50',
        zIndex: 3
      } as ShapeObject,
      
      // Labels for overlapping shapes
      {
        id: 'overlap-label',
        type: 'text',
        content: 'Z-Index Layering Demo',
        coordinates: { x: 200, y: 920, width: 700, height: 50 },
        role: 'caption',
        customStyles: {
          fontSize: 16,
          color: '#2C3E50',
          textAlign: 'center'
        },
        zIndex: 10
      } as TextObject
    ];
    
    return {
      id: 'shape-positioning',
      type: SlideType.CUSTOM,
      order: 2,
      objects,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Create a slide with a table
   */
  createTableSlide(): Slide {
    const tableData = [
      ['Product', 'Q1', 'Q2', 'Q3', 'Q4'],
      ['Product A', '100', '150', '200', '180'],
      ['Product B', '80', '90', '110', '120'],
      ['Product C', '60', '70', '85', '95'],
      ['Total', '240', '310', '395', '395']
    ];
    
    const objects: any[] = [
      {
        id: 'title',
        type: 'text',
        content: 'Table Positioning Example',
        coordinates: { x: 100, y: 50, width: 1720, height: 80 },
        role: 'heading',
        customStyles: {
          fontSize: 32,
          fontWeight: 700,
          color: '#2C3E50',
          textAlign: 'center'
        }
      } as TextObject,
      
      {
        id: 'table',
        type: 'table',
        coordinates: { x: 360, y: 200, width: 1200, height: 600 },
        headers: tableData[0],
        data: tableData.slice(1),
        styles: {
          headerBackground: '#3498DB',
          headerText: '#FFFFFF',
          cellBackground: '#ECF0F1',
          cellText: '#2C3E50',
          borderColor: '#95A5A6',
          borderWidth: 1
        }
      } as TableObject,
      
      {
        id: 'table-note',
        type: 'text',
        content: 'Table positioned at (360, 200) with size 1200x600',
        coordinates: { x: 360, y: 850, width: 1200, height: 50 },
        role: 'caption',
        customStyles: {
          fontSize: 14,
          color: '#7F8C8D',
          textAlign: 'center'
        }
      } as TextObject
    ];
    
    return {
      id: 'table-slide',
      type: SlideType.TABLE,
      order: 3,
      objects,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Create a slide with a chart
   */
  createChartSlide(): Slide {
    const objects: any[] = [
      {
        id: 'title',
        type: 'text',
        content: 'Chart Positioning Example',
        coordinates: { x: 100, y: 50, width: 1720, height: 80 },
        role: 'heading',
        customStyles: {
          fontSize: 32,
          fontWeight: 700,
          color: '#2C3E50',
          textAlign: 'center'
        }
      } as TextObject,
      
      {
        id: 'bar-chart',
        type: 'chart',
        chartType: 'bar',
        coordinates: { x: 100, y: 200, width: 800, height: 500 },
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          values: [10, 20, 15, 25, 30, 35]
        }
      } as ChartObject,
      
      {
        id: 'pie-chart',
        type: 'chart',
        chartType: 'pie',
        coordinates: { x: 1020, y: 200, width: 500, height: 500 },
        data: {
          labels: ['Category A', 'Category B', 'Category C', 'Category D'],
          values: [30, 25, 20, 25]
        }
      } as ChartObject,
      
      {
        id: 'chart-note',
        type: 'text',
        content: 'Bar Chart: (100, 200, 800x500) | Pie Chart: (1020, 200, 500x500)',
        coordinates: { x: 100, y: 750, width: 1720, height: 50 },
        role: 'caption',
        customStyles: {
          fontSize: 14,
          color: '#7F8C8D',
          textAlign: 'center'
        }
      } as TextObject
    ];
    
    return {
      id: 'chart-slide',
      type: SlideType.CHART,
      order: 4,
      objects,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Create a complex layout slide
   */
  createComplexLayoutSlide(): Slide {
    const objects: any[] = [
      // Background shape
      {
        id: 'bg-shape',
        type: 'shape',
        shape: 'rectangle',
        coordinates: { x: 0, y: 0, width: 1920, height: 150 },
        fill: '#2C3E50',
        zIndex: 0
      } as ShapeObject,
      
      // Title on colored background
      {
        id: 'title',
        type: 'text',
        content: 'Complex Layout with Precise Positioning',
        coordinates: { x: 100, y: 35, width: 1720, height: 80 },
        role: 'heading',
        customStyles: {
          fontSize: 36,
          fontWeight: 700,
          color: '#FFFFFF',
          textAlign: 'center'
        },
        zIndex: 1
      } as TextObject,
      
      // Three column layout
      // Column 1
      {
        id: 'col1-box',
        type: 'shape',
        shape: 'rectangle',
        coordinates: { x: 80, y: 200, width: 560, height: 700 },
        fill: '#E8F6F3',
        stroke: '#16A085',
        strokeWidth: 2,
        zIndex: 1
      } as ShapeObject,
      
      {
        id: 'col1-header',
        type: 'text',
        content: 'Column 1',
        coordinates: { x: 100, y: 220, width: 520, height: 60 },
        role: 'heading',
        customStyles: {
          fontSize: 24,
          fontWeight: 600,
          color: '#16A085',
          textAlign: 'center'
        },
        zIndex: 2
      } as TextObject,
      
      {
        id: 'col1-content',
        type: 'text',
        content: 'This column is positioned at:\n• X: 80px\n• Y: 200px\n• Width: 560px\n• Height: 700px\n\nPerfect alignment with grid system.',
        coordinates: { x: 100, y: 300, width: 520, height: 580 },
        role: 'body',
        customStyles: {
          fontSize: 16,
          color: '#2C3E50'
        },
        zIndex: 2
      } as TextObject,
      
      // Column 2
      {
        id: 'col2-box',
        type: 'shape',
        shape: 'rectangle',
        coordinates: { x: 680, y: 200, width: 560, height: 700 },
        fill: '#FEF9E7',
        stroke: '#F39C12',
        strokeWidth: 2,
        zIndex: 1
      } as ShapeObject,
      
      {
        id: 'col2-header',
        type: 'text',
        content: 'Column 2',
        coordinates: { x: 700, y: 220, width: 520, height: 60 },
        role: 'heading',
        customStyles: {
          fontSize: 24,
          fontWeight: 600,
          color: '#F39C12',
          textAlign: 'center'
        },
        zIndex: 2
      } as TextObject,
      
      {
        id: 'col2-table',
        type: 'table',
        coordinates: { x: 700, y: 300, width: 520, height: 300 },
        headers: ['Item', 'Value'],
        data: [
          ['Width', '560px'],
          ['Height', '700px'],
          ['X Position', '680px'],
          ['Y Position', '200px']
        ],
        styles: {
          headerBackground: '#F39C12',
          headerText: '#FFFFFF',
          cellBackground: '#FFFFFF',
          cellText: '#2C3E50'
        },
        zIndex: 2
      } as TableObject,
      
      // Column 3
      {
        id: 'col3-box',
        type: 'shape',
        shape: 'rectangle',
        coordinates: { x: 1280, y: 200, width: 560, height: 700 },
        fill: '#FADBD8',
        stroke: '#E74C3C',
        strokeWidth: 2,
        zIndex: 1
      } as ShapeObject,
      
      {
        id: 'col3-header',
        type: 'text',
        content: 'Column 3',
        coordinates: { x: 1300, y: 220, width: 520, height: 60 },
        role: 'heading',
        customStyles: {
          fontSize: 24,
          fontWeight: 600,
          color: '#E74C3C',
          textAlign: 'center'
        },
        zIndex: 2
      } as TextObject,
      
      {
        id: 'col3-shapes',
        type: 'shape',
        shape: 'circle',
        coordinates: { x: 1470, y: 350, width: 180, height: 180 },
        fill: '#E74C3C',
        zIndex: 2
      } as ShapeObject,
      
      {
        id: 'col3-shape-label',
        type: 'text',
        content: 'Centered\nCircle',
        coordinates: { x: 1470, y: 410, width: 180, height: 60 },
        role: 'caption',
        customStyles: {
          fontSize: 18,
          fontWeight: 600,
          color: '#FFFFFF',
          textAlign: 'center'
        },
        zIndex: 3
      } as TextObject,
      
      // Footer
      {
        id: 'footer',
        type: 'text',
        content: 'Three column layout with 80px margins and 40px gaps',
        coordinates: { x: 80, y: 950, width: 1760, height: 50 },
        role: 'caption',
        customStyles: {
          fontSize: 14,
          color: '#7F8C8D',
          textAlign: 'center'
        },
        zIndex: 10
      } as TextObject
    ];
    
    return {
      id: 'complex-layout',
      type: SlideType.CUSTOM,
      order: 5,
      objects,
      background: {
        type: 'color',
        value: '#FFFFFF'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Create test presentation
   */
  createTestPresentation(): Presentation {
    return {
      id: 'test-presentation',
      title: 'PowerPoint Export Test - 1920x1080 Grid Mapping',
      description: 'Comprehensive test of precise object positioning from web grid to PowerPoint',
      version: 1,
      isPublic: false,
      createdBy: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastOpenedAt: new Date(),
      slideCount: 6,
      thumbnailUrl: '',
      tags: ['test', 'pptx', 'export'],
      collaborators: [],
      settings: {
        autoSave: true,
        theme: 'light'
      }
    };
  }

  /**
   * Run the complete test
   */
  async runTest(): Promise<void> {
    const presentation = this.createTestPresentation();
    const slides = [
      this.createGridTestSlide(),
      this.createTextPositioningSlide(),
      this.createShapePositioningSlide(),
      this.createTableSlide(),
      this.createChartSlide(),
      this.createComplexLayoutSlide()
    ];
    
    try {
      await this.exporter.saveToFile(
        presentation,
        slides,
        'phoenix-web-pptx-export-test.pptx'
      );
      console.log('✅ PowerPoint export test completed successfully');
    } catch (error) {
      console.error('❌ PowerPoint export test failed:', error);
    }
  }
}

// Export for use in components
export const runPptxExportTest = () => {
  const test = new PptxExportTest();
  return test.runTest();
};