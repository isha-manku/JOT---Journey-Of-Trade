import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box, Typography, Button, Stack, Table, TableHead, TableRow, TableCell, TableBody,
  Accordion, AccordionSummary, AccordionDetails, Drawer, IconButton,
  Dialog, DialogTitle, DialogContent, CircularProgress, Alert, Divider,
  Grid, Tooltip, Menu, MenuItem
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessIcon from "@mui/icons-material/Business";
import InventoryIcon from "@mui/icons-material/Inventory";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { docApi } from "../api";
import type { BuyerDocumentItem, DocumentVersion } from "../types";
import PDFPreviewDrawer, { PreviewDoc } from "../components/PDFPreviewDrawer";

export default function BuyerProfileDocumentsPage() {
  const { buyerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const source = searchParams.get('source');
  const isRecycleBin = source === 'recycle-bin';
  const [previewDoc, setPreviewDoc] = useState<PreviewDoc | null>(null);
  const [historyDoc, setHistoryDoc] = useState<{ id: string, number: string } | null>(null);

  const [previewMenuAnchor, setPreviewMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<any>(null);

  const handlePreviewMenuOpen = (e: React.MouseEvent<HTMLElement>, doc: any) => {
    if (doc.is_manual) {
      setPreviewDoc({ 
        id: doc.id, 
        number: doc.document_number, 
        version: doc.latest_version, 
        is_manual: doc.is_manual, 
        file_path: doc.file_path,
        language: 'en'
      });
    } else {
      setPreviewMenuAnchor(e.currentTarget);
      setSelectedDocForPreview(doc);
    }
  };

  const handlePreviewMenuClose = () => {
    setPreviewMenuAnchor(null);
    setSelectedDocForPreview(null);
  };

  const handlePreviewSelect = (language: 'en' | 'zh') => {
    if (selectedDocForPreview) {
      setPreviewDoc({ 
        id: selectedDocForPreview.id, 
        number: selectedDocForPreview.document_number, 
        version: selectedDocForPreview.latest_version, 
        is_manual: selectedDocForPreview.is_manual, 
        file_path: selectedDocForPreview.file_path,
        language
      });
    }
    handlePreviewMenuClose();
  };

  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedDocForDownload, setSelectedDocForDownload] = useState<any>(null);

  const handleDownloadMenuOpen = (e: React.MouseEvent<HTMLElement>, doc: any) => {
    setDownloadMenuAnchor(e.currentTarget);
    setSelectedDocForDownload(doc);
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
    setSelectedDocForDownload(null);
  };

  const handleDownloadSelect = (language: 'en' | 'zh') => {
    if (selectedDocForDownload) {
      window.location.href = docApi.pdfUrl(
        selectedDocForDownload.id, 
        selectedDocForDownload.latest_version, 
        true, 
        language
      );
    }
    handleDownloadMenuClose();
  };

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploadConfig, setUploadConfig] = useState({ company_name: '', product_name: '', document_type: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const pdfs = files.filter(f => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf");
    if (pdfs.length !== files.length) {
      setUploadError("Only PDF files are allowed.");
    } else {
      setUploadError("");
    }
    setFilesToUpload([...filesToUpload, ...pdfs]);
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...filesToUpload];
    newFiles.splice(index, 1);
    setFilesToUpload(newFiles);
  };

  const submitUpload = async () => {
    if (filesToUpload.length === 0) {
      setUploadError("Please select at least one PDF file.");
      return;
    }
    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("buyer_id", buyerId || "");
    if (uploadConfig.company_name) formData.append("company_name", uploadConfig.company_name);
    if (uploadConfig.product_name) formData.append("product_name", uploadConfig.product_name);
    if (uploadConfig.document_type) formData.append("document_type", uploadConfig.document_type);
    formData.append("uploaded_by", "DocPlatform User");

    filesToUpload.forEach(f => {
      formData.append("files", f);
    });

    try {
      const response = await fetch("http://localhost:5000/buyer-documents/upload", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (!data.success) {
        setUploadError(data.errors ? data.errors.map((e: any) => e.error || e).join(", ") : data.message);
      } else {
        setUploadModalOpen(false);
        setFilesToUpload([]);
        setUploadConfig({ company_name: '', product_name: '', document_type: '' });
        profile.refetch();
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: any) => {
    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;
    try {
      if (doc.is_manual) {
        await docApi.deleteBuyerDocument(doc.id);
      } else {
        await docApi.deleteGeneratedDocument(doc.id);
      }
      profile.refetch();
    } catch (err: any) {
      alert("Error deleting document: " + (err.response?.data?.error || err.message));
    }
  };

  const profile = useQuery({
    queryKey: ["buyerProfile", buyerId],
    queryFn: () => docApi.buyerProfile(buyerId!),
    enabled: !!buyerId,
  });

  if (profile.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 8 }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 3 }}>
          Buyer profile not found or failed to load.
        </Alert>
      </Box>
    );
  }

  const { buyer, stats, companies } = profile.data;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", pt: 2, pb: 6 }}>
      
      {/* Header Bar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        bgcolor: '#0e2318', 
        color: '#ffffff',
        p: 2, 
        borderRadius: '12px 12px 12px 12px',
        mb: 4
      }}>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            const targetPath = isRecycleBin ? "/buyers/recycle-bin" : "/buyers";
            if (window.parent !== window) {
              window.parent.postMessage({ action: "navigate", to: targetPath }, "*");
            } else {
              navigate(targetPath);
            }
          }}
          sx={{ 
            bgcolor: '#c9a96e', 
            color: '#0e2318', 
            fontWeight: 700, 
            borderRadius: '8px',
            px: 2.5,
            py: 1,
            textTransform: 'none',
            '&:hover': { bgcolor: '#b38e4a' } 
          }}
        >
          {isRecycleBin ? 'Back to Recycle Bin' : 'Back to Buyers'}
        </Button>
        <Typography variant="h5" sx={{ ml: 3, flexGrow: 1, fontWeight: 700, color: '#ffffff', fontFamily: '"Playfair Display", serif' }}>
          Buyer Profile &amp; Documents
        </Typography>
        <Stack direction="column" spacing={1}>
          <Button
            variant="contained"
            startIcon={<FolderOpenIcon />}
            onClick={() => setUploadModalOpen(true)}
            sx={{ 
              bgcolor: '#c9a96e', 
              color: '#0e2318', 
              fontWeight: 700, 
              borderRadius: '8px',
              px: 2.5,
              py: 1,
              textTransform: 'none',
              '&:hover': { bgcolor: '#b38e4a' } 
            }}
          >
            Upload Document
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/', { state: { prefillBuyer: profile.data.buyer } })}
            sx={{ 
              color: '#c9a96e', 
              borderColor: '#c9a96e',
              fontWeight: 700, 
              borderRadius: '8px',
              px: 2.5,
              py: 1,
              textTransform: 'none',
              '&:hover': { borderColor: '#b38e4a', color: '#b38e4a', bgcolor: 'rgba(201, 169, 110, 0.08)' } 
            }}
          >
            Generate Document
          </Button>
        </Stack>
      </Box>

      {/* Buyer Information Card (Full Width) */}
      <Box sx={{ 
        p: 4, 
        bgcolor: '#ffffff', 
        borderRadius: 4, 
        borderTop: '6px solid #c9a96e',
        boxShadow: '0px 10px 30px rgba(14, 35, 24, 0.03)',
        mb: 4
      }}>
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={4} sx={{ borderRight: { md: '1px solid #E9ECEF' }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#c9a96e', fontFamily: '"Playfair Display", serif', mb: 1 }}>
              {buyer.buyer_name || 'Tejpreet'}
            </Typography>
            <Typography variant="h6" sx={{ color: '#0e2318', fontWeight: 700 }}>
              {buyer.company_name || 'Ronsons Trading'}
            </Typography>
          </Grid>
          
          {/* Middle Column */}
          <Grid item xs={12} md={4} sx={{ borderRight: { md: '1px solid #E9ECEF' }, pl: { md: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1 }}>
              Buyer Details
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1 }}>
              Contact Number
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              E-mail: @{buyer.company_name || 'Ronsons Trading'}
            </Typography>
          </Grid>
          
          {/* Right Column */}
          <Grid item xs={12} md={4} sx={{ pl: { md: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PhoneIcon sx={{ fontSize: 18, color: '#0e2318' }} />
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  {buyer.phone || '+91 123 45 7890'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <MailOutlineIcon sx={{ fontSize: 18, color: '#0e2318' }} />
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  {buyer.email || 'tejpreet@gmail.com'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocationOnIcon sx={{ fontSize: 18, color: '#0e2318' }} />
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  {buyer.country || 'www.ronsonstrading.com'}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Box>
      
      {/* Statistics Cards Row */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={4}>
          <Box sx={{ 
            p: 3, 
            bgcolor: '#ffffff', 
            borderRadius: 4,
            borderTop: '6px solid #c9a96e',
            boxShadow: '0px 10px 30px rgba(14, 35, 24, 0.03)',
            height: '100%',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0px 20px 40px rgba(14, 35, 24, 0.06)',
            }
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
              Companies
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: '"DM Sans", sans-serif' }}>
              {stats.total_companies}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Box sx={{ 
            p: 3, 
            bgcolor: '#ffffff', 
            borderRadius: 4,
            borderTop: '6px solid #c9a96e',
            boxShadow: '0px 10px 30px rgba(14, 35, 24, 0.03)',
            height: '100%',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0px 20px 40px rgba(14, 35, 24, 0.06)',
            }
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
              Products
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: '"DM Sans", sans-serif' }}>
              {stats.total_products}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Box sx={{ 
            p: 3, 
            bgcolor: '#ffffff', 
            borderRadius: 4,
            borderTop: '6px solid #c9a96e',
            boxShadow: '0px 10px 30px rgba(14, 35, 24, 0.03)',
            height: '100%',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0px 20px 40px rgba(14, 35, 24, 0.06)',
            }
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
              Documents
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: '"DM Sans", sans-serif' }}>
              {stats.total_documents}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Empty State */}
      {companies.length === 0 && (
        <Box sx={{ 
          p: 8, textAlign: 'center', 
          bgcolor: '#ffffff', 
          borderRadius: 4,
          border: '1px solid rgba(14, 35, 24, 0.06)',
          boxShadow: '0px 10px 30px rgba(14, 35, 24, 0.03)',
          maxWidth: 600,
          mx: 'auto',
          mt: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Box sx={{ 
            p: 2.5, borderRadius: '50%', bgcolor: 'rgba(201, 169, 110, 0.1)', mb: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FolderOpenIcon sx={{ fontSize: 48, color: '#c9a96e' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0e2318', mb: 1, fontFamily: '"Playfair Display", serif' }}>
            No Documents Found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, maxWidth: 400 }}>
            This buyer does not have any generated documents yet.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button 
              variant="contained" 
              onClick={() => navigate('/', { state: { prefillBuyer: profile.data.buyer } })}
              sx={{ 
                px: 4, py: 1.5, borderRadius: 2, 
                bgcolor: '#0e2318', color: '#ffffff',
                boxShadow: '0px 4px 12px rgba(14, 35, 24, 0.15)',
                '&:hover': { bgcolor: '#c9a96e', color: '#ffffff' },
                fontWeight: 600
              }}
            >
              Generate Document
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => setUploadModalOpen(true)}
              sx={{ 
                px: 4, py: 1.5, borderRadius: 2, 
                color: '#0e2318', borderColor: '#0e2318',
                '&:hover': { bgcolor: '#0e2318', color: '#ffffff' },
                fontWeight: 600
              }}
            >
              Upload Document
            </Button>
          </Stack>
        </Box>
      )}

      {/* Companies & Products Hierarchy */}
      {companies.map(company => (
        <Accordion 
          key={company.company_code} 
          defaultExpanded={true}
          sx={{ 
            mb: 4, 
            bgcolor: '#ffffff', 
            border: '1px solid rgba(14, 35, 24, 0.08)',
            boxShadow: '0px 10px 30px rgba(14, 35, 24, 0.03)',
            borderRadius: '16px !important',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: '0px 20px 40px rgba(14, 35, 24, 0.06)',
            },
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={{ color: '#ffffff', fontSize: 28 }} />} 
            sx={{ 
              bgcolor: '#0e2318', 
              color: '#ffffff',
              px: 4,
              py: 1.5,
              '& .MuiAccordionSummary-content': {
                display: 'flex',
                flexDirection: 'column',
                my: '8px !important'
              }
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff', fontFamily: '"Playfair Display", serif', letterSpacing: 0.5 }}>
              {company.company_name}
            </Typography>
            <Box sx={{ 
              width: '100%', 
              height: '1px', 
              bgcolor: 'rgba(255, 255, 255, 0.15)', 
              my: 1 
            }} />
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
              Products and Documents
            </Typography>
          </AccordionSummary>
          
          {/* Thick gold accent line right below the header */}
          <Box sx={{ height: 8, bgcolor: '#c9a96e', width: '100%' }} />
          
          <AccordionDetails sx={{ p: 4, bgcolor: '#fafafa' }}>
            {company.products.map(product => (
              <Accordion 
                key={product.product_code}
                defaultExpanded={true}
                sx={{ 
                  mb: 3, 
                  bgcolor: '#ffffff', 
                  borderRadius: '12px !important',
                  boxShadow: 'none',
                  border: '1px solid rgba(14, 35, 24, 0.06)',
                  overflow: 'hidden',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: '#0e2318' }} />} 
                  sx={{ 
                    px: 3,
                    py: 2,
                    borderBottom: '1px solid rgba(14, 35, 24, 0.05)',
                    '&:hover': { bgcolor: 'rgba(14, 35, 24, 0.01)' }
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0e2318', fontFamily: '"Playfair Display", serif', m: 0 }}>
                    {product.product_name}
                  </Typography>
                  <Box sx={{ ml: 'auto', mr: 2, bgcolor: '#c9a96e', px: 1.5, py: 0.5, borderRadius: 2, boxShadow: '0 2px 8px rgba(201, 169, 110, 0.2)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#ffffff' }}>
                      {product.documents.length} {product.documents.length === 1 ? 'document' : 'documents'}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="medium" sx={{ minWidth: 600 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ pl: 4, bgcolor: '#f1f3f5', color: '#495057', fontWeight: 700, borderBottom: '2px solid #dee2e6', py: 2 }}>Document Number</TableCell>
                          <TableCell sx={{ bgcolor: '#f1f3f5', color: '#495057', fontWeight: 700, borderBottom: '2px solid #dee2e6', py: 2 }}>Type</TableCell>
                          <TableCell sx={{ bgcolor: '#f1f3f5', color: '#495057', fontWeight: 700, borderBottom: '2px solid #dee2e6', py: 2 }}>Version</TableCell>
                          <TableCell sx={{ bgcolor: '#f1f3f5', color: '#495057', fontWeight: 700, borderBottom: '2px solid #dee2e6', py: 2 }}>Created Date</TableCell>
                          <TableCell align="right" sx={{ pr: 4, bgcolor: '#f1f3f5', color: '#495057', fontWeight: 700, borderBottom: '2px solid #dee2e6', py: 2 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {product.documents.map((doc, idx) => (
                          <TableRow 
                            key={doc.id}
                            sx={{ 
                              bgcolor: idx % 2 === 0 ? '#ffffff' : '#faf9f6',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': { 
                                bgcolor: 'rgba(201, 169, 110, 0.08)',
                              }
                            }}
                          >
                            <TableCell sx={{ pl: 4, fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem', color: '#0e2318' }}>
                              {doc.document_number}
                              {doc.is_manual && (
                                <Box component="span" sx={{ ml: 2, bgcolor: '#dcc499', color: '#0e2318', px: 1, py: 0.5, borderRadius: 1, fontSize: '0.7rem', verticalAlign: 'middle', fontWeight: 700 }}>
                                  Manual Upload
                                </Box>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{doc.document_type}</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{doc.is_manual ? '-' : `v${doc.latest_version}`}</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                            <TableCell align="right" sx={{ pr: 4 }}>
                              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                                <Tooltip title="Preview Document" arrow>
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => handlePreviewMenuOpen(e, doc)}
                                    sx={{ 
                                      width: 36, height: 36, borderRadius: 2,
                                      color: '#0e2318', 
                                      bgcolor: '#dcc499', 
                                      transition: 'all 0.2s ease-in-out',
                                      '&:hover': { bgcolor: '#c9a96e', color: '#ffffff', transform: 'scale(1.1)' }
                                    }}
                                  >
                                    <VisibilityIcon fontSize="small"/>
                                  </IconButton>
                                </Tooltip>
                                
                                {!doc.is_manual && (
                                  <Tooltip title="Edit Document" arrow>
                                    <IconButton 
                                      size="small"
                                      onClick={() => navigate(`/?edit=${doc.id}`)}
                                      sx={{ 
                                        width: 36, height: 36, borderRadius: 2,
                                        color: '#0e2318', 
                                        bgcolor: '#dcc499', 
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': { bgcolor: '#c9a96e', color: '#ffffff', transform: 'scale(1.1)' }
                                      }}
                                    >
                                      <EditIcon fontSize="small"/>
                                    </IconButton>
                                  </Tooltip>
                                )}
                                
                                <Tooltip title="Download PDF" arrow>
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => {
                                      if (doc.is_manual) {
                                        window.location.href = `http://localhost:5000/buyer-documents/download/${doc.file_path?.split(/[\\\\/]/).pop()}`;
                                      } else {
                                        handleDownloadMenuOpen(e, doc);
                                      }
                                    }}
                                    sx={{ 
                                      width: 36, height: 36, borderRadius: 2,
                                      color: '#0e2318', 
                                      bgcolor: '#dcc499', 
                                      transition: 'all 0.2s ease-in-out',
                                      '&:hover': { bgcolor: '#c9a96e', color: '#ffffff', transform: 'scale(1.1)' }
                                    }}
                                  >
                                    <DownloadIcon fontSize="small"/>
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Delete Document" arrow>
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc); }}
                                    sx={{ 
                                      width: 36, height: 36, borderRadius: 2,
                                      color: '#d32f2f', 
                                      '&:hover': { bgcolor: '#ffebee', transform: 'scale(1.1)' }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small"/>
                                  </IconButton>
                                </Tooltip>
                                
                                {!doc.is_manual && (
                                  <Tooltip title="Version History" arrow>
                                    <IconButton 
                                      size="small"
                                      onClick={() => setHistoryDoc({ id: doc.id, number: doc.document_number })}
                                      sx={{ 
                                        width: 36, height: 36, borderRadius: 2,
                                        color: '#0e2318', 
                                        bgcolor: '#dcc499', 
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': { bgcolor: '#c9a96e', color: '#ffffff', transform: 'scale(1.1)' }
                                      }}
                                    >
                                      <HistoryIcon fontSize="small"/>
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Language Selection Menu for Document Preview */}
      <Menu
        anchorEl={previewMenuAnchor}
        open={Boolean(previewMenuAnchor)}
        onClose={handlePreviewMenuClose}
        PaperProps={{
          sx: { mt: 1, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: 2 }
        }}
      >
        <MenuItem onClick={() => handlePreviewSelect('en')} sx={{ fontWeight: 600 }}>
          English
        </MenuItem>
        <MenuItem onClick={() => handlePreviewSelect('zh')} sx={{ fontWeight: 600, color: '#c9a96e' }}>
          Chinese (Bilingual)
        </MenuItem>
      </Menu>

      {/* Language Selection Menu for Download */}
      <Menu
        anchorEl={downloadMenuAnchor}
        open={Boolean(downloadMenuAnchor)}
        onClose={handleDownloadMenuClose}
        PaperProps={{
          sx: { mt: 1, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: 2 }
        }}
      >
        <MenuItem onClick={() => handleDownloadSelect('en')} sx={{ fontWeight: 600 }}>
          Download English
        </MenuItem>
        <MenuItem onClick={() => handleDownloadSelect('zh')} sx={{ fontWeight: 600, color: '#c9a96e' }}>
          Download Chinese (Bilingual)
        </MenuItem>
      </Menu>

      {/* PDF Preview Drawer */}
      <PDFPreviewDrawer previewDoc={previewDoc} onClose={() => setPreviewDoc(null)} />

      {/* History Dialog */}
      {historyDoc && (
        <HistoryDialog 
          doc={historyDoc} 
          onClose={() => setHistoryDoc(null)} 
          onPreview={(v) => setPreviewDoc({ id: historyDoc.id, number: historyDoc.number, version: v })}
        />
      )}

      {/* Upload Document Modal */}
      <Dialog open={uploadModalOpen} onClose={() => !uploading && setUploadModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2, pt: 3, px: 3, fontWeight: 700, color: '#0e2318', fontFamily: '"Playfair Display", serif', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Upload Documents
          <IconButton onClick={() => setUploadModalOpen(false)} disabled={uploading} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 3 }}>{uploadError}</Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Categorization (Optional)</Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Supplier Company</Typography>
                <Box component="input" value={uploadConfig.company_name} onChange={(e: any) => setUploadConfig({...uploadConfig, company_name: e.target.value})} sx={{ width: '100%', p: 1, border: '1px solid #ccc', borderRadius: 1 }} placeholder="e.g. Global Suppliers Inc." />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Product</Typography>
                <Box component="input" value={uploadConfig.product_name} onChange={(e: any) => setUploadConfig({...uploadConfig, product_name: e.target.value})} sx={{ width: '100%', p: 1, border: '1px solid #ccc', borderRadius: 1 }} placeholder="e.g. Premium Widget" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Document Type</Typography>
                <Box component="input" value={uploadConfig.document_type} onChange={(e: any) => setUploadConfig({...uploadConfig, document_type: e.target.value})} sx={{ width: '100%', p: 1, border: '1px solid #ccc', borderRadius: 1 }} placeholder="e.g. Sales Contract" />
              </Box>
            </Stack>
          </Box>

          <Box sx={{ border: "2px dashed #ccc", borderRadius: "8px", p: 4, textAlign: "center", bgcolor: "#fafafa", mb: 2 }}>
            <FolderOpenIcon sx={{ fontSize: 32, color: "#aaa", mb: 1 }} />
            <Typography variant="body2" sx={{ color: "#555", mb: 2 }}>Drag and drop PDF files here or click to browse.</Typography>
            <input type="file" multiple accept=".pdf,application/pdf" onChange={handleFileChange} style={{ display: "none" }} id="buyer-file-upload-docplatform" />
            <Box component="label" htmlFor="buyer-file-upload-docplatform" sx={{ bgcolor: "#0e2318", color: "#c9a96e", px: 2, py: 1, borderRadius: 1, cursor: "pointer", display: "inline-block", fontWeight: 700, fontSize: "0.9rem" }}>
              Select PDF Files
            </Box>
          </Box>
          
          {filesToUpload.length > 0 && (
            <Stack spacing={1}>
              {filesToUpload.map((f, i) => (
                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, bgcolor: "#f1f3f5", borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <DescriptionIcon sx={{ color: '#c9a96e', fontSize: 18 }} /> {f.name}
                  </Typography>
                  <IconButton size="small" onClick={() => handleRemoveFile(i)} color="error"><CloseIcon fontSize="small" /></IconButton>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1, bgcolor: '#f8f9fa' }}>
          <Button onClick={() => setUploadModalOpen(false)} disabled={uploading} color="inherit">Cancel</Button>
          <Button onClick={submitUpload} disabled={uploading} variant="contained" sx={{ bgcolor: '#c9a96e', color: '#0e2318', '&:hover': { bgcolor: '#b38e4a' } }}>
            {uploading ? "Uploading..." : "Upload Files"}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}

function HistoryDialog({ doc, onClose, onPreview }: { doc: {id: string, number: string}; onClose: () => void; onPreview: (version: number) => void }) {
  const versions = useQuery({
    queryKey: ["versions", doc.id], 
    queryFn: () => docApi.versions(doc.id),
  });

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2, pt: 3, px: 3, fontWeight: 700, color: '#0e2318', fontFamily: '"Playfair Display", serif' }}>
        Version History — {doc.number}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#faf9f6' }}>
              <TableCell sx={{ pl: 3, fontWeight: 700, color: 'text.secondary' }}>Version</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Created Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Created By</TableCell>
              <TableCell align="right" sx={{ pr: 3, fontWeight: 700, color: 'text.secondary' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(versions.data ?? []).map((v: DocumentVersion) => (
              <TableRow key={v.id} hover>
                <TableCell sx={{ pl: 3, fontWeight: 700, color: '#0e2318' }}>v{v.version}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{new Date(v.created_at).toLocaleString()}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{v.created_by ?? "—"}</TableCell>
                <TableCell align="right" sx={{ pr: 3 }}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button 
                      size="small" 
                      variant="text"
                      onClick={() => { onClose(); onPreview(v.version); }}
                      sx={{ color: '#0e2318', '&:hover': { color: '#c9a96e' } }}
                    >
                      Preview
                    </Button>
                    <Button 
                      size="small" 
                      variant="text"
                      href={docApi.pdfUrl(doc.id, v.version, true)}
                      sx={{ color: '#c9a96e', '&:hover': { color: '#0e2318' } }}
                    >
                      Download
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {versions.isLoading && (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={24} color="primary" /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
