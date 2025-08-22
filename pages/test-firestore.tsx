import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Container, Typography, Box, Paper } from '@mui/material';

export default function TestFirestore() {
  const [snapshotData, setSnapshotData] = useState<any[]>([]);
  const [queryData, setQueryData] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const presentationId = 'SRwGAsOfUvy6dCtvvAmn';

  useEffect(() => {
    console.log('Setting up Firestore test for:', presentationId);
    
    // Try direct query first
    const q = query(
      collection(db, 'imageGenerationQueue'),
      where('presentationId', '==', presentationId)
    );
    
    getDocs(q).then(snapshot => {
      console.log('Direct query result:', snapshot.size, 'documents');
      const docs: any[] = [];
      snapshot.forEach(doc => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setQueryData(docs);
    }).catch(err => {
      console.error('Direct query error:', err);
      setError(`Query error: ${err.message}`);
    });
    
    // Set up subscription
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Snapshot received:', snapshot.size, 'documents');
        const docs: any[] = [];
        snapshot.forEach(doc => {
          docs.push({ id: doc.id, ...doc.data() });
        });
        setSnapshotData(docs);
      },
      (err) => {
        console.error('Subscription error:', err);
        setError(`Subscription error: ${err.message}`);
      }
    );
    
    return () => unsubscribe();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Firestore Connection Test
      </Typography>
      
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.main', color: 'white' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Direct Query Results</Typography>
        <Typography>Found {queryData.length} documents</Typography>
        {queryData.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              Status counts: 
              {' completed: ' + queryData.filter(d => d.status === 'completed').length}
              {', pending: ' + queryData.filter(d => d.status === 'pending').length}
              {', processing: ' + queryData.filter(d => d.status === 'processing').length}
              {', failed: ' + queryData.filter(d => d.status === 'failed').length}
            </Typography>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Real-time Subscription Results</Typography>
        <Typography>Found {snapshotData.length} documents</Typography>
        {snapshotData.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              Status counts: 
              {' completed: ' + snapshotData.filter(d => d.status === 'completed').length}
              {', pending: ' + snapshotData.filter(d => d.status === 'pending').length}
              {', processing: ' + snapshotData.filter(d => d.status === 'processing').length}
              {', failed: ' + snapshotData.filter(d => d.status === 'failed').length}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}