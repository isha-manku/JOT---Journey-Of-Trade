import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Paper, Typography, Stack, TextField, Button, Table, TableHead, TableRow,
  TableCell, TableBody, Dialog, DialogTitle, DialogContent, Alert, IconButton, Tooltip,
} from "@mui/material";
import DynamicForm from "../components/DynamicForm";
import { docApi } from "../api";
import type { GeneratedDocument, DocumentVersion, DocumentSchema } from "../types";

export default function BuyerDocumentsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ buyer_id: "" });
  const [editing, setEditing] = useState<GeneratedDocument | null>(null);
  const [historyOf, setHistoryOf] = useState<GeneratedDocument | null>(null);

  const search = useQuery({
    queryKey: ["docsearch", filters],
    queryFn: () => docApi.search({ ...filters }),
  });

  return (
    <Paper sx={{ p: 4, maxWidth: 1000, mx: "auto", mt: 4 }} elevation={1}>
      <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>Recent Buyer Documents</Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: "center" }}>
        <TextField label="Search by Buyer ID..." value={filters.buyer_id}
          onChange={e => setFilters({ buyer_id: e.target.value })} size="small" sx={{ width: 300 }} />
        <Button variant="contained" onClick={() => search.refetch()}>Search</Button>
      </Stack>

      <Table size="medium">
        <TableHead>
          <TableRow>
            <TableCell>Doc #</TableCell><TableCell>Company</TableCell>
            <TableCell>Product</TableCell><TableCell>Type</TableCell>
            <TableCell>Ver</TableCell><TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(search.data?.items ?? []).map(d => (
            <TableRow key={d.id} hover>
              <TableCell sx={{ fontWeight: 500 }}>{d.document_number}</TableCell>
              <TableCell>{d.company}</TableCell>
              <TableCell>{d.product}</TableCell>
              <TableCell>{d.document_type}</TableCell>
              <TableCell>v{d.latest_version}</TableCell>
              <TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" color="primary" href={docApi.pdfUrl(d.id)} target="_blank">View</Button>
                  <Button size="small" variant="text" onClick={() => setEditing(d)}>Edit</Button>
                  <Button size="small" variant="text" onClick={() => setHistoryOf(d)}>History</Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editing && (
        <EditDialog doc={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["docsearch"] }); }} />
      )}
      {historyOf && (
        <HistoryDialog doc={historyOf} onClose={() => setHistoryOf(null)} />
      )}
    </Paper>
  );
}

/** Edit/Revise — loads latest version JSON into the dynamic form, saves a NEW version. */
function EditDialog({ doc, onClose, onSaved }:
  { doc: GeneratedDocument; onClose: () => void; onSaved: () => void }) {
  const latest = useQuery({ queryKey: ["latest", doc.id], queryFn: () => docApi.latest(doc.id) });
  // Re-fetch schema for this document's template via a generation-style schema call is not
  // available by document; instead we reconstruct fields from stored values keys using the
  // versions endpoint's schema. For simplicity we derive a schema from the latest values.
  const schema = useQuery({
    queryKey: ["docschema", doc.id],
    queryFn: async (): Promise<DocumentSchema> => {
      const v = await docApi.latest(doc.id);
      return {
        id: "derived", template_id: "", version: doc.latest_version,
        fields: Object.keys(v.form_values).map((k, i) => ({
          id: k, key: k, label: k.replace(/_/g, " "),
          field_type: "text", required: false, order: i,
        })),
      };
    },
  });

  const reviseM = useMutation({
    mutationFn: (form_values: Record<string, unknown>) =>
      docApi.revise({ document_id: doc.id, form_values }),
    onSuccess: onSaved,
  });

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Revise {doc.document_number}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Saving creates version {doc.latest_version + 1}. Prior versions are preserved.
        </Alert>
        {schema.data && latest.data && (
          <DynamicForm schema={schema.data} defaultValues={latest.data.form_values}
            submitLabel="Save Revision" busy={reviseM.isPending}
            onSubmit={(v) => reviseM.mutate(v)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Version history grid with per-version PDF view. */
function HistoryDialog({ doc, onClose }: { doc: GeneratedDocument; onClose: () => void }) {
  const versions = useQuery({
    queryKey: ["versions", doc.id], queryFn: () => docApi.versions(doc.id),
  });
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>History — {doc.document_number}</DialogTitle>
      <DialogContent>
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>Version</TableCell><TableCell>Created</TableCell>
              <TableCell>By</TableCell><TableCell>PDF</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {(versions.data ?? []).map((v: DocumentVersion) => (
              <TableRow key={v.id}>
                <TableCell>v{v.version}</TableCell>
                <TableCell>{new Date(v.created_at).toLocaleString()}</TableCell>
                <TableCell>{v.created_by ?? "—"}</TableCell>
                <TableCell>
                  <Button size="small" href={docApi.pdfUrl(doc.id, v.version)} target="_blank">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
