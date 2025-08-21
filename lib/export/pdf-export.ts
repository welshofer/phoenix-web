import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Slide } from '@/lib/models/slide';

export type PDFLayout = '1-slide' | '2-slides' | '3-slides' | '4-slides';
export type PDFOrientation = 'landscape' | 'portrait';

export interface PDFExportOptions {
  layout: PDFLayout;
  includeNotes: boolean;
  quality: number; // 0.1 to 1
  filename?: string;
}

interface LayoutConfig {
  slidesPerPage: number;
  orientation: PDFOrientation;
  columns: number;
  rows: number;
}

const LAYOUT_CONFIGS: Record<PDFLayout, LayoutConfig> = {
  '1-slide': { slidesPerPage: 1, orientation: 'landscape', columns: 1, rows: 1 },
  '2-slides': { slidesPerPage: 2, orientation: 'portrait', columns: 1, rows: 2 },
  '3-slides': { slidesPerPage: 3, orientation: 'portrait', columns: 1, rows: 3 },
  '4-slides': { slidesPerPage: 4, orientation: 'landscape', columns: 2, rows: 2 },
};

export class PDFExporter {
  private pdf: jsPDF | null = null;
  private options: PDFExportOptions;
  private layoutConfig: LayoutConfig;

  constructor(options: PDFExportOptions) {
    this.options = {
      quality: 0.8,
      ...options,
    };
    this.layoutConfig = LAYOUT_CONFIGS[options.layout];
  }

  /**
   * Export slides to PDF
   */
  async export(
    slides: Slide[],
    renderSlide: (slide: Slide, index: number) => Promise<HTMLElement>,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    // Initialize PDF with correct orientation
    this.pdf = new jsPDF({
      orientation: this.layoutConfig.orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = this.pdf.internal.pageSize.getWidth();
    const pageHeight = this.pdf.internal.pageSize.getHeight();
    
    // Calculate slide dimensions based on layout
    const { slideWidth, slideHeight, positions } = this.calculateDimensions(
      pageWidth,
      pageHeight
    );

    let currentPage = 0;
    let slidesOnCurrentPage = 0;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      
      // Add new page if needed
      if (slidesOnCurrentPage === 0 && currentPage > 0) {
        this.pdf.addPage();
      }

      // Render slide to canvas
      const slideElement = await renderSlide(slide, i);
      const canvas = await this.slideToCanvas(slideElement);
      
      // Calculate position on page
      const positionIndex = slidesOnCurrentPage;
      const { x, y } = positions[positionIndex];
      
      // Add image to PDF
      const imgData = canvas.toDataURL('image/jpeg', this.options.quality);
      this.pdf.addImage(imgData, 'JPEG', x, y, slideWidth, slideHeight);
      
      // Add slide number
      this.addSlideNumber(x, y, slideWidth, slideHeight, i + 1);
      
      // Add speaker notes if requested
      if (this.options.includeNotes && slide.notes) {
        this.addSpeakerNotes(
          slide.notes,
          x,
          y + slideHeight,
          slideWidth,
          pageHeight - (y + slideHeight)
        );
      }
      
      // Update progress
      if (onProgress) {
        onProgress((i + 1) / slides.length);
      }
      
      // Check if we need a new page
      slidesOnCurrentPage++;
      if (slidesOnCurrentPage >= this.layoutConfig.slidesPerPage) {
        slidesOnCurrentPage = 0;
        currentPage++;
      }
    }

    // Return as blob
    return this.pdf.output('blob');
  }

  /**
   * Calculate dimensions and positions for slides based on layout
   */
  private calculateDimensions(pageWidth: number, pageHeight: number) {
    const { columns, rows } = this.layoutConfig;
    const margin = 10; // mm
    const spacing = 5; // mm between slides
    
    // Calculate available space
    const availableWidth = pageWidth - (margin * 2) - (spacing * (columns - 1));
    const availableHeight = pageHeight - (margin * 2) - (spacing * (rows - 1));
    
    // Calculate slide dimensions maintaining 16:9 aspect ratio
    let slideWidth = availableWidth / columns;
    let slideHeight = slideWidth * (9 / 16);
    
    // Check if height fits
    if (slideHeight * rows > availableHeight) {
      slideHeight = availableHeight / rows;
      slideWidth = slideHeight * (16 / 9);
    }
    
    // Reserve space for notes if needed
    if (this.options.includeNotes) {
      slideHeight = slideHeight * 0.7; // Use 70% for slide, 30% for notes
      slideWidth = slideHeight * (16 / 9);
    }
    
    // Calculate positions for each slide slot
    const positions: { x: number; y: number }[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = margin + (col * (slideWidth + spacing));
        const y = margin + (row * (slideHeight + spacing));
        positions.push({ x, y });
      }
    }
    
    return { slideWidth, slideHeight, positions };
  }

  /**
   * Convert slide element to canvas
   */
  private async slideToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
    // Set standard dimensions for rendering
    element.style.width = '1920px';
    element.style.height = '1080px';
    element.style.position = 'fixed';
    element.style.left = '-9999px';
    element.style.top = '0';
    
    document.body.appendChild(element);
    
    try {
      const canvas = await html2canvas(element, {
        width: 1920,
        height: 1080,
        scale: this.options.quality,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      return canvas;
    } finally {
      document.body.removeChild(element);
    }
  }

  /**
   * Add slide number to PDF
   */
  private addSlideNumber(x: number, y: number, width: number, height: number, slideNum: number) {
    if (!this.pdf) return;
    
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text(
      `${slideNum}`,
      x + width - 5,
      y + height - 2,
      { align: 'right' }
    );
  }

  /**
   * Add speaker notes to PDF
   */
  private addSpeakerNotes(notes: string, x: number, y: number, width: number, height: number) {
    if (!this.pdf || height < 10) return;
    
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(60, 60, 60);
    
    // Add "Notes:" label
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Notes:', x, y + 5);
    
    // Add notes text
    this.pdf.setFont('helvetica', 'normal');
    const lines = this.pdf.splitTextToSize(notes, width - 4);
    this.pdf.text(lines, x + 2, y + 10, {
      maxWidth: width - 4,
    });
  }

  /**
   * Download the PDF
   */
  static async downloadPDF(
    blob: Blob,
    filename: string = 'presentation.pdf'
  ): Promise<void> {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}