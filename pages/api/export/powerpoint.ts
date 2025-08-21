import { NextApiRequest, NextApiResponse } from 'next';
import PptxGenJS from 'pptxgenjs';
import { Slide, SlideObjectUnion, TextObject, ImageObject, ShapeObject, TableObject, ChartObject } from '@/lib/models/slide';
import { Coordinates } from '@/lib/models/coordinates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slides, presentationTitle = 'Presentation' } = req.body;
    
    if (!slides || !Array.isArray(slides)) {
      return res.status(400).json({ error: 'Invalid slides data' });
    }

    const pptx = new PptxGenJS();
    
    // Set slide size to 1920x1080 pixels (converted to inches)
    // PowerPoint uses inches, so we convert: 1920px / 96dpi = 20 inches, 1080px / 96dpi = 11.25 inches
    pptx.defineLayout({
      name: 'CUSTOM_1920x1080',
      width: 20,  // 1920 pixels at 96 DPI
      height: 11.25  // 1080 pixels at 96 DPI
    });
    pptx.layout = 'CUSTOM_1920x1080';
    
    // Process each slide
    for (const slideData of slides) {
      const slide = pptx.addSlide();
      
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
          await processSlideObject(pptx, slide, obj);
        }
      }
      
      // Add speaker notes if present
      if (slideData.notes) {
        slide.addNotes(slideData.notes);
      }
    }
    
    // Generate the PowerPoint file
    const pptxBuffer = await pptx.write({
      outputType: 'nodebuffer'
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${presentationTitle}.pptx"`);
    
    // Send the buffer
    res.send(Buffer.from(pptxBuffer as ArrayBuffer));
  } catch (error) {
    console.error('PowerPoint export error:', error);
    res.status(500).json({ error: 'Failed to export PowerPoint' });
  }
}

// Scale factor to convert pixels to inches (1920x1080 at 96 DPI)
const SCALE_FACTOR = 20 / 1920;  // 20 inches width / 1920 pixels

function pixelsToInches(pixels: number): number {
  return pixels * SCALE_FACTOR;
}

function convertCoordinates(coords: Coordinates): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  return {
    x: pixelsToInches(coords.x),
    y: pixelsToInches(coords.y),
    w: pixelsToInches(coords.width),
    h: pixelsToInches(coords.height)
  };
}

async function processSlideObject(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide, 
  obj: SlideObjectUnion
): Promise<void> {
  switch (obj.type) {
    case 'text':
      addTextObject(slide, obj as TextObject);
      break;
    case 'image':
      await addImageObject(slide, obj as ImageObject);
      break;
    case 'shape':
      addShapeObject(pptx, slide, obj as ShapeObject);
      break;
    case 'table':
      addTableObject(slide, obj as TableObject);
      break;
    case 'chart':
      addChartObject(pptx, slide, obj as ChartObject);
      break;
    case 'video':
      // Videos can't be directly embedded in PowerPoint via pptxgenjs
      console.warn('Video objects are not directly supported in PowerPoint export');
      break;
  }
}

function addTextObject(slide: PptxGenJS.Slide, textObj: TextObject): void {
  const position = convertCoordinates(textObj.coordinates);
  
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

async function addImageObject(slide: PptxGenJS.Slide, imageObj: ImageObject): Promise<void> {
  const position = convertCoordinates(imageObj.coordinates);
  
  const options: PptxGenJS.ImageProps = {
    ...position,
    path: imageObj.src,
    altText: imageObj.alt || '',
    sizing: {
      type: imageObj.fit === 'cover' ? 'cover' : 
            imageObj.fit === 'contain' ? 'contain' : 
            'crop',
      w: position.w,
      h: position.h
    }
  };

  slide.addImage(options);
}

function addShapeObject(pptx: PptxGenJS, slide: PptxGenJS.Slide, shapeObj: ShapeObject): void {
  const position = convertCoordinates(shapeObj.coordinates);
  
  // Map our shape types to pptxgenjs shape types
  let shapeType: PptxGenJS.ShapeType;
  switch (shapeObj.shape) {
    case 'rectangle':
      shapeType = pptx.ShapeType.rect;
      break;
    case 'circle':
      shapeType = pptx.ShapeType.ellipse;
      break;
    case 'triangle':
      shapeType = pptx.ShapeType.triangle;
      break;
    case 'arrow':
      shapeType = pptx.ShapeType.rightArrow;
      break;
    case 'line':
      shapeType = pptx.ShapeType.line;
      break;
    default:
      shapeType = pptx.ShapeType.rect;
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

function addTableObject(slide: PptxGenJS.Slide, tableObj: TableObject): void {
  const position = convertCoordinates(tableObj.coordinates);
  
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

function addChartObject(pptx: PptxGenJS, slide: PptxGenJS.Slide, chartObj: ChartObject): void {
  const position = convertCoordinates(chartObj.coordinates);
  
  // Map chart types
  let chartType: PptxGenJS.CHART_NAME;
  switch (chartObj.chartType) {
    case 'bar':
      chartType = pptx.ChartType.bar;
      break;
    case 'line':
      chartType = pptx.ChartType.line;
      break;
    case 'pie':
      chartType = pptx.ChartType.pie;
      break;
    case 'scatter':
      chartType = pptx.ChartType.scatter;
      break;
    case 'area':
      chartType = pptx.ChartType.area;
      break;
    default:
      chartType = pptx.ChartType.bar;
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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};