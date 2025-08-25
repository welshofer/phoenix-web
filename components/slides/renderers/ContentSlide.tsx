import { Slide } from '@/lib/models/slide';
import { Box, Typography } from '@mui/material';

interface ContentSlideProps {
  slide: Slide;
  isEditing?: boolean;
}

export default function ContentSlide({ slide }: ContentSlideProps) {
  // Find header and body text objects
  const headerObj = slide.objects?.find(obj => obj.type === 'text' && obj.role === 'header');
  const bodyObj = slide.objects?.find(obj => obj.type === 'text' && obj.role === 'body');
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        padding: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        backgroundColor: 'white',
      }}
    >
      {/* Header */}
      {headerObj && (
        <Typography
          variant="h2"
          sx={{
            fontSize: '48px',
            fontWeight: 700,
            marginBottom: '40px',
            color: '#1a1a1a',
          }}
        >
          {headerObj.content}
        </Typography>
      )}
      
      {/* Body Content */}
      {bodyObj && (
        <Typography
          variant="body1"
          sx={{
            fontSize: '24px',
            lineHeight: 1.8,
            color: '#333',
            maxWidth: '100%',
          }}
        >
          {bodyObj.content}
        </Typography>
      )}
      
      {/* Fallback if using old structure */}
      {!headerObj && !bodyObj && (
        <>
          {(slide as any).heading && (
            <Typography
              variant="h2"
              sx={{
                fontSize: '48px',
                fontWeight: 700,
                marginBottom: '40px',
                color: '#1a1a1a',
              }}
            >
              {(slide as any).heading}
            </Typography>
          )}
          {(slide as any).body && (
            <Typography
              variant="body1"
              sx={{
                fontSize: '24px',
                lineHeight: 1.8,
                color: '#333',
                maxWidth: '100%',
              }}
            >
              {(slide as any).body}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}