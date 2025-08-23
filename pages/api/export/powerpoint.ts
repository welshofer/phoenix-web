import { NextApiRequest, NextApiResponse } from 'next';
import { Slide, SlideObjectUnion, TextObject, ImageObject, ShapeObject, TableObject, ChartObject } from '@/lib/models/slide';
import { Coordinates } from '@/lib/models/coordinates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Dynamically import PptxGenJS to avoid SSR issues
    const PptxGenJS = (await import('pptxgenjs')).default;
    
    const { slides, presentationTitle = 'Presentation' } = req.body;
    
    if (!slides || !Array.isArray(slides)) {
      return res.status(400).json({ error: 'Invalid slides data' });
    }

    const pptx = new PptxGenJS();
    
    // Define custom layout with exact 1920x1080 dimensions
    // PowerPoint uses 96 DPI, so we need 20 inches x 11.25 inches for 1920x1080
    pptx.defineLayout({
      name: 'CUSTOM_1920x1080',
      width: 20,      // 1920 pixels / 96 DPI = 20 inches
      height: 11.25   // 1080 pixels / 96 DPI = 11.25 inches
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
      const sortedObjects = [...(slideData.objects || [])].sort(
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
    
    // Generate the PowerPoint file as base64
    const pptxBase64 = await pptx.write({ outputType: 'base64' });
    
    // Convert base64 to buffer
    const buffer = Buffer.from(pptxBase64, 'base64');
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${presentationTitle}.pptx"`);
    res.setHeader('Content-Length', buffer.length.toString());
    
    // Send the buffer
    res.status(200).send(buffer);
  } catch (error) {
    console.error('PowerPoint export error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    res.status(500).json({ 
      error: 'Failed to export PowerPoint',
      details: errorMessage 
    });
  }
}

// Scale factor to convert pixels to inches
// Our custom layout is 20" x 11.25" for 1920x1080 pixels
// This gives us 96 DPI which matches PowerPoint's internal resolution
const SCALE_FACTOR = 20 / 1920;  // 20 inches width / 1920 pixels = 96 DPI

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
  pptx: any,
  slide: any, 
  obj: SlideObjectUnion
): Promise<void> {
  try {
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
      default:
        console.warn(`Unsupported object type: ${(obj as any).type}`);
    }
  } catch (error) {
    console.error(`Error processing object ${obj.id}:`, error);
    // Continue processing other objects even if one fails
  }
}

