import PptxGenJS from 'pptxgenjs';
import { Slide, SlideObjectUnion, TextObject, ImageObject, ShapeObject, TableObject, ChartObject } from '@/lib/models/slide';
import { Presentation } from '@/lib/models/presentation';
import { Coordinates } from '@/lib/models/coordinates';

/**
 * PowerPoint Export Service using pptxgenjs
 * 
 * Key Features:
 * 1. Exports slides in 16:9 aspect ratio (1920x1080)
 * 2. Uses built-in LAYOUT_16x9 for proper PowerPoint compatibility
 * 3. Maintains pixel-perfect positioning from web canvas
 * 
 * Coordinate Mapping:
 * - 1920 pixels → 10 inches width
 * - 1080 pixels → 5.625 inches height
 * - Conversion factor: 10/1920 = 0.00520833 inches per pixel
 * 
 * This ensures the PowerPoint slides maintain the correct 16:9
 * aspect ratio matching our 1920x1080 web presentation.
 */

export class PptxExporter {
  private pptx: PptxGenJS;
  private readonly SLIDE_WIDTH_INCHES = 10;  // Standard 16:9 width
  private readonly SLIDE_HEIGHT_INCHES = 5.625;  // Standard 16:9 height
  private readonly CANVAS_WIDTH = 1920;
  private readonly CANVAS_HEIGHT = 1080;
  
  // Scale factor to convert pixels to inches
  private readonly SCALE_FACTOR = this.SLIDE_WIDTH_INCHES / this.CANVAS_WIDTH;

  constructor() {
    this.pptx = new PptxGenJS();
    
    // Use the built-in 16:9 layout for proper aspect ratio
    this.pptx.layout = 'LAYOUT_16x9';
  }

  /**
   * Convert pixel coordinates to PowerPoint inches
   */
  private pixelsToInches(pixels: number): number {
    return pixels * this.SCALE_FACTOR;
  }

  /**
   * Convert our coordinate system to PowerPoint positioning
   */
  private convertCoordinates(coords: Coordinates): {
    x: number;
    y: number;
    w: number;
    h: number;
  } {
    return {
      x: this.pixelsToInches(coords.x),
      y: this.pixelsToInches(coords.y),
      w: this.pixelsToInches(coords.width),
      h: this.pixelsToInches(coords.height)
    };
  }

  /**
   * Add a text object to the slide
   */
  private addTextObject(slide: PptxGenJS.Slide, textObj: TextObject): void {
    const position = this.convertCoordinates(textObj.coordinates);
    
    const options: PptxGenJS.TextPropsOptions = {
      ...position,
      fontSize: textObj.customStyles?.fontSize || 18,
      bold: (textObj.customStyles?.fontWeight || 400) >= 600,
      color: textObj.customStyles?.color?.replace('#', '') || '000000',
      align: textObj.customStyles?.textAlign || 'left',
      valign: 'top',
      margin: 0,
      wrap: true
    };

    slide.addText(textObj.content, options);
  }

  /**
   * Add an image object to the slide
   */
  private async addImageObject(slide: PptxGenJS.Slide, imageObj: ImageObject): Promise<void> {
    const position = this.convertCoordinates(imageObj.coordinates);
    
    // For images, we should maintain aspect ratio
    // Use 'contain' to fit within bounds without distortion
    const options: PptxGenJS.ImageProps = {
      x: position.x,
      y: position.y,
      w: position.w,
      h: position.h,
      path: imageObj.src,
      altText: imageObj.alt || '',
      // Always use contain to prevent distortion
      // This ensures the image fits within the specified bounds
      // while maintaining its aspect ratio
      sizing: {
        type: 'contain',
        w: position.w,
        h: position.h
      }
    };

    slide.addImage(options);
  }

  /**
   * Add a shape object to the slide
   */
  private addShapeObject(slide: PptxGenJS.Slide, shapeObj: ShapeObject): void {
    const position = this.convertCoordinates(shapeObj.coordinates);
    
    // Map our shape types to pptxgenjs shape types
    let shapeType: PptxGenJS.ShapeType;
    switch (shapeObj.shape) {
      case 'rectangle':
        shapeType = this.pptx.ShapeType.rect;
        break;
      case 'circle':
        shapeType = this.pptx.ShapeType.ellipse;
        break;
      case 'triangle':
        shapeType = this.pptx.ShapeType.triangle;
        break;
      case 'arrow':
        shapeType = this.pptx.ShapeType.rightArrow;
        break;
      case 'line':
        shapeType = this.pptx.ShapeType.line;
        break;
      default:
        shapeType = this.pptx.ShapeType.rect;
    }

    const options: PptxGenJS.ShapeProps = {
      ...position,
      fill: { color: shapeObj.fill?.replace('#', '') || 'FFFFFF' },
      line: shapeObj.stroke ? {
        color: shapeObj.stroke.replace('#', ''),
        width: shapeObj.strokeWidth || 1
      } : undefined
    };

    slide.addShape(shapeType, options);
  }

