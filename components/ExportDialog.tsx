import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  LinearProgress,
  Alert,
  Tab,
  Tabs,
  Paper,
  Slider,
  Stack,
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Slideshow as PowerPointIcon,
} from '@mui/icons-material';
import { Slide } from '@/lib/models/slide';
import { PDFExporter, PDFLayout, PDFExportOptions } from '@/lib/export/pdf-export';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  slides: Slide[];
  presentationTitle?: string;
}

type ExportFormat = 'powerpoint' | 'pdf';

export default function ExportDialog({
  open,
  onClose,
  slides,
  presentationTitle = 'Presentation',
}: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('powerpoint');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>('');
  
  // PDF Options
  const [pdfLayout, setPdfLayout] = useState<PDFLayout>('1-slide');
  const [includeNotes, setIncludeNotes] = useState(false);
  const [pdfQuality, setPdfQuality] = useState(0.8);

  const handleExport = async () => {
    setExporting(true);
    setError('');
    setProgress(0);

    try {
      if (exportFormat === 'powerpoint') {
        await exportPowerPoint();
      } else {
        await exportPDF();
      }
      
      // Close dialog after successful export
      setTimeout(() => {
        onClose();
        setExporting(false);
        setProgress(0);
      }, 1000);
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
      setExporting(false);
    }
  };

  const exportPowerPoint = async () => {
    try {
      setProgress(0.2);
      
      // Call the API endpoint
      const response = await fetch('/api/export/powerpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slides,
          presentationTitle,
        }),
      });
      
      setProgress(0.6);
      
      if (!response.ok) {
        throw new Error('Failed to export PowerPoint');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      setProgress(0.9);
      
      // Download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${presentationTitle}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setProgress(1);
    } catch (error) {
      console.error('PowerPoint export error:', error);
      throw error;
    }
  };

  const exportPDF = async () => {
    const options: PDFExportOptions = {
      layout: pdfLayout,
      includeNotes,
      quality: pdfQuality,
      filename: `${presentationTitle}.pdf`,
    };
    
    const exporter = new PDFExporter(options);
    
    // Render function for slides
    const renderSlide = async (slide: Slide, index: number): Promise<HTMLElement> => {
      const container = document.createElement('div');
      container.style.width = '1920px';
      container.style.height = '1080px';
      container.style.backgroundColor = '#ffffff';
      
      // Create a simple HTML representation of the slide
      // For now, we'll just render the slide content as HTML
      // In production, you'd want to properly render the slide
      container.innerHTML = `
        <div style="padding: 40px; font-family: Arial, sans-serif;">
          ${slide.objects.map(obj => {
            if (obj.type === 'text') {
              const textObj = obj as any;
              return `<div style="font-size: ${textObj.customStyles?.fontSize || 24}px">${textObj.content}</div>`;
            }
            if (obj.type === 'image') {
              const imgObj = obj as any;
              return `<img src="${imgObj.src}" alt="${imgObj.alt || ''}" style="max-width: 100%; height: auto;" />`;
            }
            return '';
          }).join('')}
        </div>
      `;
      
      return container;
    };
    
    // Export to PDF
    const blob = await exporter.export(slides, renderSlide, setProgress);
    
    // Download the PDF
    await PDFExporter.downloadPDF(blob, options.filename);
    setProgress(1);
  };

  const getLayoutPreview = (layout: PDFLayout) => {
    const configs = {
      '1-slide': { cols: 1, rows: 1, label: '1 per page' },
      '2-slides': { cols: 1, rows: 2, label: '2 per page' },
      '3-slides': { cols: 1, rows: 3, label: '3 per page' },
      '4-slides': { cols: 2, rows: 2, label: '4 per page' },
    };
    
    const config = configs[layout];
    const cells = [];
    
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        cells.push({ r, c });
      }
    }
    
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            display: 'inline-grid',
            gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
            gap: 0.5,
            p: 1,
            border: '2px solid',
            borderColor: pdfLayout === layout ? 'primary.main' : 'grey.300',
            borderRadius: 1,
            backgroundColor: pdfLayout === layout ? 'primary.light' : 'transparent',
            opacity: pdfLayout === layout ? 0.1 : 1,
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
            },
          }}
          onClick={() => setPdfLayout(layout)}
        >
          {cells.map((_, idx) => (
            <Box
              key={idx}
              sx={{
                width: 40,
                height: 23,
                backgroundColor: pdfLayout === layout ? 'primary.main' : 'grey.400',
                borderRadius: 0.5,
              }}
            />
          ))}
        </Box>
        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
          {config.label}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Export Presentation</DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={exportFormat} onChange={(_, v) => setExportFormat(v)}>
            <Tab
              icon={<PowerPointIcon />}
              label="PowerPoint"
              value="powerpoint"
              iconPosition="start"
            />
            <Tab
              icon={<PdfIcon />}
              label="PDF"
              value="pdf"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {exportFormat === 'powerpoint' && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Export your presentation as a PowerPoint file (.pptx) that can be edited in
              Microsoft PowerPoint, Google Slides, or other presentation software.
            </Alert>
            
            <Typography variant="body2" color="text.secondary">
              • All slides will be exported with their content
              <br />
              • Images and text will be editable
              <br />
              • Maintains 16:9 aspect ratio (1920x1080)
              <br />
              • File size: approximately {Math.round(slides.length * 0.5)}MB
            </Typography>
          </Box>
        )}

        {exportFormat === 'pdf' && (
          <Box>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Slides per page</FormLabel>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                {(['1-slide', '2-slides', '3-slides', '4-slides'] as PDFLayout[]).map((layout) => (
                  <Box key={layout} sx={{ flex: 1 }}>
                    {getLayoutPreview(layout)}
                  </Box>
                ))}
              </Stack>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                />
              }
              label="Include speaker notes"
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>
                Quality: {Math.round(pdfQuality * 100)}%
              </Typography>
              <Slider
                value={pdfQuality}
                onChange={(_, value) => setPdfQuality(value as number)}
                min={0.3}
                max={1}
                step={0.1}
                marks={[
                  { value: 0.3, label: 'Low' },
                  { value: 0.6, label: 'Medium' },
                  { value: 1, label: 'High' },
                ]}
              />
              <Typography variant="caption" color="text.secondary">
                Higher quality increases file size
              </Typography>
            </Box>

            <Alert severity="info">
              {pdfLayout === '1-slide' && 'Landscape orientation - one slide per page'}
              {pdfLayout === '2-slides' && 'Portrait orientation - two slides per page'}
              {pdfLayout === '3-slides' && 'Portrait orientation - three slides per page'}
              {pdfLayout === '4-slides' && 'Landscape orientation - 2x2 grid'}
            </Alert>
          </Box>
        )}

        {exporting && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Exporting... {Math.round(progress * 100)}%
            </Typography>
            <LinearProgress variant="determinate" value={progress * 100} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={exporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={exporting ? null : <DownloadIcon />}
          disabled={exporting || slides.length === 0}
        >
          {exporting ? 'Exporting...' : `Export as ${exportFormat === 'powerpoint' ? 'PowerPoint' : 'PDF'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}