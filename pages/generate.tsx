import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardActionArea,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  PlayArrow as GenerateIcon,
  Info as InfoIcon,
  Psychology as ToneIcon,
  Groups as AudienceIcon,
  Flag as GoalIcon,
  ViewCarousel as SlidesIcon,
  Image as ImageIcon,
  Palette as PaletteIcon,
  GridOn,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { IMAGE_STYLES, ImageStyle } from '@/lib/constants/image-styles';

interface GenerationParams {
  topic: string;
  slideCount: number;
  author: string;
  tone: 'professional' | 'casual' | 'academic' | 'creative' | 'persuasive';
  goal: 'inform' | 'persuade' | 'educate' | 'inspire' | 'entertain';
  audience: 'general' | 'executives' | 'technical' | 'students' | 'investors';
  style: 'modern' | 'minimal' | 'bold' | 'elegant';
  generateImages: 'now' | 'later' | 'none';
  imageStyle?: string;
}

export default function GeneratePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [params, setParams] = useState<GenerationParams>({
    topic: '',
    slideCount: 15,
    author: user?.displayName || 'Phoenix Presenter',
    tone: 'professional',
    goal: 'inform',
    audience: 'general',
    style: 'modern',
    generateImages: 'later',
    imageStyle: 'photorealistic',
  });

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showImageStyleDialog, setShowImageStyleDialog] = useState(false);

  const handleGenerate = async () => {
    if (!params.topic.trim()) {
      setError('Please enter a presentation topic');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get ID token for authentication
      const idToken = await user?.getIdToken();
      
      const response = await fetch('/api/full-presentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          userId: user?.uid || 'anonymous',
          idToken: idToken || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate presentation');
      }

      setSuccess(`Presentation generated successfully! ${data.metadata?.actualSlideCount || params.slideCount} slides created in ${data.metadata?.timing?.totalSeconds || '?'} seconds.`);
      
      // Save to Firestore
      if (data.presentation && user) {
        try {
          const { savePresentation } = await import('@/lib/firebase/presentations');
          
          const presentationId = await savePresentation({
            metadata: {
              title: data.presentation.title || 'Untitled Presentation',
              subtitle: data.presentation.subtitle,
              author: data.presentation.author || params.author,
              userId: user.uid,
              topic: params.topic,
              slideCount: data.metadata?.actualSlideCount || params.slideCount,
              tone: params.tone,
              goal: params.goal,
              audience: params.audience,
              style: params.style,
              isPublic: false,
            },
            sections: data.presentation.sections || [],
            slides: data.presentation.slides || [],
            settings: {
              theme: params.style,
              animations: true,
            },
          });
          
          console.log('Presentation saved with ID:', presentationId);
          
          // Queue image generation if requested
          if (params.generateImages === 'now' && params.imageStyle) {
            try {
              // Prepare image generation requests from slides
              const imageRequests = data.presentation.slides
                .filter((slide: any) => slide.content?.some((obj: any) => obj.type === 'image'))
                .map((slide: any) => {
                  const imageObj = slide.content.find((obj: any) => obj.type === 'image');
                  return {
                    slideId: slide.id,
                    description: imageObj?.description || `Image for ${slide.title || 'slide'}`,
                    style: params.imageStyle,
                    priority: 1, // Normal priority
                  };
                });
              
              if (imageRequests.length > 0) {
                // Queue the image generation
                const response = await fetch('/api/ai/generate-images', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    presentationId,
                    userId: user.uid,
                    images: imageRequests,
                  }),
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Queued', result.requestIds?.length || 0, 'images for generation');
                  setSuccess(`Presentation created! ${imageRequests.length} images are being generated in the background.`);
                } else {
                  console.error('Failed to queue image generation');
                }
              }
            } catch (error) {
              console.error('Error queueing image generation:', error);
              // Don't fail the whole operation if image generation fails
            }
          }
          
          // Redirect to editor
          setTimeout(() => {
            router.push(`/presentations/${presentationId}/edit`);
          }, 1500);
        } catch (error) {
          console.error('Error saving presentation:', error);
          // Fall back to localStorage
          localStorage.setItem('lastPresentation', JSON.stringify(data.presentation));
          setTimeout(() => {
            router.push('/presentations/view');
          }, 2000);
        }
      } else {
        // Fallback for anonymous users
        localStorage.setItem('lastPresentation', JSON.stringify(data.presentation));
        setTimeout(() => {
          router.push('/presentations/view');
        }, 2000);
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const popularTopics = [
    'Artificial Intelligence',
    'Climate Change',
    'Digital Transformation',
    'Mental Health',
    'Sustainable Business',
    'Future of Work',
    'Blockchain Technology',
    'Space Exploration',
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AIIcon fontSize="large" color="primary" />
          Generate Presentation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create professional presentations powered by AI in seconds
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Presentation Details
              </Typography>
              
              {/* Topic Input */}
              <TextField
                fullWidth
                label="Presentation Topic"
                placeholder="Enter your presentation topic..."
                value={params.topic}
                onChange={(e) => setParams({ ...params, topic: e.target.value })}
                margin="normal"
                variant="outlined"
                helperText="Be specific for better results (e.g., 'Impact of AI on Healthcare in 2025')"
                disabled={loading}
              />

              {/* Popular Topics */}
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Popular topics:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {popularTopics.map((topic) => (
                    <Chip
                      key={topic}
                      label={topic}
                      size="small"
                      onClick={() => setParams({ ...params, topic })}
                      variant={params.topic === topic ? 'filled' : 'outlined'}
                      color={params.topic === topic ? 'primary' : 'default'}
                      disabled={loading}
                    />
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Slide Count */}
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SlidesIcon fontSize="small" />
                  Number of Slides: <strong>{params.slideCount}</strong>
                </Typography>
                <Slider
                  value={params.slideCount}
                  onChange={(_, value) => setParams({ ...params, slideCount: value as number })}
                  min={5}
                  max={30}
                  step={1}
                  marks={[
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                    { value: 15, label: '15' },
                    { value: 20, label: '20' },
                    { value: 30, label: '30' },
                  ]}
                  disabled={loading}
                />
              </Box>

              {/* Primary Settings */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Tone</InputLabel>
                    <Select
                      value={params.tone}
                      label="Tone"
                      onChange={(e) => setParams({ ...params, tone: e.target.value as any })}
                      disabled={loading}
                      startAdornment={<ToneIcon sx={{ mr: 1, ml: -0.5 }} fontSize="small" />}
                    >
                      <MenuItem value="professional">Professional</MenuItem>
                      <MenuItem value="casual">Casual</MenuItem>
                      <MenuItem value="academic">Academic</MenuItem>
                      <MenuItem value="creative">Creative</MenuItem>
                      <MenuItem value="persuasive">Persuasive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Goal</InputLabel>
                    <Select
                      value={params.goal}
                      label="Goal"
                      onChange={(e) => setParams({ ...params, goal: e.target.value as any })}
                      disabled={loading}
                      startAdornment={<GoalIcon sx={{ mr: 1, ml: -0.5 }} fontSize="small" />}
                    >
                      <MenuItem value="inform">Inform</MenuItem>
                      <MenuItem value="persuade">Persuade</MenuItem>
                      <MenuItem value="educate">Educate</MenuItem>
                      <MenuItem value="inspire">Inspire</MenuItem>
                      <MenuItem value="entertain">Entertain</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Audience</InputLabel>
                    <Select
                      value={params.audience}
                      label="Audience"
                      onChange={(e) => setParams({ ...params, audience: e.target.value as any })}
                      disabled={loading}
                      startAdornment={<AudienceIcon sx={{ mr: 1, ml: -0.5 }} fontSize="small" />}
                    >
                      <MenuItem value="general">General</MenuItem>
                      <MenuItem value="executives">Executives</MenuItem>
                      <MenuItem value="technical">Technical</MenuItem>
                      <MenuItem value="students">Students</MenuItem>
                      <MenuItem value="investors">Investors</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Image Generation Options */}
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon fontSize="small" />
                  <strong>AI Image Generation</strong>
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>When to Generate Images</InputLabel>
                  <Select
                    value={params.generateImages}
                    label="When to Generate Images"
                    onChange={(e) => {
                      const value = e.target.value as 'now' | 'later' | 'none';
                      setParams({ ...params, generateImages: value });
                      if (value === 'now') {
                        setShowImageStyleDialog(true);
                      }
                    }}
                    disabled={loading}
                  >
                    <MenuItem value="now">
                      <Box>
                        <Typography variant="body2">Generate with presentation</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Images will start generating after presentation is ready
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="later">
                      <Box>
                        <Typography variant="body2">Generate later in editor</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Generate images when you're ready
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="none">
                      <Box>
                        <Typography variant="body2">No images</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Text-only presentation
                        </Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
                
                {params.generateImages === 'now' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      icon={<PaletteIcon />}
                      label={params.imageStyle ? 
                        params.imageStyle.replace(/([A-Z])/g, ' $1').trim() : 
                        'Select Style'}
                      onClick={() => setShowImageStyleDialog(true)}
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Click to choose art style for all images
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Advanced Settings */}
              <Box sx={{ mt: 3 }}>
                <Button
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  size="small"
                  sx={{ mb: 2 }}
                >
                  {advancedOpen ? 'Hide' : 'Show'} Advanced Settings
                </Button>
                
                {advancedOpen && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Author Name"
                        value={params.author}
                        onChange={(e) => setParams({ ...params, author: e.target.value })}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Visual Style</InputLabel>
                        <Select
                          value={params.style}
                          label="Visual Style"
                          onChange={(e) => setParams({ ...params, style: e.target.value as any })}
                          disabled={loading}
                        >
                          <MenuItem value="modern">Modern</MenuItem>
                          <MenuItem value="minimal">Minimal</MenuItem>
                          <MenuItem value="bold">Bold</MenuItem>
                          <MenuItem value="elegant">Elegant</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                )}
              </Box>

              {/* Generate Button */}
              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleGenerate}
                  disabled={loading || !params.topic.trim()}
                  startIcon={loading ? <CircularProgress size={20} /> : <GenerateIcon />}
                >
                  {loading ? 'Generating...' : 'Generate Presentation'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Side Panel - removed */}
      </Grid>

      {/* Style Selection Dialog */}
      <Dialog
        open={showImageStyleDialog}
        onClose={() => setShowImageStyleDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Choose Art Style for All Images
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select an art style that will be applied to all generated images in your presentation.
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(IMAGE_STYLES).map(([key, description]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: params.imageStyle === key ? 2 : 1,
                    borderColor: params.imageStyle === key ? 'primary.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.light',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => {
                      setParams({ ...params, imageStyle: key });
                      setShowImageStyleDialog(false);
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <GridOn fontSize="small" color="primary" />
                        <Typography variant="subtitle2" fontWeight="medium">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {description.substring(0, 100)}...
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImageStyleDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => setShowImageStyleDialog(false)}
            disabled={!params.imageStyle}
          >
            Confirm Style
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}