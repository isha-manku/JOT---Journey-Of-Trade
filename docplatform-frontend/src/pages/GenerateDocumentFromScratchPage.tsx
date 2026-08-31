import { useState } from "react";
import {
  Paper, Typography, Button, Box, CircularProgress, Alert, Stepper, Step, StepLabel, Stack
} from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import DynamicForm from "../components/DynamicForm";
import { docApi } from "../api";
import { DocumentSchema } from "../types";

const STEPS = ["Upload Template", "Fill Fields", "Download"];

export default function GenerateDocumentFromScratchPage() {
  const [activeStep, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [schema, setSchema] = useState<DocumentSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith(".docx")) {
        setError("Please select a .docx file");
        return;
      }
      
      setFile(selectedFile);
      setError("");
      setLoading(true);
      
      try {
        const response = await docApi.extractScratch(selectedFile);
        // Map the array of fields to the DocumentSchema format used by DynamicForm
        const mappedSchema: DocumentSchema = {
          id: 0,
          template_id: 0,
          version: 1,
          fields: response.schema.map((f: any, i: number) => ({
            id: i,
            key: f.key,
            label: f.label,
            field_type: f.type || "text",
            required: true,
            order: i,
            options: [],
          }))
        };
        
        if (mappedSchema.fields.length === 0) {
          setError("No placeholders found in the uploaded document. Ensure tags are formatted like {{field_name}}.");
          setFile(null);
        } else {
          setSchema(mappedSchema);
          setStep(1);
        }
      } catch (err: any) {
        setError(err?.response?.data?.error || err.message || "Failed to extract fields.");
        setFile(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGenerate = async (values: Record<string, unknown>) => {
    if (!file) return;
    setLoading(true);
    setError("");
    
    try {
      const blob = await docApi.generateScratch(file, values);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to generate document.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setFile(null);
    setSchema(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setError("");
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: "auto", mt: 4 }} elevation={1}>
      <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
        Generate Document from Scratch
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map(s => (
          <Step key={s}>
            <StepLabel>{s}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {activeStep === 0 && (
        <Box sx={{ textAlign: "center", py: 6, border: "2px dashed", borderColor: "divider", borderRadius: 2 }}>
          <input
            accept=".docx"
            style={{ display: "none" }}
            id="raised-button-file"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="raised-button-file">
            <Button
              variant="outlined"
              component="span"
              startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              disabled={loading}
              size="large"
            >
              Upload Word Document (.docx)
            </Button>
          </label>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Upload a Word document containing {"{{tags}}"} to create a form.
          </Typography>
        </Box>
      )}

      {activeStep === 1 && schema && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Please fill out all fields extracted from your template. Fields marked with * are required.
          </Alert>
          <DynamicForm
            schema={schema}
            submitLabel="Generate PDF"
            busy={loading}
            onSubmit={handleGenerate}
          />
          <Button sx={{ mt: 2 }} onClick={() => setStep(0)} disabled={loading}>
            Back
          </Button>
        </Box>
      )}

      {activeStep === 2 && pdfUrl && (
        <Stack spacing={3} alignItems="center" py={4}>
          <Alert severity="success" sx={{ width: "100%" }}>
            PDF Generated Successfully!
          </Alert>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              size="large"
              href={pdfUrl}
              download="generated_document.pdf"
            >
              Download PDF
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => window.open(pdfUrl, "_blank")}
            >
              Preview PDF
            </Button>
          </Stack>
          <Button onClick={reset} sx={{ mt: 2 }}>
            Start Over
          </Button>
        </Stack>
      )}
    </Paper>
  );
}
