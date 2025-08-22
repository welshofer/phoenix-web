import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Typography,
  Chip,
  Stack,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  FormatQuote as SerifIcon,
  TextFields as SansIcon,
  Business as CorporateIcon,
  School as AcademicIcon,
  Brush as CreativeIcon,
  Code as TechIcon,
} from '@mui/icons-material';
import { typographySets } from '@/lib/typography/typography-sets';
import { TypographySet } from '@/lib/models/typography';

interface TypographySelectorProps {
  value: string;
  onChange: (typographySetId: string) => void;
  fullWidth?: boolean;
  showPreview?: boolean;
}

const categoryIcons: Record<string, React.ReactElement> = {
  serif: <SerifIcon fontSize="small" />,
  'sans-serif': <SansIcon fontSize="small" />,
  corporate: <CorporateIcon fontSize="small" />,
  academic: <AcademicIcon fontSize="small" />,
  creative: <CreativeIcon fontSize="small" />,
  tech: <TechIcon fontSize="small" />,
};

export const TypographySelector: React.FC<TypographySelectorProps> = ({
  value,
  onChange,
  fullWidth = true,
  showPreview = false,
}) => {
  const selectedSet = typographySets.find(set => set.id === value) || typographySets[0];

  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  const renderMenuItem = (set: TypographySet) => (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        {categoryIcons[set.category] || categoryIcons['sans-serif']}
        <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 500 }}>
          {set.name}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
        {set.description}
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, ml: 4 }}>
        {set.tags.slice(0, 3).map(tag => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            sx={{ height: 18, fontSize: '0.7rem' }}
          />
        ))}
      </Stack>
    </Box>
  );

  return (
    <Box>
      <FormControl fullWidth={fullWidth}>
        <InputLabel id="typography-selector-label">Typography Style</InputLabel>
        <Select
          labelId="typography-selector-label"
          id="typography-selector"
          value={value}
          label="Typography Style"
          onChange={handleChange}
        >
          {typographySets.map(set => (
            <MenuItem key={set.id} value={set.id}>
              {renderMenuItem(set)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {showPreview && selectedSet && (
        <Paper
          elevation={2}
          sx={{
            mt: 2,
            p: 3,
            backgroundColor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <Typography
            sx={{
              fontFamily: selectedSet.primaryFont.join(', '),
              fontSize: '2rem',
              fontWeight: selectedSet.roles.title.fontWeight,
              lineHeight: selectedSet.roles.title.lineHeight,
              letterSpacing: selectedSet.roles.title.letterSpacing,
              mb: 1,
            }}
          >
            {selectedSet.name}
          </Typography>
          <Typography
            sx={{
              fontFamily: selectedSet.secondaryFont.join(', '),
              fontSize: '1rem',
              color: 'text.secondary',
              lineHeight: 1.5,
            }}
          >
            {selectedSet.description}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Tooltip title="Primary font for headings">
              <Chip
                label={selectedSet.primaryFont[0]}
                icon={<SerifIcon />}
                variant="outlined"
                size="small"
              />
            </Tooltip>
            <Tooltip title="Secondary font for body text">
              <Chip
                label={selectedSet.secondaryFont[0]}
                icon={<SansIcon />}
                variant="outlined"
                size="small"
              />
            </Tooltip>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default TypographySelector;