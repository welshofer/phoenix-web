import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Paper,
  Divider,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Fullscreen,
  Download,
  Edit,
  ExpandMore,
  ExpandLess,
  ViewCarousel,
  Notes,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';

interface Slide {
  type: string;
  title: string;
  subtitle?: string;
  content: any;
  speakerNotes?: string;
  presenterNotes?: string[];
  images?: Array<{ id: string; description: string }>;
}

interface Section {
  title: string;
  slides: Slide[];
}

interface Presentation {
  title: string;
  author: string;
  date: string;
  tone: string;
  goal: string;
  audience: string;
  sections: Section[];
}

export default function ViewPresentationPage() {
  const router = useRouter();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [expandedNotes, setExpandedNotes] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load presentation from localStorage (temporary solution)
    const savedPresentation = localStorage.getItem('lastPresentation');
    if (savedPresentation) {
      try {
        const parsed = JSON.parse(savedPresentation);
        setPresentation(parsed);
      } catch (error) {
        console.error('Failed to parse presentation:', error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading presentation...</Typography>
      </Container>
    );
  }

  if (!presentation) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          No presentation found. Please generate a presentation first.
        </Alert>
        <Button
          variant="contained"
          onClick={() => router.push('/generate')}
          sx={{ mt: 2 }}
        >
          Generate New Presentation
        </Button>
      </Container>
    );
  }

  // Flatten all slides for navigation
  const allSlides: Slide[] = [];
  presentation.sections.forEach(section => {
    allSlides.push(...section.slides);
  });

  const currentSlide = allSlides[currentSlideIndex];
  const totalSlides = allSlides.length;

  const handlePrevious = () => {
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
  };

  const handleNext = () => {
    setCurrentSlideIndex(Math.min(totalSlides - 1, currentSlideIndex + 1));
  };

  const renderSlideContent = (slide: Slide) => {
    const { type, content } = slide;

    switch (type) {
      case 'agenda':
      case 'bullets':
        return (
          <List>
            {content.bullets?.map((bullet: string, index: number) => (
              <ListItem key={index}>
                <ListItemText primary={bullet} />
              </ListItem>
            ))}
          </List>
        );

      case 'twoColumn':
        return (
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <Typography variant="h6" gutterBottom>Left Column</Typography>
              <List>
                {content.leftBullets?.map((bullet: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemText primary={bullet} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" gutterBottom>Right Column</Typography>
              <List>
                {content.rightBullets?.map((bullet: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemText primary={bullet} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        );

      case 'comparison':
        return (
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <Typography variant="h6" gutterBottom>{content.leftTitle}</Typography>
              <List>
                {content.leftBullets?.map((bullet: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemText primary={bullet} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" gutterBottom>{content.rightTitle}</Typography>
              <List>
                {content.rightBullets?.map((bullet: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemText primary={bullet} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        );

      case 'quote':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" sx={{ fontStyle: 'italic', mb: 2 }}>
              "{content.quote}"
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              — {content.attribution}
            </Typography>
          </Box>
        );

      case 'problemStatement':
        return (
          <Box>
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
              <Typography variant="h6" gutterBottom>Problem</Typography>
              <Typography>{content.problem}</Typography>
            </Paper>
            <Paper sx={{ p: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="h6" gutterBottom>Solution</Typography>
              <Typography>{content.solution}</Typography>
            </Paper>
          </Box>
        );

      case 'timeline':
        return (
          <Box>
            {content.events?.map((event: any, index: number) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="h6" color="primary">{event.date}</Typography>
                <Typography variant="subtitle1">{event.title}</Typography>
                <Typography variant="body2" color="text.secondary">{event.description}</Typography>
              </Box>
            ))}
          </Box>
        );

      case 'table':
        return (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {content.headers?.map((header: string, index: number) => (
                    <th key={index} style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.rows?.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        );

      case 'threeImages':
        return (
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                <ImageIcon sx={{ fontSize: 48, color: 'grey.500' }} />
                <Typography variant="caption" display="block">{content.image1Caption}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                <ImageIcon sx={{ fontSize: 48, color: 'grey.500' }} />
                <Typography variant="caption" display="block">{content.image2Caption}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                <ImageIcon sx={{ fontSize: 48, color: 'grey.500' }} />
                <Typography variant="caption" display="block">{content.image3Caption}</Typography>
              </Paper>
            </Grid>
          </Grid>
        );

      case 'sectionHeader':
      case 'qAndA':
      case 'thankYou':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1">{content.body}</Typography>
          </Box>
        );

      default:
        return (
          <Box>
            <Typography variant="body1">{content.body || 'Content not available'}</Typography>
            {content.bullets && (
              <List>
                {content.bullets.map((bullet: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemText primary={bullet} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        );
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {presentation.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={`By ${presentation.author}`} size="small" />
            <Chip label={presentation.date} size="small" />
            <Chip label={`${presentation.tone} tone`} size="small" color="primary" />
            <Chip label={`Goal: ${presentation.goal}`} size="small" />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Edit />}>Edit</Button>
          <Button startIcon={<Download />}>Export</Button>
          <Button startIcon={<Fullscreen />} variant="contained">Present</Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Slide Area */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, overflow: 'auto' }}>
              {/* Slide Header */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {currentSlide.title}
                </Typography>
                {currentSlide.subtitle && (
                  <Typography variant="subtitle1" color="text.secondary">
                    {currentSlide.subtitle}
                  </Typography>
                )}
                <Chip 
                  label={currentSlide.type} 
                  size="small" 
                  sx={{ mt: 1 }}
                  color="secondary"
                />
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Slide Content */}
              {renderSlideContent(currentSlide)}
            </CardContent>

            {/* Navigation */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <IconButton onClick={handlePrevious} disabled={currentSlideIndex === 0}>
                <ArrowBack />
              </IconButton>
              
              <Typography>
                Slide {currentSlideIndex + 1} of {totalSlides}
              </Typography>
              
              <IconButton onClick={handleNext} disabled={currentSlideIndex === totalSlides - 1}>
                <ArrowForward />
              </IconButton>
            </Box>
          </Card>

          {/* Speaker Notes */}
          {currentSlide.speakerNotes && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Notes /> Speaker Notes
                  </Typography>
                  <IconButton onClick={() => setExpandedNotes(!expandedNotes)}>
                    {expandedNotes ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
                <Collapse in={expandedNotes}>
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    {currentSlide.speakerNotes}
                  </Typography>
                </Collapse>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Slide Navigator */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, maxHeight: '800px', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ViewCarousel /> Slide Navigator
            </Typography>
            
            {presentation.sections.map((section, sectionIndex) => (
              <Box key={sectionIndex} sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  {section.title}
                </Typography>
                <List dense>
                  {section.slides.map((slide, slideIndex) => {
                    const globalIndex = presentation.sections
                      .slice(0, sectionIndex)
                      .reduce((acc, s) => acc + s.slides.length, 0) + slideIndex;
                    
                    return (
                      <ListItem
                        key={slideIndex}
                        button
                        selected={globalIndex === currentSlideIndex}
                        onClick={() => setCurrentSlideIndex(globalIndex)}
                      >
                        <ListItemText
                          primary={`${globalIndex + 1}. ${slide.title}`}
                          secondary={slide.type}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}