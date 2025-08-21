import React, { useEffect } from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Chip,
  Stack,
  IconButton,
  Collapse,
  Alert,
  Button,
} from '@mui/material';
import {
  Image as ImageIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  PlayArrow as PlayIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useImageGeneration } from '@/hooks/useImageGeneration';

interface ImageGenerationProgressProps {
  presentationId: string;
  onImagesReady?: (slideImages: Map<string, string[]>, jobData?: any[]) => void;
  compact?: boolean;  // For showing in header/toolbar
}

export default function ImageGenerationProgress({ 
  presentationId,
  onImagesReady,
  compact = false
}: ImageGenerationProgressProps) {
  const [expanded, setExpanded] = React.useState(true);
  const [processingInterval, setProcessingInterval] = React.useState<NodeJS.Timeout | null>(null);
  
  const {
    jobs,
    pendingCount,
    processingCount,
    completedCount,
    failedCount,
    isGenerating,
    getCompletedImages,
  } = useImageGeneration(presentationId);

  const totalCount = jobs.length;
  const progress = totalCount > 0 ? ((completedCount + failedCount) / totalCount) * 100 : 0;

  // Start continuous processing when there are pending jobs
  useEffect(() => {
    if (pendingCount > 0 && !processingInterval) {
      // Initial call immediately
      fetch('/api/imagen/process-continuous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxJobs: 2 }), // Process fewer jobs at once
      }).then(result => result.json())
        .then(data => console.log('Initial processor:', data.message))
        .catch(error => console.error('Failed to process queue:', error));
      
      // Then set up interval for subsequent calls
      const interval = setInterval(async () => {
        try {
          const response = await fetch('/api/imagen/process-continuous', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maxJobs: 2 }), // Process fewer jobs at once
          });
          
          const result = await response.json();
          console.log('Continuous processor:', result.message);
          
          // Stop if no more jobs
          if (result.processedCount === 0 && pendingCount === 0) {
            clearInterval(interval);
            setProcessingInterval(null);
          }
        } catch (error) {
          console.error('Failed to process queue:', error);
        }
      }, 15000); // Run every 15 seconds (was 5) to respect rate limits
      
      setProcessingInterval(interval);
    }
    
    return () => {
      if (processingInterval) {
        clearInterval(processingInterval);
      }
    };
  }, [pendingCount, processingInterval]);

  // Notify when images are ready
  useEffect(() => {
    if (completedCount > 0 && onImagesReady) {
      const completedJobs = jobs.filter(j => j.status === 'completed');
      onImagesReady(getCompletedImages(), completedJobs);
    }
  }, [completedCount, getCompletedImages, onImagesReady, jobs]);

  if (totalCount === 0) {
    return null;
  }

  // Compact view for toolbar/header
  if (compact) {
    return (
      <Chip
        icon={isGenerating ? <ImageIcon /> : <CheckIcon />}
        label={`Images: ${completedCount}/${totalCount}`}
        size="small"
        color={isGenerating ? 'primary' : completedCount === totalCount ? 'success' : 'default'}
        variant={isGenerating ? 'filled' : 'outlined'}
        sx={{
          animation: isGenerating ? 'pulse 2s infinite' : 'none',
          '& .MuiChip-icon': {
            animation: isGenerating ? 'spin 2s linear infinite' : 'none',
          }
        }}
      />
    );
  }

  const handleRetryFailed = async () => {
    // Re-queue failed jobs
    const failedJobs = jobs.filter(j => j.status === 'failed');
    
    try {
      for (const job of failedJobs) {
        // Reset job status to pending for retry
        const response = await fetch('/api/imagen/retry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id }),
        });
        
        if (!response.ok) {
          console.error('Failed to retry job:', job.id);
        }
      }
      
      // Start processing again
      if (processingInterval) {
        clearInterval(processingInterval);
        setProcessingInterval(null);
      }
    } catch (error) {
      console.error('Error retrying failed jobs:', error);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 380,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3,
        zIndex: 1200,
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <ImageIcon color="primary" />
            <Typography variant="subtitle1" fontWeight="medium">
              Image Generation
            </Typography>
            {isGenerating && (
              <Chip
                size="small"
                label="Processing"
                color="primary"
                variant="outlined"
                sx={{ animation: 'pulse 2s infinite' }}
              />
            )}
          </Stack>
          <IconButton size="small">
            {expanded ? <ExpandMore /> : <ExpandLess />}
          </IconButton>
        </Stack>
        
        <Box sx={{ mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 6, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {completedCount} of {totalCount} images generated
          </Typography>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2, maxHeight: 300, overflowY: 'auto' }}>
          <Stack spacing={1}>
            {pendingCount > 0 && (
              <Alert severity="info" icon={<PendingIcon />} sx={{ py: 0.5 }}>
                {pendingCount} image{pendingCount !== 1 ? 's' : ''} waiting
              </Alert>
            )}
            
            {processingCount > 0 && (
              <Alert severity="info" icon={<PlayIcon />} sx={{ py: 0.5 }}>
                Generating {processingCount} image{processingCount !== 1 ? 's' : ''}...
              </Alert>
            )}
            
            {completedCount > 0 && (
              <Alert severity="success" icon={<CheckIcon />} sx={{ py: 0.5 }}>
                {completedCount} image{completedCount !== 1 ? 's' : ''} ready
              </Alert>
            )}
            
            {failedCount > 0 && (
              <Alert 
                severity="error" 
                icon={<ErrorIcon />} 
                sx={{ py: 0.5 }}
                action={
                  <Button size="small" onClick={handleRetryFailed}>
                    Retry
                  </Button>
                }
              >
                {failedCount} image{failedCount !== 1 ? 's' : ''} failed
              </Alert>
            )}
          </Stack>
          
          {!isGenerating && totalCount === completedCount && (
            <Alert severity="success" sx={{ mt: 2 }}>
              All images generated successfully!
            </Alert>
          )}
        </Box>
      </Collapse>
      
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}