import { Slide } from '@/lib/models/slide';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';

interface ThreeImagesSlideProps {
  slide: Slide;
  isEditing?: boolean;
}

export default function ThreeImagesSlide({ slide }: ThreeImagesSlideProps) {
  // Find header and image objects
  const headerObj = slide.objects?.find(obj => obj.type === 'text' && obj.role === 'header');
  const imageObjs = slide.objects?.filter(obj => obj.type === 'image') || [];
  
  // Get first 3 images
  const mainImage = imageObjs[0];
  const topRightImage = imageObjs[1];
  const bottomRightImage = imageObjs[2];
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
      }}
    >
      {/* Header */}
      {headerObj && (
        <Typography
          variant="h2"
          sx={{
            fontSize: '42px',
            fontWeight: 700,
            marginBottom: '30px',
            color: '#1a1a1a',
          }}
        >
          {headerObj.content}
        </Typography>
      )}
      
      {/* Images Layout */}
      <Box sx={{ 
        display: 'flex', 
        gap: '30px', 
        flex: 1,
        height: 'calc(100% - 100px)'
      }}>
        {/* Main Large Image (Left) */}
        <Box sx={{ 
          flex: '1 1 60%',
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#f5f5f5',
        }}>
          {mainImage?.src ? (
            <Image
              src={mainImage.src}
              alt={mainImage.alt || 'Main image'}
              fill
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <Box sx={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#999'
            }}>
              {mainImage?.generationDescription || 'Image 1'}
            </Box>
          )}
        </Box>
        
        {/* Right Column - Two Smaller Images */}
        <Box sx={{ 
          flex: '1 1 40%',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px'
        }}>
          {/* Top Right Image */}
          <Box sx={{ 
            flex: 1,
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
          }}>
            {topRightImage?.src ? (
              <Image
                src={topRightImage.src}
                alt={topRightImage.alt || 'Top right image'}
                fill
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <Box sx={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#999',
                padding: '20px',
                textAlign: 'center'
              }}>
                {topRightImage?.generationDescription || 'Image 2'}
              </Box>
            )}
          </Box>
          
          {/* Bottom Right Image */}
          <Box sx={{ 
            flex: 1,
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
          }}>
            {bottomRightImage?.src ? (
              <Image
                src={bottomRightImage.src}
                alt={bottomRightImage.alt || 'Bottom right image'}
                fill
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <Box sx={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#999',
                padding: '20px',
                textAlign: 'center'
              }}>
                {bottomRightImage?.generationDescription || 'Image 3'}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}