import { Box, Typography, Button, Stack, Drawer, IconButton } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import { docApi } from "../api";

export type PreviewDoc = {
  id: string;
  number: string;
  version?: number;
  is_manual?: boolean;
  file_path?: string;
};

interface PDFPreviewDrawerProps {
  previewDoc: PreviewDoc | null;
  onClose: () => void;
}

export default function PDFPreviewDrawer({ previewDoc, onClose }: PDFPreviewDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={!!previewDoc}
      onClose={onClose}
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
              {previewDoc.number} 
              {!previewDoc.is_manual && previewDoc.version && (
                <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}> (v{previewDoc.version})</Typography>
              )}
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={<DownloadIcon />}
                href={previewDoc.is_manual ? `http://localhost:5000/buyer-documents/download/${previewDoc.file_path?.split(/[\\\\/]/).pop()}` : docApi.pdfUrl(previewDoc.id, previewDoc.version, true)}
                sx={{ color: '#0e2318', borderColor: '#0e2318', '&:hover': { bgcolor: '#0e2318', color: '#ffffff' } }}
              >
                Download
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                href={previewDoc.is_manual ? `http://localhost:5000/uploads/buyer_documents/${previewDoc.file_path?.split(/[\\\\/]/).pop()}` : docApi.pdfUrl(previewDoc.id, previewDoc.version)} 
                target="_blank"
                sx={{ color: '#c9a96e', borderColor: '#c9a96e', '&:hover': { bgcolor: '#c9a96e', color: '#ffffff' } }}
              >
                Open in New Tab
              </Button>
              <IconButton onClick={onClose} sx={{ color: '#6c757d' }}><CloseIcon /></IconButton>
            </Stack>
          </Box>
          <Box sx={{ flexGrow: 1, bgcolor: '#e5e5e5' }}>
            <iframe 
              src={previewDoc.is_manual ? `http://localhost:5000/uploads/buyer_documents/${previewDoc.file_path?.split(/[\\\\/]/).pop()}` : docApi.pdfUrl(previewDoc.id, previewDoc.version)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="PDF Preview"
            />
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
