import { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { 
  PlayArrow as PlayIcon,
  Image as ImageIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import ImageGenerationProgress from '@/components/ImageGenerationProgress';
import { useRouter } from 'next/router';

export default function TestCompleteFlow() {
  const router = useRouter();
  const [topic, setTopic] = useState('Artificial Intelligence');
  const [slideCount, setSlideCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [presentationId, setPresentationId] = useState<string>('');
  const [presentationData, setPresentationData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  
  const steps = [
    { id: 'generate', label: 'Generate Presentation', status: 'pending' },
    { id: 'queue', label: 'Queue Images', status: 'pending' },
    { id: 'process', label: 'Process Images', status: 'pending' },
    { id: 'complete', label: 'View Result', status: 'pending' },
  ];
  
  const [currentSteps, setCurrentSteps] = useState(steps);
  
  const updateStep = (stepId: string, status: 'completed' | 'processing' | 'failed') => {
    setCurrentSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const testCompleteFlow = async () => {
    setLoading(true);
    setError('');
    setPresentationData(null);
    setPresentationId('');
    setCurrentSteps(steps);
    
    try {
      // Step 1: Generate presentation with AI
      updateStep('generate', 'processing');
      console.log('Step 1: Generating presentation...');
      
      const genResponse = await fetch('/api/ai/generate-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          slideCount,
          includeImages: true,
          imageStyle: 'photorealistic',
        }),
      });
      
      if (!genResponse.ok) {
        throw new Error('Failed to generate presentation');
      }
      
      const genData = await genResponse.json();
      console.log('Presentation generated:', genData);
      
      if (!genData.presentationId) {
        throw new Error('No presentation ID returned');
      }
      
      setPresentationId(genData.presentationId);
      setPresentationData(genData);
      updateStep('generate', 'completed');
      
      // Step 2: Queue images (should happen automatically)
      updateStep('queue', 'processing');
      console.log('Step 2: Images should be queued automatically...');
      
      // Wait a bit for queue to populate
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateStep('queue', 'completed');
      
      // Step 3: Process images
      updateStep('process', 'processing');
      console.log('Step 3: Processing images...');
      
      // Trigger image processing
      const processResponse = await fetch('/api/imagen/process-continuous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxJobs: 10 }),
      });
      
      if (!processResponse.ok) {
        console.error('Failed to trigger image processing');
      }
      
      // Wait for images to be generated (this would normally be handled by the ImageGenerationProgress component)
      console.log('Waiting for image generation to complete...');
      
      // Poll for completion (in real app, use real-time listeners)
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if images are ready (simplified check)
        const checkResponse = await fetch(`/api/presentations/${genData.presentationId}`);
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          
          // Check if any images are generated
          const hasImages = checkData.slides?.some((slide: any) => 
            slide.objects?.some((obj: any) => 
              obj.type === 'image' && obj.src && !obj.src.includes('placeholder')
            )
          );
          
          if (hasImages) {
            console.log('Images generated successfully!');
            setPresentationData(checkData);
            updateStep('process', 'completed');
            break;
          }
        }
        
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        console.warn('Image generation timed out');
        updateStep('process', 'failed');
      }
      
      // Step 4: Complete
      updateStep('complete', 'completed');
      console.log('Step 4: Flow complete!');
      
    } catch (err: any) {
      console.error('Flow test failed:', err);
      setError(err.message || 'Test failed');
      
      // Mark current step as failed
      const currentStep = currentSteps.find(s => s.status === 'processing');
      if (currentStep) {
        updateStep(currentStep.id, 'failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const viewPresentation = () => {
    if (presentationId) {
      router.push(`/presentations/${presentationId}/edit`);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'processing':
        return <LinearProgress sx={{ width: 20, height: 20 }} />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'grey.300' }} />;
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Complete Image Generation Flow Test
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="number"
              label="Slides"
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              disabled={loading}
              inputProps={{ min: 1, max: 20 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={testCompleteFlow}
              disabled={loading}
              startIcon={loading ? null : <PlayIcon />}
              sx={{ height: 56 }}
            >
              {loading ? 'Testing...' : 'Run Complete Test'}
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={viewPresentation}
              disabled={!presentationId || loading}
              startIcon={<ViewIcon />}
              sx={{ height: 56 }}
            >
              View in Editor
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Progress Steps */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Progress
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {currentSteps.map((step, index) => (
            <Box key={step.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getStepIcon(step.status)}
              <Typography 
                variant="body1" 
                color={step.status === 'processing' ? 'primary' : 'text.primary'}
                sx={{ 
                  fontWeight: step.status === 'processing' ? 'bold' : 'normal',
                  textDecoration: step.status === 'completed' ? 'line-through' : 'none',
                }}
              >
                Step {index + 1}: {step.label}
              </Typography>
              {step.status === 'completed' && (
                <Chip label="Done" size="small" color="success" />
              )}
              {step.status === 'failed' && (
                <Chip label="Failed" size="small" color="error" />
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Presentation Data */}
      {presentationData && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generated Presentation
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            ID: {presentationId}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Title: {presentationData.title || presentationData.presentation?.title || 'Untitled'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Slides: {presentationData.slides?.length || presentationData.presentation?.slides?.length || 0}
          </Typography>
          
          {/* Image Preview Grid */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {presentationData.slides?.map((slide: any, index: number) => {
              const imageObj = slide.objects?.find((obj: any) => obj.type === 'image');
              if (!imageObj) return null;
              
              return (
                <Grid item xs={12} sm={6} md={4} key={slide.id || index}>
                  <Card>
                    {imageObj.src && !imageObj.src.includes('placeholder') ? (
                      <CardMedia
                        component="img"
                        height="140"
                        image={imageObj.src}
                        alt={imageObj.alt || `Slide ${index + 1}`}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setSelectedImage(imageObj.src)}
                      />
                    ) : (
                      <Box 
                        sx={{ 
                          height: 140, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          bgcolor: 'grey.200',
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                      </Box>
                    )}
                    <CardContent>
                      <Typography variant="caption">
                        Slide {index + 1}
                      </Typography>
                      {imageObj.variants && (
                        <Chip 
                          label={`${imageObj.variants.length} variants`} 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}

      {/* Image Generation Progress Component */}
      {presentationId && (
        <ImageGenerationProgress
          presentationId={presentationId}
          onImagesReady={(slideImages) => {
            console.log('Images ready:', slideImages);
            // Refresh presentation data
            fetch(`/api/presentations/${presentationId}`)
              .then(res => res.json())
              .then(data => setPresentationData(data))
              .catch(console.error);
          }}
        />
      )}

      {/* Image Preview Dialog */}
      <Dialog 
        open={!!selectedImage} 
        onClose={() => setSelectedImage('')}
        maxWidth="lg"
      >
        <DialogTitle>Image Preview</DialogTitle>
        <DialogContent>
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Preview" 
              style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}