import { Typography, Box, Grid, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Circle } from '@mui/icons-material';
import { Slide } from '@/lib/models/slide';

interface TwoColumnSlideProps {
  slide: Slide;
  isEditing?: boolean;
}

export default function TwoColumnSlide({ slide, isEditing }: TwoColumnSlideProps) {
  const { heading, bullets = [], imageUrl, body } = slide.content;
  
  // Split bullets into two columns
  const midPoint = Math.ceil(bullets.length / 2);
  const leftBullets = bullets.slice(0, midPoint);
  const rightBullets = bullets.slice(midPoint);

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
            cursor: isEditing ? 'text' : 'default',
          }}
          contentEditable={isEditing}
          suppressContentEditableWarning={isEditing}
        >
          {heading}
        </Typography>
      )}
      
      <Grid container spacing={6} sx={{ flex: 1 }}>
        <Grid item xs={6}>
          {imageUrl ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <img
                src={imageUrl}
                alt="Column image"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          ) : (
            <Box>
              {body && (
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.75rem',
                    lineHeight: 1.6,
                    color: '#333',
                    marginBottom: 3,
                    cursor: isEditing ? 'text' : 'default',
                  }}
                  contentEditable={isEditing}
                  suppressContentEditableWarning={isEditing}
                >
                  {body}
                </Typography>
              )}
              <List>
                {leftBullets.map((bullet, index) => (
                  <ListItem key={index} sx={{ paddingY: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Circle sx={{ fontSize: '0.6rem', color: '#333' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: '1.75rem',
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
                ))}
              </List>
            </Box>
          )}
        </Grid>
        
        <Grid item xs={6}>
          <List>
            {rightBullets.map((bullet, index) => (
              <ListItem key={index} sx={{ paddingY: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Circle sx={{ fontSize: '0.6rem', color: '#333' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: '1.75rem',
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
            ))}
          </List>
        </Grid>
      </Grid>
    </Box>
  );
}