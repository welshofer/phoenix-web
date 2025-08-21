import { Typography, Box } from '@mui/material';
import { FormatQuote } from '@mui/icons-material';
import { Slide } from '@/lib/models/slide';

interface QuoteSlideProps {
  slide: Slide;
  isEditing?: boolean;
}

export default function QuoteSlide({ slide, isEditing }: QuoteSlideProps) {
  const { body, subheading } = slide.content;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        textAlign: 'center',
      }}
    >
      <FormatQuote 
        sx={{ 
          fontSize: '6rem', 
          color: '#ddd',
          marginBottom: 2,
          transform: 'rotate(180deg)',
        }} 
      />
      
      <Typography
        variant="h3"
        component="blockquote"
        sx={{
          fontSize: '3.5rem',
          fontWeight: 500,
          fontStyle: 'italic',
          lineHeight: 1.4,
          color: '#1a1a1a',
          marginBottom: 4,
          maxWidth: '1200px',
          cursor: isEditing ? 'text' : 'default',
        }}
        contentEditable={isEditing}
        suppressContentEditableWarning={isEditing}
      >
        {body || 'Click to add quote'}
      </Typography>
      
      {subheading && (
        <Typography
          variant="h5"
          component="cite"
          sx={{
            fontSize: '2rem',
            fontWeight: 400,
            color: '#666',
            fontStyle: 'normal',
            cursor: isEditing ? 'text' : 'default',
            '&:before': {
              content: '"—"',
              marginRight: 1,
            },
          }}
          contentEditable={isEditing}
          suppressContentEditableWarning={isEditing}
        >
          {subheading}
        </Typography>
      )}
      
      <FormatQuote 
        sx={{ 
          fontSize: '6rem', 
          color: '#ddd',
          marginTop: 2,
        }} 
      />
    </Box>
  );
}