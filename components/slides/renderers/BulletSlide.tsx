import { Typography, Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Circle } from '@mui/icons-material';
import { Slide } from '@/lib/models/slide';

interface BulletSlideProps {
  slide: Slide;
  isEditing?: boolean;
}

export default function BulletSlide({ slide, isEditing }: BulletSlideProps) {
  const { heading, bullets = [] } = slide.content;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 8,
      }}
    >
      <Typography
        variant="h2"
        component="h1"
        sx={{
          fontSize: '4rem',
          fontWeight: 600,
          marginBottom: 6,
          color: '#1a1a1a',
          cursor: isEditing ? 'text' : 'default',
        }}
        contentEditable={isEditing}
        suppressContentEditableWarning={isEditing}
      >
        {heading || 'Click to add heading'}
      </Typography>
      
      <List sx={{ flex: 1 }}>
        {bullets.length > 0 ? (
          bullets.map((bullet, index) => (
            <ListItem
              key={index}
              sx={{
                paddingY: 2,
                alignItems: 'flex-start',
              }}
            >
              <ListItemIcon sx={{ minWidth: 48, marginTop: 1 }}>
                <Circle sx={{ fontSize: '0.75rem', color: '#333' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="h5"
                    sx={{
                      fontSize: '2.25rem',
                      lineHeight: 1.4,
                      color: '#333',
                      cursor: isEditing ? 'text' : 'default',
                    }}
                    contentEditable={isEditing}
                    suppressContentEditableWarning={isEditing}
                  >
                    {bullet}
                  </Typography>
                }
              />
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemIcon>
              <Circle sx={{ fontSize: '0.75rem', color: '#999' }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: '2.25rem',
                    color: '#999',
                    fontStyle: 'italic',
                  }}
                >
                  {isEditing ? 'Click to add bullet point' : ''}
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>
    </Box>
  );
}