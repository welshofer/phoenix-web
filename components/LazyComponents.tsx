import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Lazy load heavy components with loading states
export const LazyPresentationEditor = dynamic(
  () => import('@/components/presentation/PresentationEditor').then(mod => mod.PresentationEditor),
  {
    loading: () => <div>Loading editor...</div>,
    ssr: false,
  }
);

export const LazySlideRenderer = dynamic(
  () => import('@/components/slides/SlideRenderer').then(mod => mod.SlideRenderer),
  {
    loading: () => <div>Loading slides...</div>,
    ssr: false,
  }
);

export const LazyImageGenerationPanel = dynamic(
  () => import('@/components/imagen/ImageGenerationPanel').then(mod => mod.ImageGenerationPanel),
  {
    loading: () => <div>Loading image generator...</div>,
    ssr: false,
  }
);

export const LazyDataGrid = dynamic(
  () => import('@mui/x-data-grid').then(mod => ({ default: mod.DataGrid })),
  {
    loading: () => <div>Loading table...</div>,
    ssr: false,
  }
) as ComponentType<any>;

export const LazyPowerPointExporter = dynamic(
  () => import('@/components/export/PowerPointExporter'),
  {
    loading: () => <div>Loading exporter...</div>,
    ssr: false,
  }
);

export const LazyPdfExporter = dynamic(
  () => import('@/components/export/PdfExporter'),
  {
    loading: () => <div>Loading PDF exporter...</div>,
    ssr: false,
  }
);

// Lazy load heavy libraries
export const lazyLoadPptxGenJs = () => import('pptxgenjs');
export const lazyLoadHtml2Canvas = () => import('html2canvas');
export const lazyLoadJsPdf = () => import('jspdf');