  /**
   * Add a table object to the slide
   */
  private addTableObject(slide: PptxGenJS.Slide, tableObj: TableObject): void {
    const position = this.convertCoordinates(tableObj.coordinates);
    
    // Prepare table data
    const rows: PptxGenJS.TableRow[] = [];
    
    // Add headers if present
    if (tableObj.headers && tableObj.headers.length > 0) {
      const headerRow: PptxGenJS.TableCell[] = tableObj.headers.map(header => ({
        text: header,
        options: {
          bold: true,
          fill: { color: tableObj.styles?.headerBackground?.replace('#', '') || 'F0F0F0' },
          color: tableObj.styles?.headerText?.replace('#', '') || '000000'
        }
      }));
      rows.push(headerRow);
    }
    
    // Add data rows
    tableObj.data.forEach(row => {
      const dataRow: PptxGenJS.TableCell[] = row.map(cell => ({
        text: String(cell),
        options: {
          fill: { color: tableObj.styles?.cellBackground?.replace('#', '') || 'FFFFFF' },
          color: tableObj.styles?.cellText?.replace('#', '') || '000000'
        }
      }));
      rows.push(dataRow);
    });

    const tableOptions: PptxGenJS.TableProps = {
      ...position,
      border: tableObj.styles?.borderWidth ? {
        type: 'solid',
        pt: tableObj.styles.borderWidth,
        color: tableObj.styles?.borderColor?.replace('#', '') || 'CCCCCC'
      } : undefined,
      autoPage: false,
      colW: Array(rows[0]?.length || 1).fill(position.w / (rows[0]?.length || 1))
    };

    slide.addTable(rows, tableOptions);
  }

  /**
   * Add a chart object to the slide
   */
  private addChartObject(slide: PptxGenJS.Slide, chartObj: ChartObject): void {
    const position = this.convertCoordinates(chartObj.coordinates);
    
    // Map chart types
    let chartType: PptxGenJS.CHART_NAME;
    switch (chartObj.chartType) {
      case 'bar':
        chartType = this.pptx.ChartType.bar;
        break;
      case 'line':
        chartType = this.pptx.ChartType.line;
        break;
      case 'pie':
        chartType = this.pptx.ChartType.pie;
        break;
      case 'scatter':
        chartType = this.pptx.ChartType.scatter;
        break;
      case 'area':
        chartType = this.pptx.ChartType.area;
        break;
      default:
        chartType = this.pptx.ChartType.bar;
    }

    const chartData: PptxGenJS.IChartOpts[] = [{
      name: 'Series 1',
      labels: chartObj.data.labels || [],
      values: chartObj.data.values || []
    }];

    const chartOptions: PptxGenJS.IChartOpts = {
      ...position,
      chartColors: ['0088CC', 'FF6633', '99CC00', 'FF3366'],
      showLegend: true,
      showTitle: false,
      showValue: true
    };

    slide.addChart(chartType, chartData, chartOptions);
  }

  /**
   * Process a single slide object
   */
  private async processSlideObject(
    slide: PptxGenJS.Slide, 
    obj: SlideObjectUnion
  ): Promise<void> {
    switch (obj.type) {
      case 'text':
        this.addTextObject(slide, obj as TextObject);
        break;
      case 'image':
        await this.addImageObject(slide, obj as ImageObject);
        break;
      case 'shape':
        this.addShapeObject(slide, obj as ShapeObject);
        break;
      case 'table':
        this.addTableObject(slide, obj as TableObject);
        break;
      case 'chart':
        this.addChartObject(slide, obj as ChartObject);
        break;
      case 'video':
        // Videos can't be directly embedded in PowerPoint via pptxgenjs
        // We could add a placeholder image with a note
        console.warn('Video objects are not directly supported in PowerPoint export');
        break;
    }
  }

  /**
   * Export a single slide
   */
  public async exportSlide(slideData: Slide): Promise<void> {
    const slide = this.pptx.addSlide();
    
    // Set background if specified
    if (slideData.background) {
      if (slideData.background.type === 'color') {
        slide.background = { 
          color: slideData.background.value.replace('#', '') 
        };
      } else if (slideData.background.type === 'image') {
        slide.background = { 
          path: slideData.background.value 
        };
      }
    }
    
    // Sort objects by z-index to maintain layering
    const sortedObjects = [...slideData.objects].sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
    );
    
