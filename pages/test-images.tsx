import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Container, Typography, Box, Paper, List, ListItem } from '@mui/material';

export default function TestImages() {
  const [jobs, setJobs] = useState<any[]>([]);
  const presentationId = 'SRwGAsOfUvy6dCtvvAmn';

  useEffect(() => {
    const q = query(
      collection(db, 'imageGenerationQueue'),
      where('presentationId', '==', presentationId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const jobsList: any[] = [];
        snapshot.forEach((doc) => {
          jobsList.push({ ...doc.data(), id: doc.id });
        });
        console.log('Jobs from Firestore:', jobsList);
        setJobs(jobsList);
      },
      (error) => {
        console.error('Firestore error:', error);
      }
    );
    
    return () => unsubscribe();
  }, []);

  const statusCounts = {
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Image Queue Debug - Presentation: {presentationId}
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Box>
          <Typography>Total Jobs: {jobs.length}</Typography>
          <Typography color="warning.main">Pending: {statusCounts.pending}</Typography>
          <Typography color="info.main">Processing: {statusCounts.processing}</Typography>
          <Typography color="success.main">Completed: {statusCounts.completed}</Typography>
          <Typography color="error.main">Failed: {statusCounts.failed}</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>All Jobs</Typography>
        <List>
          {jobs.map((job) => (
            <ListItem key={job.id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2">
                  <strong>Job ID:</strong> {job.id}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {job.status}
                </Typography>
                <Typography variant="body2">
                  <strong>Slide:</strong> {job.slideId}
                </Typography>
                {job.imageUrls && (
                  <Typography variant="body2">
                    <strong>Images:</strong> {job.imageUrls.length} variants
                  </Typography>
                )}
                {job.error && (
                  <Typography variant="body2" color="error">
                    <strong>Error:</strong> {job.error}
                  </Typography>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}