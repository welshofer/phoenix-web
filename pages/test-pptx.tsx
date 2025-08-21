import { useState } from 'react';
import { Box, Button, Typography, Paper, LinearProgress, Alert, Stack } from '@mui/material';
import { usePptxExport } from '@/hooks/usePptxExport';
import { runPptxExportTest } from '@/lib/export/pptx-test';
import { createTestSlide } from '@/lib/export/pptx-export';
import { Presentation } from '@/lib/models/presentation';

/**
 * Test page for PowerPoint export functionality
 * Demonstrates precise 1920x1080 grid to PowerPoint mapping
 */
export default function TestPptxPage() {
  const [exportStatus, setExportStatus] = useState<string>('');
  
  const { exportToPptx, isExporting, progress, error } = usePptxExport({
    onSuccess: (filename) => {
      setExportStatus(`✅ Successfully exported: ${filename}`);
    },
    onError: (error) => {
      setExportStatus(`❌ Export failed: ${error.message}`);
    }
  });

  const handleSimpleTest = async () => {
    setExportStatus('');
    
    // Create a simple test presentation
    const presentation: Presentation = {
      id: 'simple-test',
      title: 'Simple PowerPoint Export Test',
      description: 'Testing precise coordinate mapping',
      version: 1,
      isPublic: false,
      createdBy: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastOpenedAt: new Date(),
      slideCount: 1,
      thumbnailUrl: '',
      tags: ['test'],
      collaborators: [],
      settings: {
        autoSave: true,
        theme: 'light'
      }
    };
    
    const slides = [createTestSlide()];
    
    await exportToPptx(presentation, slides, 'simple-test.pptx');
  };

  const handleComprehensiveTest = async () => {
    setExportStatus('');
    try {
      await runPptxExportTest();
      setExportStatus('✅ Comprehensive test completed! Check your downloads.');
    } catch (error) {
      setExportStatus(`❌ Test failed: ${error}`);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h3" gutterBottom>
        PowerPoint Export Test
      </Typography>
      
      <Typography variant="body1" paragraph>
        This page demonstrates the PowerPoint export functionality with precise 1920x1080 grid mapping.
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Key Features
        </Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li><strong>Precise Positioning:</strong> Objects placed at exact x,y coordinates (1920x1080 canvas → 10" x 7.5" PowerPoint)</li>
            <li><strong>Exact Sizing:</strong> Width and height preserved with proper scaling (1px = 0.00520833 inches)</li>
            <li><strong>Object Support:</strong> Text, Images, Shapes, Tables, Charts</li>
            <li><strong>Z-Index Layering:</strong> Maintains proper object stacking order</li>
            <li><strong>Style Preservation:</strong> Font sizes, colors, alignments transferred accurately</li>
          </ul>
        </Typography>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Coordinate Mapping
        </Typography>
        <Typography variant="body2" component="div">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Web Canvas</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>PowerPoint</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>1920 x 1080 pixels</td>
                <td style={{ padding: '8px' }}>10" x 7.5"</td>
                <td style={{ padding: '8px' }}>Full slide</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>(960, 540)</td>
                <td style={{ padding: '8px' }}>(5", 3.75")</td>
                <td style={{ padding: '8px' }}>Center point</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>192px width</td>
                <td style={{ padding: '8px' }}>1" width</td>
                <td style={{ padding: '8px' }}>10% of slide width</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>108px height</td>
                <td style={{ padding: '8px' }}>0.75" height</td>
                <td style={{ padding: '8px' }}>10% of slide height</td>
              </tr>
            </tbody>
          </table>
        </Typography>
      </Paper>
      
      <Stack spacing={2} direction="row" sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={handleSimpleTest}
          disabled={isExporting}
        >
          Run Simple Test
        </Button>
        
        <Button 
          variant="contained" 
          color="secondary"
          onClick={handleComprehensiveTest}
          disabled={isExporting}
        >
          Run Comprehensive Test (6 slides)
        </Button>
      </Stack>
      
      {isExporting && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Exporting... {Math.round(progress)}%
          </Typography>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}
      
      {exportStatus && (
        <Alert severity={exportStatus.startsWith('✅') ? 'success' : 'error'}>
          {exportStatus}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error: {error.message}
        </Alert>
      )}
      
      <Paper elevation={2} sx={{ p: 3, mt: 4, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          Test Slides Include:
        </Typography>
        <Typography variant="body2" component="div">
          <ol>
            <li><strong>Grid Test:</strong> Visual grid showing coordinate system mapping</li>
            <li><strong>Text Positioning:</strong> Various text alignments and positions</li>
            <li><strong>Shape Positioning:</strong> Different shapes with precise placement</li>
            <li><strong>Table:</strong> Data table with custom styling</li>
            <li><strong>Charts:</strong> Bar and pie charts at specific positions</li>
            <li><strong>Complex Layout:</strong> Multi-column layout with overlapping elements</li>
          </ol>
        </Typography>
      </Paper>
    </Box>
  );
}