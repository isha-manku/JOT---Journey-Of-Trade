import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, Container, ThemeProvider, Box, AppBar, Toolbar, Typography, Button } from "@mui/material";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import DocumentGenerationPage from "./pages/DocumentGenerationPage";
import GenerateDocumentFromScratchPage from "./pages/GenerateDocumentFromScratchPage";
import BuyersListPage from "./pages/BuyersListPage";
import BuyerProfileDocumentsPage from "./pages/BuyerProfileDocumentsPage";
import SellerProfileDocumentsPage from "./pages/SellerProfileDocumentsPage";
import crmTheme from "./theme";

const queryClient = new QueryClient();

function Navigation() {
  return null;
}

export default function App() {
  return (
    <ThemeProvider theme={crmTheme}>
      <QueryClientProvider client={queryClient}>
        <CssBaseline />
        <BrowserRouter basename="/docplatform">
          <Navigation />
          <Container>
            <Box pb={6}>
              <Routes>
                <Route path="/" element={<DocumentGenerationPage />} />
                <Route path="/generate-scratch" element={<GenerateDocumentFromScratchPage />} />
                <Route path="/buyers" element={<BuyersListPage />} />
                <Route path="/buyers/:buyerId/documents" element={<BuyerProfileDocumentsPage />} />
                <Route path="/sellers/:sellerId/documents" element={<SellerProfileDocumentsPage />} />
              </Routes>
            </Box>
          </Container>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
