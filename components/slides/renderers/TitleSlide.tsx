import { Typography, Box } from '@mui/material';
import { Slide } from '@/lib/models/slide';

interface TitleSlideProps {
  slide: Slide;
  isEditing?: boolean;
}

export default function TitleSlide({ slide, isEditing }: TitleSlideProps) {
  const { heading, subheading } = slide.content;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        textAlign: 'center',
      }}
    >
      <Typography
        variant="h1"
        component="h1"
        sx={{
          fontSize: '6rem',
          fontWeight: 700,
          marginBottom: 4,
          color: '#1a1a1a',
          lineHeight: 1.2,
          cursor: isEditing ? 'text' : 'default',
        }}
        contentEditable={isEditing}
        suppressContentEditableWarning={isEditing}
      >
        {heading || 'Click to add title'}
      </Typography>
      
      <Typography
        variant="h3"
        component="h2"
        sx={{
          fontSize: '2.5rem',
          fontWeight: 400,
          color: '#666',
          cursor: isEditing ? 'text' : 'default',
        }}
        contentEditable={isEditing}
        suppressContentEditableWarning={isEditing}
      >
        {subheading || 'Click to add subtitle'}
      </Typography>
    </Box>
  );
}