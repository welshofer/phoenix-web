import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Button,
  IconButton,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Share,
  ContentCopy,
  PlayArrow,
  MoreVert,
  CalendarToday,
  Person,
  ViewCarousel,
  AutoAwesome,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import {
  getUserPresentations,
  deletePresentation,
  duplicatePresentation,
  PresentationDocument,
} from '@/lib/firebase/presentations';
import { format } from 'date-fns';

export default function PresentationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [presentations, setPresentations] = useState<PresentationDocument[]>([]);
  const [filteredPresentations, setFilteredPresentations] = useState<PresentationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement | null; id: string | null }>({ el: null, id: null });

  useEffect(() => {
    if (user) {
      loadPresentations();
    }
  }, [user]);

  useEffect(() => {
    // Filter presentations based on search term
    if (searchTerm) {
      const filtered = presentations.filter(p =>
        p.metadata.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.metadata.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.metadata.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPresentations(filtered);
    } else {
      setFilteredPresentations(presentations);
    }
  }, [searchTerm, presentations]);

  const loadPresentations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userPresentations = await getUserPresentations(user.uid, 50);
      setPresentations(userPresentations);
      setFilteredPresentations(userPresentations);
    } catch (error) {
      console.error('Error loading presentations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    
    try {
      await deletePresentation(deleteDialog.id);
      setPresentations(prev => prev.filter(p => p.metadata.id !== deleteDialog.id));
      setDeleteDialog({ open: false, id: null });
    } catch (error) {
      console.error('Error deleting presentation:', error);
    }
  };

  const handleDuplicate = async (id: string, title: string) => {
    if (!user) return;
    
    try {
      const newTitle = `${title} (Copy)`;
      const newId = await duplicatePresentation(id, newTitle, user.uid);
      
      // Reload presentations to show the new copy
      await loadPresentations();
      
      // Navigate to the new presentation
      router.push(`/presentations/${newId}/edit`);
    } catch (error) {
      console.error('Error duplicating presentation:', error);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown date';
    
    // Handle Firestore Timestamp
    if (date.toDate) {
      return format(date.toDate(), 'MMM d, yyyy');
    }
    
    // Handle Date object
    if (date instanceof Date) {
      return format(date, 'MMM d, yyyy');
    }
    
    return 'Unknown date';
  };

  const getThumbnail = (presentation: PresentationDocument) => {
    // Use custom thumbnail if available
    if (presentation.metadata.thumbnail) {
      return presentation.metadata.thumbnail;
    }
    
    // Generate a placeholder based on the title
    const colors = ['4A90E2', 'FF6B6B', '9B59B6', 'E74C3C', '2ECC71', 'F39C12'];
    const colorIndex = presentation.metadata.title.charCodeAt(0) % colors.length;
    const color = colors[colorIndex];
    
    return `https://via.placeholder.com/400x225/${color}/FFFFFF?text=${encodeURIComponent(presentation.metadata.title.slice(0, 20))}`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            My Presentations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filteredPresentations.length} presentation{filteredPresentations.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        
        <Tooltip title="Create New Presentation">
          <Fab
            color="primary"
            onClick={() => router.push('/generate')}
            sx={{ ml: 2 }}
          >
            <Add />
          </Fab>
        </Tooltip>
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search presentations..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {/* Presentations Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={225} />
                <CardContent>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredPresentations.length === 0 ? (
        <Alert severity="info">
          {searchTerm
            ? `No presentations found matching "${searchTerm}"`
            : 'No presentations yet. Create your first presentation!'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredPresentations.map((presentation) => (
            <Grid item xs={12} sm={6} md={4} key={presentation.metadata.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="225"
                  image={getThumbnail(presentation)}
                  alt={presentation.metadata.title}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/presentations/${presentation.metadata.id}/edit`)}
                />
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {presentation.metadata.title}
                  </Typography>
                  
                  {presentation.metadata.subtitle && (
                    <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
                      {presentation.metadata.subtitle}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<ViewCarousel />}
                      label={`${presentation.metadata.slideCount} slides`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={presentation.metadata.tone}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                    <CalendarToday fontSize="small" />
                    {formatDate(presentation.metadata.createdAt)}
                  </Box>
                  
                  {presentation.metadata.author && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.875rem', mt: 0.5 }}>
                      <Person fontSize="small" />
                      {presentation.metadata.author}
                    </Box>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/presentations/${presentation.metadata.id}/edit`)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/presentations/${presentation.metadata.id}/present`)}
                    >
                      <PlayArrow />
                    </IconButton>
                  </Box>
                  
                  <IconButton
                    size="small"
                    onClick={(e) => setMenuAnchor({ el: e.currentTarget, id: presentation.metadata.id })}
                  >
                    <MoreVert />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor.el}
        open={Boolean(menuAnchor.el)}
        onClose={() => setMenuAnchor({ el: null, id: null })}
      >
        <MenuItem onClick={() => {
          if (menuAnchor.id) {
            router.push(`/presentations/${menuAnchor.id}/edit`);
          }
          setMenuAnchor({ el: null, id: null });
        }}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (menuAnchor.id) {
            router.push(`/presentations/${menuAnchor.id}/present`);
          }
          setMenuAnchor({ el: null, id: null });
        }}>
          <PlayArrow sx={{ mr: 1 }} fontSize="small" />
          Present
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (menuAnchor.id) {
            const presentation = presentations.find(p => p.metadata.id === menuAnchor.id);
            if (presentation) {
              handleDuplicate(menuAnchor.id, presentation.metadata.title);
            }
          }
          setMenuAnchor({ el: null, id: null });
        }}>
          <ContentCopy sx={{ mr: 1 }} fontSize="small" />
          Duplicate
        </MenuItem>
        
        <MenuItem onClick={() => {
          // TODO: Implement sharing
          setMenuAnchor({ el: null, id: null });
        }}>
          <Share sx={{ mr: 1 }} fontSize="small" />
          Share
        </MenuItem>
        
        <MenuItem onClick={() => {
          setDeleteDialog({ open: true, id: menuAnchor.id });
          setMenuAnchor({ el: null, id: null });
        }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Delete Presentation?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this presentation? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}