import React, { useState, useEffect } from 'react';
import { Box, Button, Select, MenuItem, IconButton, TextField, CircularProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import { Document, Page, pdfjs } from 'react-pdf';
import Draggable from 'react-draggable';
import { Rnd } from 'react-rnd';
import { PreviewDoc } from './PDFPreviewDrawer';
import { docApi } from '../api';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Annotation {
  id: string;
  type: 'text' | 'whiteout';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  pageNumber: number;
}

interface PDFEditorProps {
  doc: PreviewDoc;
}

export default function PDFEditor({ doc }: PDFEditorProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const [selectedFont, setSelectedFont] = useState('Cambria');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedSize, setSelectedSize] = useState(14);
  const [selectedBold, setSelectedBold] = useState(false);
  const [selectedItalic, setSelectedItalic] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [targetPage, setTargetPage] = useState(1);

  const handleFormatChange = (field: string, value: any) => {
    // Update default state for new annotations
    if (field === 'fontSize') setSelectedSize(value);
    else if (field === 'color') setSelectedColor(value);
    else if (field === 'fontFamily') setSelectedFont(value);
    else if (field === 'isBold') setSelectedBold(value);
    else if (field === 'isItalic') setSelectedItalic(value);

    // If an annotation is currently focused, update it directly
    if (selectedAnnotationId) {
      updateAnnotation(selectedAnnotationId, { [field]: value });
    }
  };

  useEffect(() => {
    if (!doc.is_manual) {
      // Fetch annotations from backend
      fetch(`/doc-api/documents/${doc.id}/versions/${doc.version}/annotations`)
        .then(res => res.json())
        .then(data => {
          if (data.annotations) {
            setAnnotations(data.annotations);
          }
        })
        .catch(err => console.error("Failed to fetch annotations", err));
        
      setPdfUrl(docApi.pdfUrl(doc.id, doc.version, false, doc.language) + '&raw=true');
    }
  }, [doc]);

  const handleAddText = () => {
    setSelectedAnnotationId(null);
    setAnnotations([
      ...annotations,
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'text',
        x: 50,
        y: 50,
        text: 'Type here...',
        fontSize: selectedSize,
        color: selectedColor,
        fontFamily: selectedFont,
        isBold: selectedBold,
        isItalic: selectedItalic,
        pageNumber: targetPage,
      }
    ]);
  };

  const handleAddEraser = () => {
    setSelectedAnnotationId(null);
    setAnnotations([
      ...annotations,
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'whiteout',
        x: 50,
        y: 80,
        width: 100,
        height: 20,
        pageNumber: targetPage,
      }
    ]);
  };

  const handlePageClick = (e: React.MouseEvent, pageIndex: number) => {
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'input' || (e.target as HTMLElement).tagName.toLowerCase() === 'svg' || (e.target as HTMLElement).className.includes('whiteout-box')) {
      return;
    }
    
    setSelectedAnnotationId(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setAnnotations([
      ...annotations,
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'text',
        x,
        y,
        text: '', // Start empty
        fontSize: selectedSize,
        color: selectedColor,
        fontFamily: selectedFont,
        isBold: selectedBold,
        isItalic: selectedItalic,
        pageNumber: pageIndex,
      }
    ]);
  };

  const handleBlur = (id: string, text: string) => {
    if (text.trim() === '') {
      deleteAnnotation(id);
    }
  };

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setAnnotations(annotations.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveToCRM = async () => {
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/doc-api/documents/${doc.id}/versions/${doc.version}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save annotations');
      alert('Annotations saved successfully! You can download the baked PDF from the main view.');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
      alert(err.message);
    }
    setIsProcessing(false);
  };

  const fileOptions = React.useMemo(() => {
    if (!pdfUrl) return null;
    return {
      url: pdfUrl,
      withCredentials: true,
      httpHeaders: { Authorization: `Bearer ${localStorage.getItem('crm_token') || ''}` }
    };
  }, [pdfUrl]);

  if (!pdfUrl || !fileOptions) return <Box sx={{ p: 4, textAlign: 'center' }}>Loading PDF Editor...</Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <Box sx={{ p: 1, bgcolor: '#ffffff', borderBottom: '1px solid #ccc', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select size="small" value={selectedFont} onChange={(e: any) => handleFormatChange('fontFamily', e.target.value)}>
          <MenuItem value="Cambria">Cambria</MenuItem>
          <MenuItem value="Helvetica">Helvetica</MenuItem>
          <MenuItem value="Times Roman">Times Roman</MenuItem>
          <MenuItem value="Courier">Courier</MenuItem>
        </Select>
        
        <Select size="small" value={selectedSize} onChange={(e: any) => handleFormatChange('fontSize', Number(e.target.value))}>
          {[10, 12, 14, 16, 20, 24, 32].map(size => (
            <MenuItem key={size} value={size}>{size}px</MenuItem>
          ))}
        </Select>

        <ToggleButtonGroup size="small">
          <ToggleButton 
            value="bold" 
            selected={selectedBold} 
            onChange={() => handleFormatChange('isBold', !selectedBold)}
          >
            <FormatBoldIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton 
            value="italic" 
            selected={selectedItalic} 
            onChange={() => handleFormatChange('isItalic', !selectedItalic)}
          >
            <FormatItalicIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>

        <input 
          type="color" 
          value={selectedColor} 
          onChange={(e: any) => handleFormatChange('color', e.target.value)} 
          style={{ width: '40px', height: '40px', padding: '0', border: 'none', cursor: 'pointer' }}
        />
        
        <Select size="small" value={targetPage} onChange={(e: any) => setTargetPage(Number(e.target.value))}>
          {Array.from(new Array(numPages || 1), (el, index) => (
            <MenuItem key={index} value={index + 1}>Page {index + 1}</MenuItem>
          ))}
        </Select>

        <Button variant="contained" onClick={handleAddText} sx={{ bgcolor: '#0e2318' }}>
          Add Text
        </Button>
        <Button variant="contained" onClick={handleAddEraser} sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#9a0007' } }}>
          Eraser (Whiteout)
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        {errorMsg && <Box sx={{ color: 'red', mr: 2 }}>{errorMsg}</Box>}

        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSaveToCRM} 
          disabled={isProcessing}
          sx={{ bgcolor: '#c9a96e', '&:hover': { bgcolor: '#b89960' } }}
        >
          {isProcessing ? 'Saving...' : 'Save to CRM'}
        </Button>
      </Box>

      {/* Scrollable Document Area */}
      <Box sx={{ flexGrow: 1, bgcolor: '#e5e5e5', overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, gap: 4 }}>
        <Document
          file={fileOptions}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<CircularProgress />}
        >
          {Array.from(new Array(numPages || 0), (el, index) => {
            const pageIndex = index + 1;
            const pageAnnotations = annotations.filter(a => a.pageNumber === pageIndex);
            
            return (
              <Box 
                key={index} 
                className="page-container" 
                onClick={(e: any) => handlePageClick(e, pageIndex)}
                sx={{ 
                  mb: 4, 
                  position: 'relative', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  '&:hover .page-overlay': { opacity: 1 },
                  '& .whiteout-box': { border: '1px solid transparent !important' },
                  '& .whiteout-box:hover': { border: '1px dashed #ccc !important' }
                }}
              >
                <Page 
                  pageNumber={pageIndex} 
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={800} 
                />
                
                {pageAnnotations.map(ann => {
                  if (ann.type === 'whiteout') {
                    return (
                      <Rnd
                        key={ann.id}
                        className="whiteout-box"
                        size={{ width: ann.width || 100, height: ann.height || 20 }}
                        position={{ x: ann.x, y: ann.y }}
                        onDragStop={(e, d) => updateAnnotation(ann.id, { x: d.x, y: d.y })}
                        onResizeStop={(e, direction, ref, delta, position) => {
                          updateAnnotation(ann.id, {
                            width: parseFloat(ref.style.width),
                            height: parseFloat(ref.style.height),
                            ...position,
                          });
                        }}
                        bounds="parent"
                        style={{
                          backgroundColor: 'white',
                          zIndex: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <IconButton 
                          size="small" 
                          onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }} 
                          sx={{ opacity: 0, '&:hover': { opacity: 1 }, bgcolor: 'rgba(255,255,255,0.9)' }}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Rnd>
                    );
                  }

                  return (
                    <Draggable
                      key={ann.id}
                      position={{ x: ann.x, y: ann.y }}
                      onStop={(e, data) => updateAnnotation(ann.id, { x: data.x, y: data.y })}
                      bounds="parent"
                      cancel=".no-drag"
                    >
                    <Box sx={{ 
                      position: 'absolute', top: 0, left: 0, cursor: 'move', display: 'flex', alignItems: 'center',
                      zIndex: 20,
                      '& .action-btns': { display: 'none' },
                      '&:hover': {
                         '& .action-btns': { display: 'block' },
                         '& .text-input': { border: '1px dashed #aaa', background: 'rgba(255, 255, 255, 0.8)' }
                      }
                    }}>
                      <TextField
                        className="text-input no-drag"
                        variant="standard"
                        value={ann.text}
                        onChange={(e: any) => updateAnnotation(ann.id, { text: e.target.value })}
                        onFocus={() => {
                          setSelectedAnnotationId(ann.id);
                          setSelectedSize(ann.fontSize || 14);
                          setSelectedBold(!!ann.isBold);
                          setSelectedItalic(!!ann.isItalic);
                          setSelectedFont(ann.fontFamily || 'Cambria');
                          setSelectedColor(ann.color || '#000000');
                        }}
                        onBlur={(e: any) => {
                          handleBlur(ann.id, e.target.value);
                          // Do not clear selectedAnnotationId immediately so toolbar actions can access it
                        }}
                        autoFocus={ann.text === ''}
                        placeholder="Type..."
                        InputProps={{
                          disableUnderline: true,
                          style: {
                            padding: 0,
                            margin: 0,
                            background: 'transparent',
                            border: '1px solid transparent',
                            minWidth: '50px'
                          }
                        }}
                        inputProps={{
                          style: {
                            fontFamily: ann.fontFamily === 'Cambria' ? '"Cambria", serif' : ann.fontFamily,
                            fontSize: `${ann.fontSize}px`,
                            fontWeight: ann.isBold ? 'bold' : 'normal',
                            fontStyle: ann.isItalic ? 'italic' : 'normal',
                            color: ann.color,
                            padding: 0,
                            margin: 0,
                          }
                        }}
                      />
                      <Box className="action-btns" sx={{ ml: 0.5 }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }} sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Draggable>
                  );
                })}
              </Box>
            );
          })}
        </Document>
      </Box>
    </Box>
  );
}
