import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Slider,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Image as ImageIcon,
  TextFields as TextIcon,
  Rectangle as ShapeIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Download as ExportIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  Palette as ColorIcon,
  FormatSize as FontIcon,
  ArrowBack,
  ArrowForward,
  DragIndicator,
  Fullscreen,
  ExitToApp,
} from '@mui/icons-material';
import { SlideRenderer } from '@/components/SlideRenderer';
import ImageGenerationProgress from '@/components/ImageGenerationProgress';
import { useAuth } from '@/hooks/useAuth';
import {
  getPresentation,
  updatePresentationSlides,
  updatePresentationMetadata,
  updateSlide,
} from '@/lib/firebase/presentations';
import {
  Slide,
  SlideType,
  SlideObjectUnion,
  TextObject,
  ImageObject,
  ShapeObject,
} from '@/lib/models/slide';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export default function PresentationEditor() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  // Presentation state
  const [presentation, setPresentation] = useState<any>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [propertyTab, setPropertyTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });
  
  // History for undo/redo
  const [history, setHistory] = useState<Slide[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load presentation
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadPresentation(id);
    }
  }, [id]);

  const loadPresentation = async (presentationId: string) => {
    try {
      setLoading(true);
      const data = await getPresentation(presentationId);
      if (data) {
        setPresentation(data);
        
        // Convert sections to slides if needed
        if (data.slides) {
          setSlides(data.slides);
        } else if (data.sections) {
          // Convert AI-generated sections to slide objects
          const convertedSlides = convertSectionsToSlides(data.sections);
          setSlides(convertedSlides);
        }
        
        // Initialize history
        setHistory([data.slides || []]);
        setHistoryIndex(0);
      }
    } catch (error) {
      console.error('Error loading presentation:', error);
      showSnackbar('Failed to load presentation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const convertSectionsToSlides = (sections: any[]): Slide[] => {
    const convertedSlides: Slide[] = [];
    let slideOrder = 0;

    sections.forEach(section => {
      section.slides?.forEach((aiSlide: any) => {
        const slide: Slide = {
          id: uuidv4(),
          type: mapAITypeToSlideType(aiSlide.type),
          objects: createObjectsFromAISlide(aiSlide),
          order: slideOrder++,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        convertedSlides.push(slide);
      });
    });

    return convertedSlides;
  };

  const mapAITypeToSlideType = (aiType: string): SlideType => {
    const mapping: Record<string, SlideType> = {
      'title': SlideType.TITLE,
      'agenda': SlideType.BULLETS,
      'bullets': SlideType.BULLETS,
      'sectionHeader': SlideType.SECTION,
      'twoColumn': SlideType.TWO_COLUMN,
      'comparison': SlideType.COMPARISON,
      'image': SlideType.IMAGE,
      'threeImages': SlideType.IMAGE,
      'quote': SlideType.QUOTE,
      'timeline': SlideType.TIMELINE,
      'table': SlideType.TABLE,
      'qAndA': SlideType.CONTENT,
      'thankYou': SlideType.CONTENT,
      'content': SlideType.CONTENT,
    };
    return mapping[aiType] || SlideType.CONTENT;
  };

  const createObjectsFromAISlide = (aiSlide: any): SlideObjectUnion[] => {
    const objects: SlideObjectUnion[] = [];
    
    // Add title
    if (aiSlide.title) {
      objects.push({
        id: uuidv4(),
        type: 'text',
        content: aiSlide.title,
        role: 'header',
        coordinates: { x: 100, y: 100, width: 1720, height: 200 },
        visible: true,
      } as TextObject);
    }
    
    // Add subtitle
    if (aiSlide.subtitle) {
      objects.push({
        id: uuidv4(),
        type: 'text',
        content: aiSlide.subtitle,
        role: 'subheader',
        coordinates: { x: 100, y: 320, width: 1720, height: 120 },
        visible: true,
      } as TextObject);
    }
    
    // Add content based on type
    if (aiSlide.content) {
      if (aiSlide.content.bullets) {
        aiSlide.content.bullets.forEach((bullet: string, index: number) => {
          objects.push({
            id: uuidv4(),
            type: 'text',
            content: `• ${bullet}`,
            role: 'bullets',
            coordinates: { x: 150, y: 480 + (index * 100), width: 1620, height: 80 },
            visible: true,
          } as TextObject);
        });
      }
      
      if (aiSlide.content.body) {
        objects.push({
          id: uuidv4(),
          type: 'text',
          content: aiSlide.content.body,
          role: 'body',
          coordinates: { x: 100, y: 480, width: 1720, height: 400 },
          visible: true,
        } as TextObject);
      }
    }
    
    return objects;
  };

  const currentSlide = slides[currentSlideIndex];

  // Save changes
  const savePresentation = async () => {
    if (!id || typeof id !== 'string') return;
    
    try {
      setSaving(true);
      await updatePresentationSlides(id, slides);
      showSnackbar('Presentation saved successfully', 'success');
    } catch (error) {
      console.error('Error saving presentation:', error);
      showSnackbar('Failed to save presentation', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Add to history for undo/redo
  const addToHistory = (newSlides: Slide[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newSlides]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSlides(newSlides);
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSlides([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSlides([...history[historyIndex + 1]]);
    }
  };

  // Add new slide
  const addSlide = (type: SlideType = SlideType.CONTENT) => {
    const newSlide: Slide = {
      id: uuidv4(),
      type,
      objects: [],
      order: slides.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const newSlides = [...slides, newSlide];
    addToHistory(newSlides);
    setCurrentSlideIndex(newSlides.length - 1);
  };

  // Duplicate slide
  const duplicateSlide = () => {
    if (!currentSlide) return;
    
    const duplicated: Slide = {
      ...currentSlide,
      id: uuidv4(),
      objects: currentSlide.objects.map(obj => ({
        ...obj,
        id: uuidv4(),
      })),
      order: currentSlideIndex + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const newSlides = [
      ...slides.slice(0, currentSlideIndex + 1),
      duplicated,
      ...slides.slice(currentSlideIndex + 1).map(s => ({ ...s, order: s.order + 1 })),
    ];
    
    addToHistory(newSlides);
    setCurrentSlideIndex(currentSlideIndex + 1);
  };

  // Delete slide
  const deleteSlide = () => {
    if (slides.length <= 1) {
      showSnackbar('Cannot delete the last slide', 'warning');
      return;
    }
    
    const newSlides = slides.filter((_, index) => index !== currentSlideIndex);
    addToHistory(newSlides);
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
  };

  // Add object to slide
  const addObject = (type: 'text' | 'image' | 'shape') => {
    if (!currentSlide) return;
    
    let newObject: SlideObjectUnion;
    
    switch (type) {
      case 'text':
        newObject = {
          id: uuidv4(),
          type: 'text',
          content: 'New Text',
          role: 'body',
          coordinates: { x: 500, y: 400, width: 400, height: 100 },
          visible: true,
        } as TextObject;
        break;
      
      case 'image':
        newObject = {
          id: uuidv4(),
          type: 'image',
          src: 'https://via.placeholder.com/400x300',
          alt: 'Placeholder Image',
          coordinates: { x: 500, y: 300, width: 400, height: 300 },
          fit: 'contain',
          visible: true,
        } as ImageObject;
        break;
      
      case 'shape':
        newObject = {
          id: uuidv4(),
          type: 'shape',
          shapeType: 'rectangle',
          coordinates: { x: 500, y: 400, width: 300, height: 200 },
          fill: '#1976d2',
          visible: true,
        } as ShapeObject;
        break;
    }
    
    const updatedSlide = {
      ...currentSlide,
      objects: [...currentSlide.objects, newObject],
      updatedAt: new Date(),
    };
    
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = updatedSlide;
    addToHistory(newSlides);
    setSelectedObjectId(newObject.id);
  };

  // Update object properties
  const updateObject = (objectId: string, updates: Partial<SlideObjectUnion>) => {
    if (!currentSlide) return;
    
    const updatedSlide = {
      ...currentSlide,
      objects: currentSlide.objects.map(obj =>
        obj.id === objectId ? { ...obj, ...updates } : obj
      ),
      updatedAt: new Date(),
    };
    
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = updatedSlide;
    addToHistory(newSlides);
  };

  // Delete object
  const deleteObject = (objectId: string) => {
    if (!currentSlide) return;
    
    const updatedSlide = {
      ...currentSlide,
      objects: currentSlide.objects.filter(obj => obj.id !== objectId),
      updatedAt: new Date(),
    };
    
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = updatedSlide;
    addToHistory(newSlides);
    setSelectedObjectId(null);
  };

  // Reorder slides
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(slides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order property
    const reorderedSlides = items.map((slide, index) => ({
      ...slide,
      order: index,
    }));
    
    addToHistory(reorderedSlides);
    
    // Update current slide index if needed
    if (currentSlideIndex === result.source.index) {
      setCurrentSlideIndex(result.destination.index);
    }
  };

  const selectedObject = currentSlide?.objects.find(obj => obj.id === selectedObjectId);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const startPresentation = () => {
    router.push(`/presentations/${id}/present`);
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading presentation...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left Sidebar - Slide Navigator */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? 280 : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Slides
          </Typography>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => addSlide()}
            sx={{ mb: 2 }}
          >
            Add Slide
          </Button>
        </Box>
        
        <Divider />
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="slides">
            {(provided) => (
              <List {...provided.droppableProps} ref={provided.innerRef}>
                {slides.map((slide, index) => (
                  <Draggable key={slide.id} draggableId={slide.id} index={index}>
                    {(provided, snapshot) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        button
                        selected={index === currentSlideIndex}
                        onClick={() => setCurrentSlideIndex(index)}
                        sx={{
                          backgroundColor: snapshot.isDragging ? 'action.hover' : undefined,
                        }}
                      >
                        <ListItemIcon {...provided.dragHandleProps}>
                          <DragIndicator />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Slide ${index + 1}`}
                          secondary={slide.type}
                        />
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
      </Drawer>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
            <DragIndicator />
          </IconButton>
          
          <Divider orientation="vertical" flexItem />
          
          <IconButton onClick={undo} disabled={historyIndex <= 0}>
            <UndoIcon />
          </IconButton>
          <IconButton onClick={redo} disabled={historyIndex >= history.length - 1}>
            <RedoIcon />
          </IconButton>
          
          <Divider orientation="vertical" flexItem />
          
          <IconButton onClick={duplicateSlide}>
            <DuplicateIcon />
          </IconButton>
          <IconButton onClick={deleteSlide} disabled={slides.length <= 1}>
            <DeleteIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Typography variant="body2">
            Slide {currentSlideIndex + 1} of {slides.length}
          </Typography>
          
          <IconButton 
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
          >
            <ArrowBack />
          </IconButton>
          <IconButton
            onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex === slides.length - 1}
          >
            <ArrowForward />
          </IconButton>
          
          <Divider orientation="vertical" flexItem />
          
          <Button
            variant="contained"
            startIcon={saving ? null : <SaveIcon />}
            onClick={savePresentation}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
          
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayIcon />}
            onClick={startPresentation}
          >
            Present
          </Button>
        </Paper>

        {/* Canvas Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', position: 'relative', p: 2, bgcolor: 'grey.100' }}>
          <Box sx={{ margin: 'auto' }}>
            {currentSlide && (
              <SlideRenderer
                slide={currentSlide}
                width={960}
                height={540}
                selectedObjectId={selectedObjectId}
                onObjectClick={setSelectedObjectId}
              />
            )}
          </Box>

          {/* Floating Action Buttons */}
          <SpeedDial
            ariaLabel="Add elements"
            sx={{ position: 'absolute', bottom: 16, right: 16 }}
            icon={<SpeedDialIcon />}
          >
            <SpeedDialAction
              icon={<TextIcon />}
              tooltipTitle="Add Text"
              onClick={() => addObject('text')}
            />
            <SpeedDialAction
              icon={<ImageIcon />}
              tooltipTitle="Add Image"
              onClick={() => addObject('image')}
            />
            <SpeedDialAction
              icon={<ShapeIcon />}
              tooltipTitle="Add Shape"
              onClick={() => addObject('shape')}
            />
          </SpeedDial>
        </Box>
      </Box>

      {/* Right Sidebar - Properties Panel */}
      <Paper sx={{ width: 320, overflow: 'auto' }}>
        <Tabs value={propertyTab} onChange={(_, v) => setPropertyTab(v)}>
          <Tab label="Slide" />
          <Tab label="Object" disabled={!selectedObject} />
          <Tab label="Theme" />
        </Tabs>

        <TabPanel value={propertyTab} index={0}>
          {currentSlide && (
            <Box>
              <FormControl fullWidth margin="normal">
                <InputLabel>Slide Type</InputLabel>
                <Select
                  value={currentSlide.type}
                  label="Slide Type"
                  onChange={(e) => {
                    const updatedSlide = { ...currentSlide, type: e.target.value as SlideType };
                    const newSlides = [...slides];
                    newSlides[currentSlideIndex] = updatedSlide;
                    addToHistory(newSlides);
                  }}
                >
                  {Object.values(SlideType).map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                margin="normal"
                label="Background Color"
                type="color"
                value={currentSlide.backgroundColor || '#ffffff'}
                onChange={(e) => {
                  const updatedSlide = { ...currentSlide, backgroundColor: e.target.value };
                  const newSlides = [...slides];
                  newSlides[currentSlideIndex] = updatedSlide;
                  addToHistory(newSlides);
                }}
              />
            </Box>
          )}
        </TabPanel>

        <TabPanel value={propertyTab} index={1}>
          {selectedObject && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Object Properties
              </Typography>
              
              {selectedObject.type === 'text' && (
                <>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Text Content"
                    multiline
                    rows={4}
                    value={(selectedObject as TextObject).content}
                    onChange={(e) => updateObject(selectedObject.id, { content: e.target.value })}
                  />
                  
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Text Role</InputLabel>
                    <Select
                      value={(selectedObject as TextObject).role}
                      label="Text Role"
                      onChange={(e) => updateObject(selectedObject.id, { role: e.target.value })}
                    >
                      {['title', 'subtitle', 'header', 'body', 'bullets', 'caption', 'quote'].map(role => (
                        <MenuItem key={role} value={role}>{role}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
              
              {selectedObject.type === 'image' && (
                <>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Image URL"
                    value={(selectedObject as ImageObject).src}
                    onChange={(e) => updateObject(selectedObject.id, { src: e.target.value })}
                  />
                  
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Alt Text"
                    value={(selectedObject as ImageObject).alt}
                    onChange={(e) => updateObject(selectedObject.id, { alt: e.target.value })}
                  />
                  
                  {/* Image Variants Controls */}
                  {(selectedObject as ImageObject).variants && (selectedObject as ImageObject).variants!.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Image Variants ({(selectedObject as ImageObject).variants!.length} available)
                      </Typography>
                      
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Hero Image</InputLabel>
                        <Select
                          value={(selectedObject as ImageObject).heroIndex || 0}
                          label="Hero Image"
                          onChange={(e) => {
                            const heroIndex = Number(e.target.value);
                            const imageObj = selectedObject as ImageObject;
                            updateObject(selectedObject.id, { 
                              heroIndex,
                              src: imageObj.variants![heroIndex] || imageObj.src
                            });
                          }}
                        >
                          {(selectedObject as ImageObject).variants!.map((_, index) => (
                            <MenuItem key={index} value={index}>
                              Variant {index + 1}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={(selectedObject as ImageObject).cycleOnPlayback || false}
                            onChange={(e) => updateObject(selectedObject.id, { cycleOnPlayback: e.target.checked })}
                          />
                        }
                        label="Cycle variants during presentation"
                        sx={{ mt: 1 }}
                      />
                      
                      {(selectedObject as ImageObject).cycleOnPlayback && (
                        <TextField
                          fullWidth
                          margin="normal"
                          label="Cycle Interval (ms)"
                          type="number"
                          value={(selectedObject as ImageObject).cycleInterval || 5000}
                          onChange={(e) => updateObject(selectedObject.id, { cycleInterval: Number(e.target.value) })}
                          helperText="Time between image changes in milliseconds"
                        />
                      )}
                      
                      {/* Preview thumbnails */}
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Click to preview variants:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          {(selectedObject as ImageObject).variants!.map((url, index) => (
                            <Box
                              key={index}
                              sx={{
                                width: 60,
                                height: 40,
                                backgroundImage: `url(${url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: index === ((selectedObject as ImageObject).heroIndex || 0) ? '2px solid primary.main' : '1px solid grey.300',
                                borderRadius: 1,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                              }}
                              onClick={() => {
                                updateObject(selectedObject.id, { 
                                  heroIndex: index,
                                  src: url
                                });
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </>
                  )}
                  
                  {/* Generation Metadata */}
                  {(selectedObject as ImageObject).generationDescription && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Generation Details
                      </Typography>
                      
                      <TextField
                        fullWidth
                        margin="normal"
                        label="Description"
                        value={(selectedObject as ImageObject).generationDescription}
                        multiline
                        rows={2}
                        InputProps={{ readOnly: true }}
                      />
                      
                      {(selectedObject as ImageObject).generationStyle && (
                        <TextField
                          fullWidth
                          margin="normal"
                          label="Style"
                          value={(selectedObject as ImageObject).generationStyle}
                          InputProps={{ readOnly: true }}
                        />
                      )}
                      
                      {(selectedObject as ImageObject).generationPrompt && (
                        <TextField
                          fullWidth
                          margin="normal"
                          label="Full Prompt"
                          value={(selectedObject as ImageObject).generationPrompt}
                          multiline
                          rows={3}
                          InputProps={{ readOnly: true }}
                          helperText="The complete prompt sent to the image generator"
                        />
                      )}
                      
                      {(selectedObject as ImageObject).generatedAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                          Generated: {new Date((selectedObject as ImageObject).generatedAt!).toLocaleString()}
                        </Typography>
                      )}
                    </>
                  )}
                </>
              )}
              
              {selectedObject.type === 'shape' && (
                <>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Fill Color"
                    type="color"
                    value={(selectedObject as ShapeObject).fill || '#1976d2'}
                    onChange={(e) => updateObject(selectedObject.id, { fill: e.target.value })}
                  />
                </>
              )}

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Position & Size
              </Typography>
              
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="X"
                    type="number"
                    value={selectedObject.coordinates.x}
                    onChange={(e) => updateObject(selectedObject.id, {
                      coordinates: { ...selectedObject.coordinates, x: Number(e.target.value) }
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Y"
                    type="number"
                    value={selectedObject.coordinates.y}
                    onChange={(e) => updateObject(selectedObject.id, {
                      coordinates: { ...selectedObject.coordinates, y: Number(e.target.value) }
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Width"
                    type="number"
                    value={selectedObject.coordinates.width}
                    onChange={(e) => updateObject(selectedObject.id, {
                      coordinates: { ...selectedObject.coordinates, width: Number(e.target.value) }
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Height"
                    type="number"
                    value={selectedObject.coordinates.height}
                    onChange={(e) => updateObject(selectedObject.id, {
                      coordinates: { ...selectedObject.coordinates, height: Number(e.target.value) }
                    })}
                  />
                </Grid>
              </Grid>

              <FormControlLabel
                control={
                  <Switch
                    checked={selectedObject.visible}
                    onChange={(e) => updateObject(selectedObject.id, { visible: e.target.checked })}
                  />
                }
                label="Visible"
                sx={{ mt: 2 }}
              />

              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => deleteObject(selectedObject.id)}
                sx={{ mt: 2 }}
              >
                Delete Object
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={propertyTab} index={2}>
          <Typography variant="subtitle2" gutterBottom>
            Theme Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Theme customization coming soon...
          </Typography>
        </TabPanel>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Image Generation Progress */}
      {id && typeof id === 'string' && (
        <ImageGenerationProgress
          presentationId={id}
          onImagesReady={(slideImages, jobData) => {
            // Update slides with generated images and metadata
            const updatedSlides = [...slides];
            slideImages.forEach((imageUrls, slideId) => {
              const slideIndex = updatedSlides.findIndex(s => s.id === slideId);
              if (slideIndex !== -1) {
                const slide = updatedSlides[slideIndex];
                // Get job data for this slide if available
                const job = jobData?.find(j => j.slideId === slideId);
                
                // Find image objects in the slide and update them
                slide.objects = slide.objects.map(obj => {
                  if (obj.type === 'image') {
                    return {
                      ...obj,
                      src: imageUrls[0] || obj.src,
                      variants: imageUrls,
                      heroIndex: 0,
                      // Add generation metadata
                      generationDescription: job?.description,
                      generationStyle: job?.style,
                      generationPrompt: job?.fullPrompt,
                      generatedAt: new Date(),
                    } as ImageObject;
                  }
                  return obj;
                });
              }
            });
            addToHistory(updatedSlides);
            showSnackbar('Images generated successfully!', 'success');
          }}
        />
      )}
    </Box>
  );
}