function addTextObject(slide: any, textObj: TextObject): void {
  const position = convertCoordinates(textObj.coordinates);
  
  // Scale font size appropriately for PowerPoint
  // We're mapping 1920x1080 to 20x11.25 inches (96 DPI)
  // Standard PowerPoint uses 10x5.625 inches for 16:9, so we're 2x larger
  // Therefore, we need to scale up the font size by 2x
  const fontSize = (textObj.customStyles?.fontSize || 18) * 2;
  
  // Parse markdown-style bold formatting (**text**)
  const textContent = textObj.content;
  const boldPattern = /\*\*(.*?)\*\*/g;
  
  // Check if text contains markdown bold formatting
  if (boldPattern.test(textContent)) {
    // Create formatted text array for pptxgenjs
    const formattedText: any[] = [];
    let lastIndex = 0;
    
    // Reset regex state
    boldPattern.lastIndex = 0;
    
    let match;
    while ((match = boldPattern.exec(textContent)) !== null) {
      // Add text before the bold part (if any)
      if (match.index > lastIndex) {
        formattedText.push({
          text: textContent.substring(lastIndex, match.index),
          options: {
            fontSize: fontSize,
            bold: false,
            color: textObj.customStyles?.color?.replace('#', '') || '000000'
          }
        });
      }
      
      // Add the bold text (without asterisks)
      formattedText.push({
        text: match[1],
        options: {
          fontSize: fontSize,
          bold: true,
          color: textObj.customStyles?.color?.replace('#', '') || '000000'
        }
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text after the last bold part
    if (lastIndex < textContent.length) {
      formattedText.push({
        text: textContent.substring(lastIndex),
        options: {
          fontSize: fontSize,
          bold: false,
          color: textObj.customStyles?.color?.replace('#', '') || '000000'
        }
      });
    }
    
    const options: any = {
      ...position,
      align: textObj.customStyles?.textAlign || 'left',
      valign: 'top',
      margin: 0,
      wrap: true
    };
    
    slide.addText(formattedText, options);
  } else {
    // No markdown formatting, use simple text
    const options: any = {
      ...position,
      fontSize: fontSize,
      bold: (textObj.customStyles?.fontWeight || 400) >= 600,
      color: textObj.customStyles?.color?.replace('#', '') || '000000',
      align: textObj.customStyles?.textAlign || 'left',
      valign: 'top',
      margin: 0,
      wrap: true
    };
    
    slide.addText(textContent, options);
  }
}

async function addImageObject(slide: any, imageObj: ImageObject): Promise<void> {
  const position = convertCoordinates(imageObj.coordinates);
  
  // IMPORTANT: We need to maintain aspect ratio
  // The image should fit within the bounds but NOT stretch to fill
  // We'll calculate the proper dimensions based on 16:9 aspect ratio
  
  const targetAspectRatio = 16 / 9;
  const boxAspectRatio = position.w / position.h;
  
  let finalWidth = position.w;
  let finalHeight = position.h;
  let offsetX = 0;
  let offsetY = 0;
  
  if (boxAspectRatio > targetAspectRatio) {
    // Box is wider than image aspect ratio - fit by height
    finalWidth = position.h * targetAspectRatio;
    offsetX = (position.w - finalWidth) / 2; // Center horizontally
  } else if (boxAspectRatio < targetAspectRatio) {
    // Box is taller than image aspect ratio - fit by width
    finalHeight = position.w / targetAspectRatio;
    offsetY = (position.h - finalHeight) / 2; // Center vertically
  }
  // If equal, use the box dimensions as-is
  
  const options: any = {
    x: position.x + offsetX,
    y: position.y + offsetY,
    w: finalWidth,
    h: finalHeight,
    path: imageObj.src,
    altText: imageObj.alt || ''
  };

  try {
    slide.addImage(options);
  } catch (error) {
    console.error('Error adding image:', error);
    // If image fails, add a placeholder text
    slide.addText(`[Image: ${imageObj.alt || 'Image not available'}]`, {
      ...position,
      fontSize: 14,
      color: '666666',
      align: 'center',
      valign: 'middle'
    });
  }
}

function addShapeObject(pptx: any, slide: any, shapeObj: ShapeObject): void {
  const position = convertCoordinates(shapeObj.coordinates);
  
  // Map our shape types to pptxgenjs shape types
  let shapeType: any;
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

  const options: any = {
    ...position,
    fill: { color: shapeObj.fill?.replace('#', '') || 'FFFFFF' },
    line: shapeObj.stroke ? {
      color: shapeObj.stroke.replace('#', ''),
      width: shapeObj.strokeWidth || 1
    } : undefined
  };

  slide.addShape(shapeType, options);
}

function addTableObject(slide: any, tableObj: TableObject): void {
  const position = convertCoordinates(tableObj.coordinates);
  
  // Prepare table data
  const rows: any[] = [];
  
  // Add headers if present
  if (tableObj.headers && tableObj.headers.length > 0) {
    const headerRow: any[] = tableObj.headers.map(header => ({
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
    const dataRow: any[] = row.map(cell => ({
      text: String(cell),
      options: {
        fill: { color: tableObj.styles?.cellBackground?.replace('#', '') || 'FFFFFF' },
        color: tableObj.styles?.cellText?.replace('#', '') || '000000'
      }
    }));
    rows.push(dataRow);
  });

  if (rows.length === 0) {
    console.warn('Table has no data');
    return;
  }

  const tableOptions: any = {
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

function addChartObject(pptx: any, slide: any, chartObj: ChartObject): void {
  const position = convertCoordinates(chartObj.coordinates);
  
  // Map chart types
  let chartType: any;
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

  const chartData: any[] = [{
    name: 'Series 1',
    labels: chartObj.data.labels || [],
    values: chartObj.data.values || []
  }];

  const chartOptions: any = {
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