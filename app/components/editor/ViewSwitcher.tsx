import React from 'react';
import { ToggleButton, ToggleButtonGroup, Box } from '@mui/material';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GridViewIcon from '@mui/icons-material/GridView';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

export type ViewMode = 'outline' | 'grid' | 'detail';

interface ViewSwitcherProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ view, onChange }) => {
  const handleChange = (_: React.MouseEvent<HTMLElement>, newView: ViewMode | null) => {
    if (newView !== null) {
      onChange(newView);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={handleChange}
        aria-label="view mode"
        size="small"
      >
        <ToggleButton value="outline" aria-label="outline view">
          <FormatListBulletedIcon sx={{ mr: 1 }} />
          Outline
        </ToggleButton>
        <ToggleButton value="grid" aria-label="grid view">
          <GridViewIcon sx={{ mr: 1 }} />
          Grid
        </ToggleButton>
        <ToggleButton value="detail" aria-label="detail view">
          <FullscreenIcon sx={{ mr: 1 }} />
          Detail
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};