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
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  PlayArrow as GenerateIcon,
  Info as InfoIcon,
  Psychology as ToneIcon,
  Groups as AudienceIcon,
  Flag as GoalIcon,
  ViewCarousel as SlidesIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';

interface GenerationParams {
  topic: string;
  slideCount: number;
  author: string;
  tone: 'professional' | 'casual' | 'academic' | 'creative' | 'persuasive';
  goal: 'inform' | 'persuade' | 'educate' | 'inspire' | 'entertain';
  audience: 'general' | 'executives' | 'technical' | 'students' | 'investors';
  style: 'modern' | 'minimal' | 'bold' | 'elegant';
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
  });

  const [advancedOpen, setAdvancedOpen] = useState(false);

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
    </Container>
  );
}