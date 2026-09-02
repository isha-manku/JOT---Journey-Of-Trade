import { useState, useEffect } from "react";
import {
  Paper, Typography, Button, Box, CircularProgress, Alert, Stepper, Step, StepLabel, Stack,
  Select, MenuItem, FormControl, InputLabel, TextField, Checkbox, FormControlLabel, Divider
} from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import DynamicForm from "../components/DynamicForm";
import { docApi, templateApi, refApi } from "../api";
import { DocumentSchema } from "../types";

const STEPS = ["Upload Template", "Fill Fields", "Download"];

export default function GenerateDocumentFromScratchPage() {
  const [activeStep, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [schema, setSchema] = useState<DocumentSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: "", company_name: "", product_name: "", document_type_name: "" });

  const [buyers, setBuyers] = useState<any[]>([]);
  const [selectedBuyerForSave, setSelectedBuyerForSave] = useState<string>("");
  const [savingToBuyer, setSavingToBuyer] = useState(false);
  const [saveToBuyerSuccess, setSaveToBuyerSuccess] = useState("");

  useEffect(() => {
    templateApi.list().then(data => {
      if (Array.isArray(data)) {
        setTemplates(data.filter(t => t.is_active));
      }
    }).catch(console.error);

    refApi.buyers().then(data => {
      if (Array.isArray(data)) {
        setBuyers(data);
      }
    }).catch(console.error);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith(".docx")) {
        setError("Please select a .docx file");
        return;
      }
      
      setFile(selectedFile);
      setError("");
    }
  };

  const processFile = async (fileToProcess: File) => {
    setLoading(true);
    setError("");
    
    try {
      if (saveTemplate && saveForm.name && saveForm.company_name && saveForm.product_name && saveForm.document_type_name) {
        const res = await templateApi.create(saveForm);
        const newTemplateId = res.id || (res.template && res.template.id);
        if (newTemplateId) {
          await templateApi.uploadDocx(newTemplateId, fileToProcess);
        }
      }

      const response = await docApi.extractScratch(fileToProcess);
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
      setError(err?.response?.data?.error || err.message || "Failed to process template.");
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUseExisting = async () => {
    if (!selectedTemplateId) return;
    setLoading(true);
    setError("");
    try {
      const blob = await templateApi.downloadDocx(selectedTemplateId);
      const downloadedFile = new File([blob], "template.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      setFile(downloadedFile);
      await processFile(downloadedFile);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to download template.");
      setLoading(false);
    }
  };

  const handleUploadNew = async () => {
    if (!file) {
      setError("Please select a .docx file first.");
      return;
    }
    if (saveTemplate && (!saveForm.name || !saveForm.company_name || !saveForm.product_name || !saveForm.document_type_name)) {
      setError("Please fill in all template details to save.");
      return;
    }
    await processFile(file);
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
    setSelectedBuyerForSave("");
    setSaveToBuyerSuccess("");
  };

  const handleSaveToBuyer = async () => {
    if (!selectedBuyerForSave || !pdfUrl) return;
    setSavingToBuyer(true);
    setSaveToBuyerSuccess("");
    setError("");

    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const fileToSave = new File([blob], "generated_document.pdf", { type: "application/pdf" });

      await docApi.uploadBuyerDocument(selectedBuyerForSave, fileToSave, "generated_document.pdf");
      setSaveToBuyerSuccess("Document successfully saved to buyer's profile!");
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to save document to buyer.");
    } finally {
      setSavingToBuyer(false);
    }
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
        <Stack spacing={4}>
          <Box sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Option 1: Use Existing Template</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl fullWidth size="small">
                <InputLabel>Select Template</InputLabel>
                <Select
                  value={selectedTemplateId}
                  label="Select Template"
                  onChange={e => setSelectedTemplateId(e.target.value)}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {templates.map(t => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name} ({t.company_name} - {t.document_type_name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                variant="contained" 
                onClick={handleUseExisting} 
                disabled={!selectedTemplateId || loading}
              >
                {loading && selectedTemplateId ? <CircularProgress size={24} /> : "Use Template"}
              </Button>
            </Stack>
          </Box>

          <Divider>OR</Divider>

          <Box sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 2, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>Option 2: Upload New Template</Typography>
            <Box sx={{ py: 3 }}>
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
                  startIcon={<CloudUploadIcon />}
                  disabled={loading}
                  size="large"
                >
                  {file ? file.name : "Select Word Document (.docx)"}
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Upload a Word document containing {"{{tags}}"} to create a form.
              </Typography>
            </Box>

            <Box sx={{ textAlign: "left", mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={saveTemplate} 
                    onChange={e => setSaveTemplate(e.target.checked)} 
                    disabled={loading}
                  />
                }
                label="Save template for future use"
              />
              {saveTemplate && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <TextField 
                    size="small" label="Template Name" required
                    value={saveForm.name} onChange={e => setSaveForm({...saveForm, name: e.target.value})}
                  />
                  <TextField 
                    size="small" label="Company Name" required
                    value={saveForm.company_name} onChange={e => setSaveForm({...saveForm, company_name: e.target.value})}
                  />
                  <TextField 
                    size="small" label="Product Name" required
                    value={saveForm.product_name} onChange={e => setSaveForm({...saveForm, product_name: e.target.value})}
                  />
                  <TextField 
                    size="small" label="Document Type" required
                    value={saveForm.document_type_name} onChange={e => setSaveForm({...saveForm, document_type_name: e.target.value})}
                  />
                </Stack>
              )}
            </Box>

            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 3 }} 
              onClick={handleUploadNew}
              disabled={!file || loading}
            >
              {loading && !selectedTemplateId ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
              Process Uploaded Template
            </Button>
          </Box>
        </Stack>
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
        <Stack spacing={4} alignItems="center" py={4}>
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

          <Divider sx={{ width: "100%", my: 2 }}>Store Document to Buyer</Divider>
          
          <Box sx={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Select Buyer</InputLabel>
              <Select
                value={selectedBuyerForSave}
                label="Select Buyer"
                onChange={e => setSelectedBuyerForSave(e.target.value)}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {buyers.map(b => (
                  <MenuItem key={b.id} value={b.id}>{b.buyer_name || b.name || "Unknown Buyer"}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={handleSaveToBuyer}
              disabled={!selectedBuyerForSave || savingToBuyer}
              fullWidth
            >
              {savingToBuyer ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
              Save to Selected Buyer
            </Button>
            {saveToBuyerSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>{saveToBuyerSuccess}</Alert>
            )}
          </Box>

          <Button onClick={reset} sx={{ mt: 2 }}>
            Start Over
          </Button>
        </Stack>
      )}
    </Paper>
  );
}
