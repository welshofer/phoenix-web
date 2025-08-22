import React, { useState } from 'react';
import { NextPage } from 'next';
import { Container, Typography, Box, Alert, AlertTitle } from '@mui/material';
import { TypographyPreview } from '@/components/TypographyPreview';
import { TypographySet } from '@/lib/models/typography';

const TypographyDemoPage: NextPage = () => {
  const [selectedTypography, setSelectedTypography] = useState<TypographySet | null>(null);

  const handleTypographySelect = (typographySet: TypographySet) => {
    setSelectedTypography(typographySet);
    console.log('Selected typography:', typographySet);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Typography Sets Demo
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>10 Typography Sets Available</AlertTitle>
          Each set combines carefully selected serif and sans-serif fonts optimized for presentations.
          All fonts are loaded from Google Fonts for easy deployment.
        </Alert>

        {selectedTypography && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Currently selected: <strong>{selectedTypography.name}</strong>
          </Alert>
        )}

        <TypographyPreview
          onSelectTypography={handleTypographySelect}
          selectedSetId="classic-professional"
        />
      </Box>
    </Container>
  );
};

export default TypographyDemoPage;