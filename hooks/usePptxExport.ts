import { useState, useCallback } from 'react';
import { PptxExporter } from '@/lib/export/pptx-export';
import { Presentation } from '@/lib/models/presentation';
import { Slide } from '@/lib/models/slide';

interface UsePptxExportOptions {
  onSuccess?: (filename: string) => void;
  onError?: (error: Error) => void;
}

interface UsePptxExportReturn {
  exportToPptx: (presentation: Presentation, slides: Slide[], filename?: string) => Promise<void>;
  isExporting: boolean;
  error: Error | null;
  progress: number; // 0-100
}

/**
 * Hook for exporting presentations to PowerPoint format
 * 
 * Features:
 * - Precise 1920x1080 to PowerPoint coordinate mapping
 * - Support for all slide object types (text, images, shapes, tables, charts)
 * - Progress tracking for large presentations
 * - Error handling and recovery
 */
export function usePptxExport(options?: UsePptxExportOptions): UsePptxExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const exportToPptx = useCallback(async (
    presentation: Presentation,
    slides: Slide[],
    filename?: string
  ) => {
    setIsExporting(true);
    setError(null);
    setProgress(0);

    try {
      const exporter = new PptxExporter();
      
      // Calculate progress increments
      const totalSteps = slides.length + 2; // slides + init + finalize
      let currentStep = 0;
      
      // Initialize
      setProgress((++currentStep / totalSteps) * 100);
      
      // Sort slides by order
      const sortedSlides = [...slides].sort((a, b) => a.order - b.order);
      
      // Export each slide with progress updates
      for (const slide of sortedSlides) {
        await exporter.exportSlide(slide);
        setProgress((++currentStep / totalSteps) * 100);
      }
      
      // Generate and save file
      const defaultFilename = filename || `${presentation.title.replace(/[^a-z0-9]/gi, '_')}.pptx`;
      await exporter.saveToFile(presentation, slides, defaultFilename);
      setProgress(100);
      
      // Success callback
      if (options?.onSuccess) {
        options.onSuccess(defaultFilename);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Export failed');
      setError(error);
      
      // Error callback
      if (options?.onError) {
        options.onError(error);
      }
      
      console.error('PowerPoint export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [options]);

  return {
    exportToPptx,
    isExporting,
    error,
    progress
  };
}

/**
 * Example usage in a component:
 * 
 * ```tsx
 * const ExportButton: React.FC = () => {
 *   const { exportToPptx, isExporting, progress } = usePptxExport({
 *     onSuccess: (filename) => {
 *       console.log(`Exported: ${filename}`);
 *     },
 *     onError: (error) => {
 *       console.error('Export failed:', error);
 *     }
 *   });
 * 
 *   const handleExport = async () => {
 *     await exportToPptx(presentation, slides);
 *   };
 * 
 *   return (
 *     <Button 
 *       onClick={handleExport} 
 *       disabled={isExporting}
 *     >
 *       {isExporting ? `Exporting... ${Math.round(progress)}%` : 'Export to PowerPoint'}
 *     </Button>
 *   );
 * };
 * ```
 */