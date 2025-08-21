import { useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { Button, Box, Typography, Container, Paper } from '@mui/material';
import { AutoAwesome, ViewCarousel } from '@mui/icons-material';
import { useRouter } from 'next/router';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      signInAnonymously(auth);
    }
  }, [loading, user]);

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            width: '100%',
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            Phoenix Web
          </Typography>
          
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
            AI-Powered Presentation Generator
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            {loading ? 'Loading...' : user ? `Connected as: ${user.uid}` : 'Connecting to Firebase...'}
          </Typography>
          
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AutoAwesome />}
              onClick={() => router.push('/generate')}
              disabled={loading || !user}
            >
              Generate Presentation
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<ViewCarousel />}
              onClick={() => router.push('/presentations')}
              disabled={loading || !user}
            >
              My Presentations
            </Button>
          </Box>
          
          <Box sx={{ mt: 6, pt: 4, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Create professional presentations in seconds with AI
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}