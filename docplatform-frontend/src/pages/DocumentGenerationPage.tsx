import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Paper, Stepper, Step, StepLabel, Box, Typography, Button, Alert, Stack, CircularProgress
} from "@mui/material";
import CascadingSelect from "../components/CascadingSelect";
import DynamicForm from "../components/DynamicForm";
import { docApi } from "../api";
import type { Selection, GeneratedDocument } from "../types";
import PDFPreviewDrawer, { PreviewDoc } from "../components/PDFPreviewDrawer";

const STEPS = ["Select", "Fill Form", "Generated"];

const getErrorMessage = (error: any) => {
  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => {
        const loc = d.loc?.filter((l: string) => l !== 'body').join('.') || '';
        return `${loc ? loc + ': ' : ''}${d.msg}`;
      }).join(', ');
    }
    return JSON.stringify(detail);
  }
  return error?.message || "Unknown error";
};

export default function DocumentGenerationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [activeStep, setStep] = useState(isEditMode ? 1 : 0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [result, setResult] = useState<GeneratedDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PreviewDoc | null>(null);

  // Queries for NEW documents
  const schemaQ = useQuery({
    queryKey: ["schema", selection],
    queryFn: () => docApi.schema(selection!),
    enabled: !!selection && !isEditMode,
  });

  // Queries for EDIT mode
  const editDocQ = useQuery({
    queryKey: ["editDoc", editId],
    queryFn: () => docApi.get(editId!),
    enabled: isEditMode,
  });

  const editSchemaQ = useQuery({
    queryKey: ["editSchema", editId],
    queryFn: () => docApi.schemaByDoc(editId!),
    enabled: isEditMode,
  });

  const editValuesQ = useQuery({
    queryKey: ["editValues", editId],
    queryFn: () => docApi.latest(editId!),
    enabled: isEditMode,
  });

  const genM = useMutation({
    mutationFn: (form_values: Record<string, unknown>) =>
      isEditMode
        ? docApi.revise({ document_id: editId!, form_values })
        : docApi.generate({ ...selection!, form_values }),
    onSuccess: (doc) => { 
      if (isEditMode) {
        navigate(-1);
      } else {
        setResult(doc); 
        setStep(2); 
      }
    },
  });

  const isLoadingEdit = editDocQ.isLoading || editSchemaQ.isLoading || editValuesQ.isLoading;

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: "auto", mt: 4 }} elevation={1}>
      {isEditMode ? (
        <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(25, 118, 210, 0.04)', border: '1px solid', borderColor: 'primary.light', borderRadius: 1 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            Editing Document
          </Typography>
          {editDocQ.data ? (
            <>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{editDocQ.data.document_number}</Typography>
              <Typography variant="body2" color="text.secondary">Current Version: v{editDocQ.data.latest_version}</Typography>
              <Typography variant="body2" color="primary.main" sx={{ mt: 1 }}>
                Saving changes will create Version v{editDocQ.data.latest_version + 1}
              </Typography>
            </>
          ) : (
             <Typography variant="body2">Loading document info...</Typography>
          )}
        </Box>
      ) : (
        <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>Generate Document</Typography>
      )}

      {!isEditMode && (
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
        </Stepper>
      )}

      {activeStep === 0 && !isEditMode && (
        <CascadingSelect onComplete={(s) => { setSelection(s); setStep(1); }} />
      )}

      {activeStep === 1 && (
        <Box>
          {isEditMode ? (
            <>
              {isLoadingEdit ? (
                 <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}><CircularProgress size={24}/> Loading document...</Box>
              ) : editSchemaQ.isError || editValuesQ.isError ? (
                 <Alert severity="error">Failed to load document for editing.</Alert>
              ) : editSchemaQ.data && editValuesQ.data && (
                <DynamicForm
                  schema={editSchemaQ.data}
                  defaultValues={editValuesQ.data.form_values}
                  submitLabel="Save Revision"
                  busy={genM.isPending}
                  onSubmit={(v) => genM.mutate(v)}
                />
              )}
              <Button sx={{ mt: 2 }} onClick={() => navigate(-1)}>Cancel</Button>
            </>
          ) : (
            <>
              {schemaQ.isLoading && <Typography>Loading schema…</Typography>}
              {schemaQ.data && (
                <DynamicForm
                  schema={schemaQ.data}
                  submitLabel="Generate Document"
                  busy={genM.isPending}
                  onSubmit={(v) => genM.mutate(v)}
                />
              )}
              <Button sx={{ mt: 2 }} onClick={() => setStep(0)}>Back</Button>
            </>
          )}
          {genM.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {isEditMode ? "Revision" : "Generation"} failed: {getErrorMessage(genM.error)}
            </Alert>
          )}
        </Box>
      )}

      {activeStep === 2 && result && !isEditMode && (
        <Stack spacing={2}>
          <Alert severity="success">
            Created {result.document_number} (v{result.latest_version})
          </Alert>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={() => setPreviewDoc({ id: result.id, number: result.document_number, version: result.latest_version })}>
              Preview Document
            </Button>
            <Button variant="outlined" href={docApi.pdfUrl(result.id, result.latest_version)} target="_blank">
              Open in New Tab
            </Button>
            <Button variant="outlined" href={docApi.pdfUrl(result.id, result.latest_version, true)}>
              Download PDF
            </Button>
            <Button onClick={() => { setStep(0); setSelection(null); setResult(null); }}>
              New Document
            </Button>
          </Stack>
        </Stack>
      )}

      <PDFPreviewDrawer previewDoc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </Paper>
  );
}
