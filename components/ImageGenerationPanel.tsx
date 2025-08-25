import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Image as ImageIcon,
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty,
  PlayArrow,
  Stop,
  Refresh,
  Palette,
  AutoAwesome,
  Download,
  Visibility,
} from '@mui/icons-material';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { IMAGE_STYLES, ImageStyle } from '@/lib/constants/image-styles';

interface ImageGenerationPanelProps {
  presentationId: string;
  userId: string;
  slides: Array<{
    id: string;
    title?: string;
    images?: Array<{
      id: string;
      description: string;
    }>;
  }>;
  onImageGenerated?: (slideId: string, imageUrl: string) => void;
}

export const ImageGenerationPanel: React.FC<ImageGenerationPanelProps> = ({
  presentationId,
  userId,
  slides,
  onImageGenerated,
}) => {
  const imageGeneration = useImageGeneration(presentationId);
  const {
    jobs,
    pendingCount,
    processingCount,
    completedCount,
    failedCount,
    isGenerating,
    getJobForSlide,
    getCompletedImages,
    triggerQueueProcessing,
  } = imageGeneration;

  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('photorealistic');
  const [expandedSlides, setExpandedSlides] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showStyleGallery, setShowStyleGallery] = useState(false);

  // Notify parent when images are generated
  useEffect(() => {
    const completedImages = getCompletedImages();
    completedImages.forEach((imageUrls, slideId) => {
      if (imageUrls && imageUrls.length > 0 && onImageGenerated) {
        onImageGenerated(slideId, imageUrls[0]);
      }
    });
  }, [jobs, onImageGenerated, getCompletedImages]);

  const handleGenerateAll = async () => {
    const requests = slides.flatMap(slide =>
      (slide.images || []).map(image => ({
        slideId: slide.id,
        description: image.description,
        style: selectedStyle,
        priority: 1, // Normal priority
      }))
    );

    if (requests.length === 0) {
      return;
    }

    // For now, we'll need to create image generation jobs through the API
    // Since generateImages function doesn't exist in the hook
    // TODO: Implement API call to create image generation jobs
  };

  const handleGenerateForSlide = async (slideId: string) => {
    const slide = slides.find(s => s.id === slideId);
    if (!slide || !slide.images) return;

    const requests = slide.images.map(image => ({
      slideId: slide.id,
      description: image.description,
      style: selectedStyle,
      priority: 2, // High priority for individual generation
    }));

    // For now, we'll need to create image generation jobs through the API
    // TODO: Implement API call to create image generation jobs for specific slide
  };

  const toggleSlideExpanded = (slideId: string) => {
    const newExpanded = new Set(expandedSlides);
    if (newExpanded.has(slideId)) {
      newExpanded.delete(slideId);
    } else {
      newExpanded.add(slideId);
    }
    setExpandedSlides(newExpanded);
  };

  const getSlideStatus = (slideId: string) => {
    const job = getJobForSlide(slideId);
    if (!job) return 'pending';
    return job.status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'processing':
        return <CircularProgress size={20} />;
      case 'queued':
        return <HourglassEmpty color="action" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <ImageIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string): any => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'primary';
      case 'queued': return 'default';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const popularStyles: ImageStyle[] = [
    'photorealistic',
    'digitalArt',
    'watercolor',
    'minimalist',
    'comicBook',
    'vintage',
    'impressionist',
    'scandinavian60s',
  ];

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome />
          AI Image Generation
        </Typography>
        
        {/* Progress */}
        {jobs.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                {completedCount} of {jobs.length} images
              </Typography>
              <Typography variant="body2">
                {Math.round((completedCount / jobs.length) * 100)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(completedCount / jobs.length) * 100}
              sx={{ height: 8, borderRadius: 4 }}
            />
            
            {/* Status chips */}
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {processingCount > 0 && (
                <Chip
                  size="small"
                  label={`${processingCount} processing`}
                  color="primary"
                  variant="outlined"
                />
              )}
              {pendingCount > 0 && (
                <Chip
                  size="small"
                  label={`${pendingCount} pending`}
                  variant="outlined"
                />
              )}
              {failedCount > 0 && (
                <Chip
                  size="small"
                  label={`${failedCount} failed`}
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Style Selection */}
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Art Style</InputLabel>
          <Select
            value={selectedStyle}
            label="Art Style"
            onChange={(e) => setSelectedStyle(e.target.value as ImageStyle)}
            startAdornment={<Palette sx={{ mr: 1, ml: -0.5 }} fontSize="small" />}
          >
            <MenuItem value="" onClick={() => setShowStyleGallery(true)}>
              <em>View Style Gallery...</em>
            </MenuItem>
            {popularStyles.map(style => (
              <MenuItem key={style} value={style}>
                {style.replace(/([A-Z])/g, ' $1').trim()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={isGenerating ? <Stop /> : <PlayArrow />}
          onClick={isGenerating ? () => {} : handleGenerateAll}
          disabled={false}
          fullWidth
        >
          {isGenerating ? 'Stop Generation' : 'Generate All Images'}
        </Button>
      </Box>

      {/* Error handling can be added based on job failures */}

      {/* Slides List */}
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {slides.map((slide, index) => {
          const slideJob = getJobForSlide(slide.id);
          const slideStatus = getSlideStatus(slide.id);
          const hasImages = slide.images && slide.images.length > 0;
          const isExpanded = expandedSlides.has(slide.id);

          return (
            <React.Fragment key={slide.id}>
              <ListItem
                button={hasImages}
                onClick={() => hasImages && toggleSlideExpanded(slide.id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  bgcolor: isExpanded ? 'action.hover' : undefined,
                }}
              >
                <ListItemIcon>
                  {getStatusIcon(slideStatus)}
                </ListItemIcon>
                <ListItemText
                  primary={slide.title || `Slide ${index + 1}`}
                  secondary={
                    hasImages
                      ? `${slide.images?.length} image${slide.images?.length !== 1 ? 's' : ''}`
                      : 'No images'
                  }
                />
                {hasImages && (
                  <ListItemSecondaryAction>
                    <Chip
                      size="small"
                      label={slideStatus}
                      color={getStatusColor(slideStatus)}
                      variant={slideStatus === 'completed' ? 'filled' : 'outlined'}
                    />
                    {slideStatus === 'pending' && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateForSlide(slide.id);
                        }}
                        sx={{ ml: 1 }}
                      >
                        <PlayArrow />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                )}
              </ListItem>

              {/* Expanded slide details */}
              <Collapse in={isExpanded && hasImages}>
                <Box sx={{ pl: 7, pr: 2, pb: 2 }}>
                  {slideJob?.status === 'completed' && slideJob.imageUrls && slideJob.imageUrls[0] && (
                    <Card sx={{ mb: 2 }}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={slideJob.imageUrls[0]}
                        alt="Generated image"
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setPreviewImage(slideJob.imageUrls![0])}
                      />
                      <CardContent sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View full size">
                            <IconButton
                              size="small"
                              onClick={() => setPreviewImage(slideJob.imageUrls![0])}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton
                              size="small"
                              component="a"
                              href={slideJob.imageUrls[0]}
                              download={`slide-${slide.id}.png`}
                            >
                              <Download />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Regenerate">
                            <IconButton
                              size="small"
                              onClick={() => handleGenerateForSlide(slide.id)}
                            >
                              <Refresh />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                  
                  {slide.images?.map((image, idx) => (
                    <Typography key={idx} variant="body2" color="text.secondary" paragraph>
                      {image.description}
                    </Typography>
                  ))}
                  
                  {slideJob?.status === 'failed' && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {slideJob.error || 'Image generation failed'}
                    </Alert>
                  )}
                </Box>
              </Collapse>
            </React.Fragment>
          );
        })}
      </List>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
        fullWidth
      >
        {previewImage && (
          <>
            <DialogContent sx={{ p: 0 }}>
              <img
                src={previewImage}
                alt="Preview"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewImage(null)}>Close</Button>
              <Button
                component="a"
                href={previewImage}
                download
                variant="contained"
                startIcon={<Download />}
              >
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Style Gallery Dialog */}
      <Dialog
        open={showStyleGallery}
        onClose={() => setShowStyleGallery(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Choose Art Style</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {Object.entries(IMAGE_STYLES).map(([key, description]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedStyle === key ? 2 : 0,
                    borderColor: 'primary.main',
                  }}
                  onClick={() => {
                    setSelectedStyle(key as ImageStyle);
                    setShowStyleGallery(false);
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {description.substring(0, 80)}...
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStyleGallery(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};