import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Paper, Typography, Stack, TextField, Button, Table, TableHead, TableRow,
  TableCell, TableBody, Box
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { refApi } from "../api";

export default function BuyersListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const search = useQuery({
    queryKey: ["buyers", searchQuery],
    queryFn: () => refApi.buyers(searchQuery),
  });

  return (
    <Paper sx={{ p: 4, maxWidth: 1000, mx: "auto", mt: 4 }} elevation={1}>
      <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 700, color: '#143524' }}>
        Buyer Profiles
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: "center" }}>
        <TextField 
          label="Search by Buyer ID or Name..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)} 
          size="small" 
          sx={{ width: 350 }} 
        />
        <Button variant="contained" onClick={() => search.refetch()}>Search</Button>
      </Stack>

      <Table size="medium">
        <TableHead>
          <TableRow>
            <TableCell>Display Name</TableCell>
            <TableCell>Buyer ID</TableCell>
            <TableCell align="center">Documents</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {search.isLoading && (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 4 }}>Loading buyers...</TableCell>
            </TableRow>
          )}
          {search.isError && (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'error.main' }}>
                Error loading buyers: {search.error?.message ?? "Unknown error"}
              </TableCell>
            </TableRow>
          )}
          {(search.data ?? []).map(b => (
            <TableRow key={b.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{b.display_name || '—'}</TableCell>
              <TableCell sx={{ color: 'text.secondary' }}>{b.crm_buyer_id}</TableCell>
              <TableCell align="center">
                <Box sx={{ 
                  display: 'inline-block', 
                  bgcolor: 'rgba(203, 160, 97, 0.15)', 
                  color: '#b3884d',
                  px: 1.5, py: 0.5, 
                  borderRadius: 4, 
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}>
                  {b.document_count}
                </Box>
              </TableCell>
              <TableCell align="right">
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => navigate(`/buyers/${b.crm_buyer_id}/documents`)}
                  disabled={b.document_count === 0}
                >
                  View Profile
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {search.isSuccess && search.data?.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No buyers found matching your search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}
