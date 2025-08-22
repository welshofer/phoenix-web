import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid2 as Grid,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Paper,
  Divider,
  SelectChangeEvent,
} from '@mui/material';
import { typographySets } from '@/lib/typography/typography-sets';
import { TypographySet, TypographicRole } from '@/lib/models/typography';
import { loadGoogleFonts, preconnectGoogleFonts, applyTypographyToElement } from '@/lib/typography/font-loader';

interface TypographyPreviewProps {
  onSelectTypography?: (typographySet: TypographySet) => void;
  selectedSetId?: string;
}

const sampleTexts: Record<TypographicRole, string> = {
  title: 'Impactful Presentation Title',
  subtitle: 'Engaging subtitle that provides context',
  sectionHeader: 'Section Header',
  heading1: 'Primary Heading',
  heading2: 'Secondary Heading',
  heading3: 'Tertiary Heading',
  body: 'This is body text that contains the main content of your presentation. It should be readable and comfortable for extended reading.',
  bodyLarge: 'Emphasized body text for important points',
  bodySmall: 'Smaller body text for additional details',
  bullet: '• Key point in your presentation',
  quote: '"Design is not just what it looks like. Design is how it works."',
  citation: '— Steve Jobs',
  caption: 'Figure 1: Image caption text',
  label: 'Category Label',
  footnote: '¹ Additional reference information',
  code: 'const example = "code snippet";',
  emphasis: 'Emphasized text within a paragraph',
  strong: 'Strong text for importance',
  pageNumber: 'Page 1 of 10',
  date: 'December 2024',
  footer: 'Footer information',
  header: 'Header information',
  watermark: 'DRAFT',
};

const rolesToPreview: TypographicRole[] = [
  'title',
  'subtitle',
  'sectionHeader',
  'heading1',
  'heading2',
  'heading3',
  'body',
  'bodyLarge',
  'bullet',
  'quote',
  'citation',
];

export const TypographyPreview: React.FC<TypographyPreviewProps> = ({
  onSelectTypography,
  selectedSetId = 'classic-professional',
}) => {
  const [selectedSet, setSelectedSet] = useState<TypographySet>(
    typographySets.find(set => set.id === selectedSetId) || typographySets[0]
  );
  const [previewScale, setPreviewScale] = useState<number>(0.5);

  useEffect(() => {
    preconnectGoogleFonts();
  }, []);

  useEffect(() => {
    loadGoogleFonts(selectedSet);
    
    const previewContainer = document.getElementById('typography-preview-container');
    if (previewContainer) {
      applyTypographyToElement(previewContainer, selectedSet);
    }
  }, [selectedSet]);

  const handleSetChange = (event: SelectChangeEvent<string>) => {
    const newSet = typographySets.find(set => set.id === event.target.value);
    if (newSet) {
      setSelectedSet(newSet);
      onSelectTypography?.(newSet);
    }
  };

  const handleScaleChange = (event: SelectChangeEvent<number>) => {
    setPreviewScale(event.target.value as number);
  };

  const getScaledStyle = (role: TypographicRole) => {
    const definition = selectedSet.roles[role];
    return {
      fontFamily: Array.isArray(definition.fontFamily)
        ? definition.fontFamily.join(', ')
        : definition.fontFamily,
      fontSize: `${definition.fontSize * previewScale}px`,
      fontWeight: definition.fontWeight,
      fontStyle: definition.fontStyle || 'normal',
      lineHeight: definition.lineHeight || 'normal',
      letterSpacing: typeof definition.letterSpacing === 'number'
        ? `${definition.letterSpacing}em`
        : definition.letterSpacing || 'normal',
      textTransform: definition.textTransform || 'none',
      textAlign: definition.textAlign || 'left',
      textDecoration: definition.textDecoration || 'none',
    };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                Typography Sets Preview
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Typography Set</InputLabel>
                    <Select
                      value={selectedSet.id}
                      onChange={handleSetChange}
                      label="Typography Set"
                    >
                      {typographySets.map(set => (
                        <MenuItem key={set.id} value={set.id}>
                          {set.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Preview Scale</InputLabel>
                    <Select
                      value={previewScale}
                      onChange={handleScaleChange}
                      label="Preview Scale"
                    >
                      <MenuItem value={0.3}>30%</MenuItem>
                      <MenuItem value={0.5}>50%</MenuItem>
                      <MenuItem value={0.75}>75%</MenuItem>
                      <MenuItem value={1}>100%</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedSet.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedSet.description}
                </Typography>
                
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  {selectedSet.tags?.map(tag => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Stack>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Primary Font:
                    </Typography>
                    <Typography variant="body2">
                      {Array.isArray(selectedSet.primaryFont)
                        ? selectedSet.primaryFont[0]
                        : selectedSet.primaryFont}
                    </Typography>
                  </Grid>
                  
                  {selectedSet.secondaryFont && (
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Secondary Font:
                      </Typography>
                      <Typography variant="body2">
                        {Array.isArray(selectedSet.secondaryFont)
                          ? selectedSet.secondaryFont[0]
                          : selectedSet.secondaryFont}
                      </Typography>
                    </Grid>
                  )}
                  
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Category:
                    </Typography>
                    <Typography variant="body2">
                      {selectedSet.category}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box id="typography-preview-container">
                <Typography variant="h6" gutterBottom>
                  Typography Samples
                </Typography>
                
                <Stack spacing={3}>
                  {rolesToPreview.map(role => (
                    <Paper key={role} elevation={1} sx={{ p: 2 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 1, display: 'block' }}
                      >
                        {role.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Typography>
                      <Box sx={getScaledStyle(role)}>
                        {sampleTexts[role]}
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Complete Slide Example
                </Typography>
                
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    bgcolor: 'grey.50',
                    aspectRatio: '16/9',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ textAlign: 'center', maxWidth: '80%' }}>
                    <Box sx={getScaledStyle('title')}>
                      {sampleTexts.title}
                    </Box>
                    <Box sx={{ ...getScaledStyle('subtitle'), mt: 2 }}>
                      {sampleTexts.subtitle}
                    </Box>
                  </Box>
                  
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 24,
                      ...getScaledStyle('pageNumber'),
                    }}
                  >
                    {sampleTexts.pageNumber}
                  </Box>
                </Paper>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    bgcolor: 'grey.50',
                    aspectRatio: '16/9',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={getScaledStyle('heading1')}>
                    {sampleTexts.heading1}
                  </Box>
                  
                  <Box sx={{ mt: 3 }}>
                    <Box sx={getScaledStyle('bullet')}>
                      • First important point about the topic
                    </Box>
                    <Box sx={getScaledStyle('bullet')}>
                      • Second key insight to consider
                    </Box>
                    <Box sx={getScaledStyle('bullet')}>
                      • Third crucial element to remember
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 'auto', pt: 4 }}>
                    <Box sx={getScaledStyle('body')}>
                      {sampleTexts.body}
                    </Box>
                  </Box>
                  
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 24,
                      ...getScaledStyle('pageNumber'),
                    }}
                  >
                    Page 2 of 10
                  </Box>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};