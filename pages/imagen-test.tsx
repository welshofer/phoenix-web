import { useState } from 'react';
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
} from '@mui/material';

// Import only the constants, not any server-side code
const IMAGE_STYLES = {
  photorealistic: "Photorealistic",
  pencilSketch: "Pencil Sketch",
  watercolor: "Watercolor",
  digitalArt: "Digital Art",
  minimalist: "Minimalist",
  vintage: "Vintage",
  neonGlow: "Neon Glow",
  comicBook: "Comic Book",
  impressionist: "Impressionist",
  scribble: "Scribble",
};

export default function ImagenTestPage() {
  const [prompt, setPrompt] = useState('A modern office building with glass windows');
  const [style, setStyle] = useState('photorealistic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setImageUrl(null);
    setResult(null);

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
        throw new Error(data.error || 'Failed to generate image');
      }

      setResult(data);
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Imagen Test
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
            onChange={(e) => setStyle(e.target.value)}
          >
            {Object.entries(IMAGE_STYLES).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
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
          {loading ? <CircularProgress size={24} /> : 'Generate Image'}
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="body2" component="pre">
            {JSON.stringify(result, null, 2)}
          </Typography>
        </Paper>
      )}

      {imageUrl && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Generated Image
          </Typography>
          <Box
            component="img"
            src={imageUrl}
            alt="Generated"
            sx={{
              width: '100%',
              height: 'auto',
              borderRadius: 1,
            }}
          />
        </Paper>
      )}
    </Container>
  );
}