    // Process each object
    for (const obj of sortedObjects) {
      if (obj.visible !== false) {
        await this.processSlideObject(slide, obj);
      }
    }
    
    // Add speaker notes if present
    if (slideData.notes) {
      slide.addNotes(slideData.notes);
    }
  }

  /**
   * Export a complete presentation
   */
  public async exportPresentation(
    presentation: Presentation,
    slides: Slide[]
  ): Promise<Blob> {
    // Set presentation metadata
    this.pptx.title = presentation.title;
    this.pptx.author = presentation.createdBy;
    this.pptx.subject = presentation.description || '';
    this.pptx.company = 'Phoenix Web';
    
    // Sort slides by order
    const sortedSlides = [...slides].sort((a, b) => a.order - b.order);
    
    // Process each slide
    for (const slide of sortedSlides) {
      await this.exportSlide(slide);
    }
    
    // Generate the PowerPoint file
    const blob = await this.pptx.write({ outputType: 'blob' });
    return blob as Blob;
  }

  /**
   * Save presentation to blob (for use with exportSlide calls)
   */
  public async save(): Promise<Blob> {
    const blob = await this.pptx.write({ outputType: 'blob' });
    return blob as Blob;
  }

  /**
   * Save presentation to file
   */
  public async saveToFile(
    presentation: Presentation,
    slides: Slide[],
    filename?: string
  ): Promise<void> {
    const blob = await this.exportPresentation(presentation, slides);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${presentation.title}.pptx`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Example usage and testing
 */
export function createTestSlide(): Slide {
  const testSlide: Slide = {
    id: 'test-slide-1',
    type: 'content' as any,
    order: 0,
    objects: [
      // Title text at top
      {
        id: 'title',
        type: 'text',
        content: 'Test Slide with Precise Positioning',
        coordinates: { x: 100, y: 100, width: 1720, height: 150 },
        role: 'heading' as any,
        customStyles: {
          fontSize: 36,
          fontWeight: 700,
          color: '#333333',
          textAlign: 'center'
        }
      } as TextObject,
      
      // Subtitle
      {
        id: 'subtitle',
        type: 'text',
        content: 'Demonstrating 1920x1080 grid to PowerPoint mapping',
        coordinates: { x: 100, y: 280, width: 1720, height: 80 },
        role: 'body' as any,
        customStyles: {
          fontSize: 18,
          color: '#666666',
          textAlign: 'center'
        }
      } as TextObject,
      
      // Content box on left
      {
        id: 'left-box',
        type: 'shape',
        shape: 'rectangle',
        coordinates: { x: 100, y: 400, width: 850, height: 500 },
        fill: '#E3F2FD',
        stroke: '#1976D2',
        strokeWidth: 2
      } as ShapeObject,
      
      // Text in left box
      {
        id: 'left-text',
        type: 'text',
        content: 'Left Column\n\nThis text is positioned at:\n• X: 150px\n• Y: 450px\n• Width: 750px\n• Height: 400px',
        coordinates: { x: 150, y: 450, width: 750, height: 400 },
        role: 'body' as any,
        customStyles: {
          fontSize: 16,
          color: '#333333'
        }
      } as TextObject,
      
      // Content box on right
      {
        id: 'right-box',
        type: 'shape',
        shape: 'rectangle',
        coordinates: { x: 970, y: 400, width: 850, height: 500 },
        fill: '#FFF3E0',
        stroke: '#F57C00',
        strokeWidth: 2
      } as ShapeObject,
      
      // Text in right box
      {
        id: 'right-text',
        type: 'text',
        content: 'Right Column\n\nThis demonstrates:\n• Precise pixel positioning\n• Exact width/height control\n• Perfect grid alignment',
        coordinates: { x: 1020, y: 450, width: 750, height: 400 },
        role: 'body' as any,
        customStyles: {
          fontSize: 16,
          color: '#333333'
        }
      } as TextObject,
      
      // Footer
      {
        id: 'footer',
        type: 'text',
        content: 'Grid: 1920x1080 → PowerPoint: 1920x1080 pixels',
        coordinates: { x: 100, y: 950, width: 1720, height: 50 },
        role: 'caption' as any,
        customStyles: {
          fontSize: 12,
          color: '#999999',
          textAlign: 'center'
        }
      } as TextObject
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return testSlide;
}