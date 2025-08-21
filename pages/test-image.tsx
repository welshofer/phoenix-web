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
import { IMAGE_STYLES, ImageStyle } from '@/lib/constants/image-styles';

export default function TestImagePage() {
  const [prompt, setPrompt] = useState('A modern office building with glass windows');
  const [style, setStyle] = useState<ImageStyle>('photorealistic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const response = await fetch('/api/ai/generate-images-simple', {
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

      setImageUrl(data.imageUrl);
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
        Test Image Generation
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
          {loading ? <CircularProgress size={24} /> : 'Generate Image'}
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
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