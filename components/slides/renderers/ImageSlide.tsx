import { Typography, Box } from '@mui/material';
import { Slide } from '@/lib/models/slide';
import Image from 'next/image';

interface ImageSlideProps {
  slide: Slide;
  isEditing?: boolean;
}

export default function ImageSlide({ slide, isEditing }: ImageSlideProps) {
  const { heading, imageUrl, imageDescription } = slide.content;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 6,
      }}
    >
      {heading && (
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontSize: '3.5rem',
            fontWeight: 600,
            marginBottom: 4,
            color: '#1a1a1a',
            textAlign: 'center',
            cursor: isEditing ? 'text' : 'default',
          }}
          contentEditable={isEditing}
          suppressContentEditableWarning={isEditing}
        >
          {heading}
        </Typography>
      )}
      
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          backgroundColor: imageUrl ? 'transparent' : '#f5f5f5',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {imageUrl ? (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              maxWidth: '1200px',
            }}
          >
            <img
              src={imageUrl}
              alt={imageDescription || heading || 'Slide image'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>
        ) : (
          <Typography
            variant="h5"
            sx={{
              color: '#999',
              fontStyle: 'italic',
            }}
          >
            {isEditing ? 'Click to add image' : 'No image'}
          </Typography>
        )}
      </Box>
      
      {imageDescription && (
        <Typography
          variant="body1"
          sx={{
            marginTop: 3,
            textAlign: 'center',
            color: '#666',
            fontSize: '1.25rem',
            fontStyle: 'italic',
            cursor: isEditing ? 'text' : 'default',
          }}
          contentEditable={isEditing}
          suppressContentEditableWarning={isEditing}
        >
          {imageDescription}
        </Typography>
      )}
    </Box>
  );
}