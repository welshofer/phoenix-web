import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import { IMAGE_STYLES, ImageStyle } from '@/lib/constants/image-styles';

export default function ImagenVariantsTestPage() {
  const [prompt, setPrompt] = useState('A modern office building with glass windows at sunset');
  const [style, setStyle] = useState<ImageStyle>('photorealistic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [heroIndex, setHeroIndex] = useState<number | null>(null);
  const [cycleMode, setCycleMode] = useState<'hero' | 'cycle'>('hero');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCycleIndex, setCurrentCycleIndex] = useState(0);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setImageUrls([]);
    setSelectedVariant(0);
    setHeroIndex(null);
    setIsPlaying(false);

    try {
      const response = await fetch('/api/imagen/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: prompt,
          style,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate images');
      }

      if (data.imageUrls && data.imageUrls.length > 0) {
        setImageUrls(data.imageUrls);
        setHeroIndex(0); // Default first image as hero
      } else if (data.imageUrl) {
        // Backward compatibility
        setImageUrls([data.imageUrl]);
        setHeroIndex(0);
      } else {
        throw new Error('No images generated');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setLoading(false);
    }
  };

  // Auto-cycle through images
  useEffect(() => {
    if (isPlaying && imageUrls.length > 1) {
      const timer = setInterval(() => {
        setCurrentCycleIndex((prev) => (prev + 1) % imageUrls.length);
      }, 2000); // Change image every 2 seconds
      return () => clearInterval(timer);
    }
  }, [isPlaying, imageUrls.length]);

  const handleVariantSelect = (index: number) => {
    setSelectedVariant(index);
    setCurrentCycleIndex(index);
  };

  const handleSetHero = (index: number) => {
    setHeroIndex(index);
    if (cycleMode === 'hero') {
      setSelectedVariant(index);
    }
  };

  const handleCycleModeChange = (_: any, newMode: 'hero' | 'cycle' | null) => {
    if (newMode) {
      setCycleMode(newMode);
      if (newMode === 'hero' && heroIndex !== null) {
        setSelectedVariant(heroIndex);
        setIsPlaying(false);
      }
    }
  };

  const displayIndex = cycleMode === 'cycle' && isPlaying ? currentCycleIndex : selectedVariant;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Image Generation with Variants
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Image Description"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          margin="normal"
          multiline
          rows={2}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Style</InputLabel>
          <Select
            value={style}
            label="Style"
            onChange={(e) => setStyle(e.target.value as ImageStyle)}
          >
            {Object.keys(IMAGE_STYLES).map((key) => (
              <MenuItem key={key} value={key}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={loading || !prompt}
          sx={{ mt: 2 }}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Generate Image Variants (up to 3)'}
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {imageUrls.length > 0 && (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">
                Display Mode:
              </Typography>
              <ToggleButtonGroup
                value={cycleMode}
                exclusive
                onChange={handleCycleModeChange}
                size="small"
              >
                <ToggleButton value="hero">
                  Hero Image
                </ToggleButton>
                <ToggleButton value="cycle">
                  Cycle All
                </ToggleButton>
              </ToggleButtonGroup>
              
              {cycleMode === 'cycle' && (
                <Button
                  variant="outlined"
                  startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  onClick={() => setIsPlaying(!isPlaying)}
                  size="small"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
              )}
              
              {heroIndex !== null && (
                <Chip 
                  label={`Hero: Variant ${heroIndex + 1}`}
                  color="primary"
                  icon={<StarIcon />}
                />
              )}
            </Stack>

            <Box sx={{ position: 'relative' }}>
              <Box
                component="img"
                src={imageUrls[displayIndex]}
                alt={`Generated variant ${displayIndex + 1}`}
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 1,
                  border: '2px solid',
                  borderColor: displayIndex === heroIndex ? 'primary.main' : 'divider',
                }}
              />
              
              <Stack 
                direction="row" 
                spacing={1} 
                sx={{ 
                  position: 'absolute', 
                  bottom: 16, 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  borderRadius: 2,
                  padding: 1,
                }}
              >
                <IconButton 
                  size="small"
                  onClick={() => handleVariantSelect((displayIndex - 1 + imageUrls.length) % imageUrls.length)}
                  sx={{ color: 'white' }}
                >
                  <ArrowBackIcon />
                </IconButton>
                
                {imageUrls.map((_, index) => (
                  <Button
                    key={index}
                    variant={displayIndex === index ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleVariantSelect(index)}
                    sx={{ 
                      minWidth: 40,
                      color: displayIndex === index ? 'white' : 'grey.300',
                      borderColor: 'grey.500',
                    }}
                  >
                    {index + 1}
                  </Button>
                ))}
                
                <IconButton 
                  size="small"
                  onClick={() => handleVariantSelect((displayIndex + 1) % imageUrls.length)}
                  sx={{ color: 'white' }}
                >
                  <ArrowForwardIcon />
                </IconButton>
              </Stack>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              All Variants ({imageUrls.length} generated)
            </Typography>
            <Grid container spacing={2}>
              {imageUrls.map((url, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={url}
                      alt={`Variant ${index + 1}`}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: index === heroIndex ? 'primary.main' : 
                                     index === selectedVariant ? 'secondary.main' : 'divider',
                        opacity: index === selectedVariant ? 1 : 0.8,
                        transition: 'all 0.3s',
                        '&:hover': {
                          opacity: 1,
                          transform: 'scale(1.02)',
                        },
                      }}
                      onClick={() => handleVariantSelect(index)}
                    />
                    
                    <Stack 
                      direction="row" 
                      spacing={1}
                      sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleSetHero(index)}
                        sx={{ 
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: index === heroIndex ? 'warning.main' : 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.7)',
                          }
                        }}
                      >
                        {index === heroIndex ? <StarIcon /> : <StarBorderIcon />}
                      </IconButton>
                    </Stack>
                    
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                      }}
                    >
                      Variant {index + 1}
                      {index === heroIndex && ' (Hero)'}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </>
      )}
    </Container>
  );
}