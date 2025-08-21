import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Slider,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  IconButton,
  Snackbar
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MicIcon from '@mui/icons-material/Mic';
import { PodcastFormat } from '@/lib/ai/podcast-generator';
import Tooltip from '@mui/material/Tooltip';
import { isBrowserTTSAvailable, generateBrowserAudio } from '@/lib/ai/browser-tts';

interface PodcastExportDialogProps {
  open: boolean;
  onClose: () => void;
  presentationId: string;
  presentationTitle: string;
}

const PodcastExportDialog: React.FC<PodcastExportDialogProps> = ({
  open,
  onClose,
  presentationId,
  presentationTitle
}) => {
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<string | null>(null);
  const [showCopySnackbar, setShowCopySnackbar] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const [format, setFormat] = useState<PodcastFormat>('conversation');
  const [duration, setDuration] = useState(10);
  const [voice1Gender, setVoice1Gender] = useState<'male' | 'female'>('female');
  const [voice2Gender, setVoice2Gender] = useState<'male' | 'female'>('male');
  const [language, setLanguage] = useState('en');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'nl', name: 'Dutch' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ];

  const formatDescriptions = {
    conversation: 'Two hosts having a casual discussion about the presentation',
    interview: 'Professional interview with an expert guest',
    educational: 'Teacher-student format with questions and explanations',
    debate: 'Friendly debate with different perspectives'
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setScript(null);

    try {
      const response = await fetch('/api/podcast/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentationId,
          format,
          duration,
          voice1Gender,
          voice2Gender,
          language
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate podcast script');
      }

      setScript(data.script);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyScript = () => {
    if (script) {
      navigator.clipboard.writeText(script);
      setShowCopySnackbar(true);
    }
  };

  const handleDownloadScript = () => {
    if (script) {
      const blob = new Blob([script], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${presentationTitle.replace(/[^a-z0-9]/gi, '_')}_podcast_script.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setScript(null);
    setError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const handleGenerateAudio = async () => {
    if (!script) return;

    setAudioLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/podcast/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script,
          language,
          voice1Gender,
          voice2Gender,
          speakingRate: 1.0,
          pitch: 0.0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // If Google Cloud TTS is not configured, try browser TTS
        if (errorData.fallback === 'browser-tts' && isBrowserTTSAvailable()) {
          const audioBlob = await generateBrowserAudio(script, {
            language,
            voice1Gender,
            voice2Gender,
            rate: 1.0,
            pitch: 1.0
          });
          
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          // Show info that browser TTS was used
          setError('Using browser Text-to-Speech (limited features). For full audio generation, configure Google Cloud TTS.');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Automatically download the audio
      const a = document.createElement('a');
      a.href = url;
      a.download = `${presentationTitle.replace(/[^a-z0-9]/gi, '_')}_podcast.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Export as Podcast
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Transform "{presentationTitle}" into an engaging audio podcast
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          {!script ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Podcast Format</InputLabel>
                <Select
                  value={format}
                  label="Podcast Format"
                  onChange={(e) => setFormat(e.target.value as PodcastFormat)}
                >
                  {Object.entries(formatDescriptions).map(([key, desc]) => (
                    <MenuItem key={key} value={key}>
                      <Box>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                          {key}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {desc}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography gutterBottom>Duration: {duration} minutes</Typography>
                <Slider
                  value={duration}
                  onChange={(_, value) => setDuration(value as number)}
                  min={5}
                  max={30}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={language}
                  label="Language"
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {languages.map(lang => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 3 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Speaker 1 Voice</FormLabel>
                  <RadioGroup
                    value={voice1Gender}
                    onChange={(e) => setVoice1Gender(e.target.value as 'male' | 'female')}
                    row
                  >
                    <FormControlLabel value="female" control={<Radio />} label="Female" />
                    <FormControlLabel value="male" control={<Radio />} label="Male" />
                  </RadioGroup>
                </FormControl>

                <FormControl component="fieldset">
                  <FormLabel component="legend">Speaker 2 Voice</FormLabel>
                  <RadioGroup
                    value={voice2Gender}
                    onChange={(e) => setVoice2Gender(e.target.value as 'male' | 'female')}
                    row
                  >
                    <FormControlLabel value="female" control={<Radio />} label="Female" />
                    <FormControlLabel value="male" control={<Radio />} label="Male" />
                  </RadioGroup>
                </FormControl>
              </Box>

              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Generated Script</Typography>
                <Box>
                  <IconButton onClick={handleCopyScript} title="Copy to clipboard">
                    <ContentCopyIcon />
                  </IconButton>
                  <IconButton onClick={handleDownloadScript} title="Download script">
                    <DownloadIcon />
                  </IconButton>
                  <Tooltip title="Generate Audio (MP3)">
                    <IconButton 
                      onClick={handleGenerateAudio} 
                      disabled={audioLoading}
                      color="primary"
                    >
                      {audioLoading ? <CircularProgress size={24} /> : <MicIcon />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  maxHeight: 400, 
                  overflow: 'auto',
                  backgroundColor: 'grey.50',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {script}
              </Paper>
              
              {audioUrl && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="success" icon={<VolumeUpIcon />}>
                    Audio generated successfully! The file has been downloaded.
                  </Alert>
                </Box>
              )}
              
              {audioLoading && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={24} />
                  <Typography>Generating audio... This may take a few moments.</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          {!script ? (
            <>
              <Button onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleGenerate} 
                variant="contained" 
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Generating...' : 'Generate Script'}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleReset}>Generate New</Button>
              <Button onClick={onClose} variant="contained">Done</Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showCopySnackbar}
        autoHideDuration={3000}
        onClose={() => setShowCopySnackbar(false)}
        message="Script copied to clipboard"
      />
    </>
  );
};

export default PodcastExportDialog;