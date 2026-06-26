import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Stack, Table, TableHead, TableRow, TableCell, TableBody,
  Accordion, AccordionSummary, AccordionDetails, Drawer, IconButton,
  CircularProgress, Alert, Divider, Grid, Tooltip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessIcon from "@mui/icons-material/Business";
import InventoryIcon from "@mui/icons-material/Inventory";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { sellerApi } from "../api";

export default function SellerProfileDocumentsPage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [previewDoc, setPreviewDoc] = useState<{ id: number, name: string, path: string } | null>(null);

  const profile = useQuery({
    queryKey: ["sellerProfile", sellerId],
    queryFn: () => sellerApi.profile(sellerId!),
    enabled: !!sellerId,
  });

  const handleDeleteDocument = async (doc: any) => {
    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;
    try {
      const res = await fetch(`http://localhost:5000/seller-documents/${doc.id}/delete`, { 
        method: "POST", 
        headers: { "Authorization": `Bearer ${localStorage.getItem("crm_token")}` } 
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Delete failed");
      
      profile.refetch();
    } catch (err: any) {
      alert("Error deleting document: " + err.message);
    }
  };

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
          Seller profile not found or failed to load.
        </Alert>
      </Box>
    );
  }

  const { seller, stats, companies } = profile.data;

  const StatCard = ({ label, count, icon }: { label: string, count: number, icon: React.ReactNode }) => (
    <Box sx={{ 
      p: 3, 
      bgcolor: '#ffffff', 
      borderRadius: 4,
      borderTop: '1px solid rgba(14, 35, 24, 0.05)',
      borderRight: '1px solid rgba(14, 35, 24, 0.05)',
      borderBottom: '1px solid rgba(14, 35, 24, 0.05)',
      borderLeft: '4px solid #0e2318', 
      boxShadow: '0px 10px 30px rgba(14, 35, 24, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0px 20px 40px rgba(14, 35, 24, 0.06)',
        borderColor: '#c9a96e',
        borderLeftColor: '#c9a96e',
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ 
          p: 1, 
          borderRadius: 2.5, 
          bgcolor: 'rgba(201, 169, 110, 0.1)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          {icon}
        </Box>
      </Box>
      <Box>
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#0e2318', mb: 0.5, lineHeight: 1, fontFamily: '"Playfair Display", serif' }}>
          {count}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );

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
          onClick={() => window.parent.postMessage({ action: "navigate", to: "/sellers" }, "*")}
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
          Back to Sellers
        </Button>
        <Typography variant="h5" sx={{ ml: 3, fontWeight: 700, color: '#ffffff', fontFamily: '"Playfair Display", serif' }}>
          Seller Profile &amp; Documents
        </Typography>
      </Box>

      {/* Seller Information Card (Full Width) */}
      <Box sx={{ 
        p: 4, 
        bgcolor: '#ffffff', 
        borderRadius: 4, 
        borderTop: '6px solid #c9a96e',
        boxShadow: '0px 10px 30px rgba(14, 35, 24, 0.03)',
        mb: 4
      }}>
        <Grid container spacing={3}>
          {/* Left Column: Seller Name & Company */}
          <Grid item xs={12} md={4} sx={{ borderRight: { md: '1px solid #E9ECEF' }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>
              Seller Profile
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#0e2318', fontFamily: '"Playfair Display", serif', mb: 1 }}>
              {seller.name || 'Unnamed Seller'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#c9a96e', fontWeight: 700, letterSpacing: 0.5 }}>
              Company: {seller.name || 'N/A'}
            </Typography>
          </Grid>
          
          {/* Middle Column: Details & Country */}
          <Grid item xs={12} md={4} sx={{ borderRight: { md: '1px solid #E9ECEF' }, pl: { md: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>
                  Seller Name
                </Typography>
                <Typography variant="body1" sx={{ color: '#0e2318', fontWeight: 600 }}>
                  {seller.name || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>
                  Country
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon sx={{ fontSize: 18, color: '#c9a96e' }} />
                  <Typography variant="body1" sx={{ color: '#0e2318', fontWeight: 600 }}>
                    {seller.country || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Grid>
          
          {/* Right Column: Contact Details */}
          <Grid item xs={12} md={4} sx={{ pl: { md: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>
                  Email Address
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MailOutlineIcon sx={{ fontSize: 18, color: '#c9a96e' }} />
                  <Typography variant="body1" sx={{ color: '#0e2318', fontWeight: 600 }}>
                    {seller.email || 'N/A'}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>
                  Phone Number
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 18, color: '#c9a96e' }} />
                  <Typography variant="body1" sx={{ color: '#0e2318', fontWeight: 600 }}>
                    {seller.phone || 'N/A'}
                  </Typography>
                </Box>
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
            This seller does not have any uploaded documents yet. Use the Sellers list to upload new files.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.parent.postMessage({ action: "navigate", to: "/sellers" }, "*")}
            sx={{ 
              px: 4, py: 1.5, borderRadius: 2, 
              bgcolor: '#0e2318', color: '#ffffff',
              boxShadow: '0px 4px 12px rgba(14, 35, 24, 0.15)',
              '&:hover': { bgcolor: '#c9a96e', color: '#ffffff' }
            }}
          >
            Go to Sellers List
          </Button>
        </Box>
      )}

      {/* Companies & Products Hierarchy */}
      {companies.map(company => (
        <Accordion 
          key={company.company_name} 
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
                key={product.product_name}
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
                          <TableCell sx={{ pl: 4, bgcolor: '#f1f3f5', color: '#495057', fontWeight: 700, borderBottom: '2px solid #dee2e6', py: 2 }}>Document Name</TableCell>
                          <TableCell sx={{ bgcolor: '#f1f3f5', color: '#495057', fontWeight: 700, borderBottom: '2px solid #dee2e6', py: 2 }}>Upload Date</TableCell>
                          <TableCell sx={{ bgcolor: '#f1f3f5', color: '#495057', fontWeight: 700, borderBottom: '2px solid #dee2e6', py: 2 }}>File Type</TableCell>
                          <TableCell sx={{ bgcolor: '#f1f3f5', color: '#495057', fontWeight: 700, borderBottom: '2px solid #dee2e6', py: 2 }}>Uploaded By</TableCell>
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
                            <TableCell sx={{ pl: 4, fontWeight: 700, color: '#0e2318' }}>
                              {doc.file_name}
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{new Date(doc.uploaded_at).toLocaleString()}</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>PDF</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{doc.uploaded_by ?? "—"}</TableCell>
                            <TableCell align="right" sx={{ pr: 4 }}>
                              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                                <Tooltip title="Preview Document" arrow>
                                  <IconButton 
                                    size="small"
                                    onClick={() => setPreviewDoc({ id: doc.id, name: doc.file_name, path: doc.file_path })}
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
                                
                                <Tooltip title="Download PDF" arrow>
                                  <IconButton 
                                    size="small"
                                    href={sellerApi.downloadUrl(doc.file_path)}
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

      {/* PDF Preview Drawer */}
      <Drawer
        anchor="right"
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        PaperProps={{
          sx: { 
            width: { xs: '100%', sm: '90%', md: '75%' },
            bgcolor: 'background.default'
          }
        }}
      >
        {previewDoc && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', bgcolor: '#ffffff' }}>
              <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: '#0e2318', fontFamily: '"Playfair Display", serif' }}>
                {previewDoc.name}
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <Button 
                  size="small" 
                  variant="outlined" 
                  startIcon={<DownloadIcon />}
                  href={sellerApi.downloadUrl(previewDoc.path)}
                  sx={{ color: '#0e2318', borderColor: '#0e2318', '&:hover': { bgcolor: '#0e2318', color: '#ffffff' } }}
                >
                  Download
                </Button>
                <Button 
                  size="small" 
                  variant="outlined" 
                  href={sellerApi.previewUrl(previewDoc.path)} 
                  target="_blank"
                  sx={{ color: '#c9a96e', borderColor: '#c9a96e', '&:hover': { bgcolor: '#c9a96e', color: '#ffffff' } }}
                >
                  Open in New Tab
                </Button>
                <IconButton onClick={() => setPreviewDoc(null)} sx={{ color: '#6c757d' }}><CloseIcon /></IconButton>
              </Stack>
            </Box>
            <Box sx={{ flexGrow: 1, bgcolor: '#e5e5e5' }}>
              <iframe 
                src={sellerApi.previewUrl(previewDoc.path)}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="PDF Preview"
              />
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
