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
import { PodcastFormat, availableVoices } from '@/lib/ai/podcast-voices';
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
  
  const languages = [
    { code: 'en', name: 'English', locale: 'en-US' },
    { code: 'es', name: 'Spanish', locale: 'es-ES' },
    { code: 'fr', name: 'French', locale: 'fr-FR' },
    { code: 'de', name: 'German', locale: 'de-DE' },
    { code: 'it', name: 'Italian', locale: 'it-IT' },
    { code: 'pt', name: 'Portuguese (Brazil)', locale: 'pt-BR' },
    { code: 'nl', name: 'Dutch', locale: 'nl-NL' },
    { code: 'ja', name: 'Japanese', locale: 'ja-JP' },
    { code: 'ko', name: 'Korean', locale: 'ko-KR' },
    { code: 'ru', name: 'Russian', locale: 'ru-RU' },
    { code: 'zh', name: 'Chinese (Mandarin)', locale: 'zh-CN' },
    { code: 'ar', name: 'Arabic', locale: 'ar-XA' },
    { code: 'hi', name: 'Hindi', locale: 'hi-IN' },
    { code: 'bn', name: 'Bengali', locale: 'bn-IN' },
    { code: 'id', name: 'Indonesian', locale: 'id-ID' },
    { code: 'th', name: 'Thai', locale: 'th-TH' },
    { code: 'vi', name: 'Vietnamese', locale: 'vi-VN' },
    { code: 'tr', name: 'Turkish', locale: 'tr-TR' },
    { code: 'pl', name: 'Polish', locale: 'pl-PL' },
    { code: 'sv', name: 'Swedish', locale: 'sv-SE' },
    { code: 'da', name: 'Danish', locale: 'da-DK' },
    { code: 'no', name: 'Norwegian', locale: 'nb-NO' },
    { code: 'fi', name: 'Finnish', locale: 'fi-FI' },
  ];

  const [format, setFormat] = useState<PodcastFormat>('conversation');
  const [duration, setDuration] = useState(10);
  const [language, setLanguage] = useState('en');
  
  // Get current locale from selected language
  const currentLocale = languages.find(l => l.code === language)?.locale || 'en-US';
  
  // Get available voices for current language (default to en-US if not available)
  const currentVoices = availableVoices[currentLocale as keyof typeof availableVoices] || availableVoices['en-US'];
  
  // Set default voices based on current language
  // If only one voice available, use it for both speakers
  const [voice1, setVoice1] = useState(currentVoices?.[0]?.id || 'en-US-Chirp3-HD-Charon');
  const [voice2, setVoice2] = useState(currentVoices?.[1]?.id || currentVoices?.[0]?.id || 'en-US-Chirp3-HD-Kore');

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
          voice1,
          voice2,
          language
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate podcast script');
      }

      setScript(data.script);
      
      // Only generate audio if we actually have a script
      if (!data.script || data.script.trim().length === 0) {
        console.error('No script returned from generation');
        setError('Failed to generate podcast script content');
        return;
      }
      
      // Automatically generate audio after script
      setAudioLoading(true);
      try {
        const audioResponse = await fetch('/api/podcast/generate-audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script: data.script,
            language,
            voice1,
            voice2,
            speakingRate: 1.0,
            pitch: 0.0
          }),
        });

        if (!audioResponse.ok) {
          const errorData = await audioResponse.json();
          
          // If Google Cloud TTS is not configured, try browser TTS
          if (errorData.fallback === 'browser-tts' && isBrowserTTSAvailable()) {
            const audioBlob = await generateBrowserAudio(data.script, {
              language,
              voice1Gender: 'female',
              voice2Gender: 'male',
              rate: 1.0,
              pitch: 1.0
            });
            
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            
            // Download the audio automatically
            const a = document.createElement('a');
            a.href = url;
            a.download = `${presentationTitle.replace(/[^a-z0-9]/gi, '_')}_podcast.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
          }
          
          throw new Error(errorData.error || 'Failed to generate audio');
        }

        const audioBlob = await audioResponse.blob();
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Automatically download the audio
        const a = document.createElement('a');
        a.href = url;
        a.download = `${presentationTitle.replace(/[^a-z0-9]/gi, '_')}_podcast.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (audioErr) {
        console.error('Audio generation error:', audioErr);
        // Don't overwrite the script generation success
        // Just log the audio error
      } finally {
        setAudioLoading(false);
      }
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
          voice1,
          voice2,
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
            voice1Gender: 'female', // fallback to gender for browser TTS
            voice2Gender: 'male',
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
                  onChange={(e) => {
                    const newLanguage = e.target.value;
                    setLanguage(newLanguage);
                    // Update voices when language changes
                    const newLocale = languages.find(l => l.code === newLanguage)?.locale || 'en-US';
                    const newVoices = availableVoices[newLocale as keyof typeof availableVoices] || availableVoices['en-US'];
                    if (newVoices && newVoices.length > 0) {
                      setVoice1(newVoices[0].id);
                      setVoice2(newVoices[1]?.id || newVoices[0].id);
                    }
                  }}
                >
                  {languages.map(lang => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {currentVoices && currentVoices.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Speaker 1 Voice</InputLabel>
                      <Select
                        value={voice1}
                        onChange={(e) => setVoice1(e.target.value)}
                        label="Speaker 1 Voice"
                      >
                        {currentVoices?.map((voice) => (
                          <MenuItem key={voice.id} value={voice.id}>
                            {voice.name} ({voice.gender}, {voice.type})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Speaker 2 Voice</InputLabel>
                      <Select
                        value={voice2}
                        onChange={(e) => setVoice2(e.target.value)}
                        label="Speaker 2 Voice"
                      >
                        {currentVoices?.map((voice) => (
                          <MenuItem key={voice.id} value={voice.id}>
                            {voice.name} ({voice.gender}, {voice.type})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
              ) : (
                <Alert severity="warning">
                  No Chirp voices available for this language.
                </Alert>
              )}

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