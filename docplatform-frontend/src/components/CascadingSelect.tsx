import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TextField, MenuItem, Stack, Typography, Divider, Button, Alert } from "@mui/material";
import { refApi } from "../api";
import type { Selection } from "../types";

interface Props { onComplete: (s: Selection) => void; }

/** Company -> Product -> DocumentType cascading dropdowns + Buyer details. */
export default function CascadingSelect({ onComplete }: Props) {
  const [company, setCompany] = useState("");
  const [product, setProduct] = useState("");
  const [docType, setDocType] = useState("");

  // Buyer information fields
  const [buyerName, setBuyerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [error, setError] = useState<string | null>(null);

  const companies = useQuery({ queryKey: ["companies"], queryFn: refApi.companies });
  const products = useQuery({
    queryKey: ["products", company], queryFn: () => refApi.products(company), enabled: !!company,
  });
  const docTypes = useQuery({
    queryKey: ["doctypes", company, product],
    queryFn: () => refApi.documentTypes(company, product), enabled: !!company && !!product,
  });

  const handleProceed = () => {
    setError(null);
    if (!company || !product || !docType) {
      setError("Please select Supplier, Product, and Document Type.");
      return;
    }
    
    if (buyerName.trim().length < 2) {
      setError("Buyer Name must be at least 2 characters.");
      return;
    }
    if (companyName.trim().length < 2) {
      setError("Company Name must be at least 2 characters.");
      return;
    }
    if (country.trim().length < 2) {
      setError("Country must be at least 2 characters.");
      return;
    }
    
    const phoneDigits = phone.replace(/[^\d+]/g, '');
    if (phoneDigits.length < 5) {
      setError("Phone Number must contain at least 5 digits/symbols (+).");
      return;
    }

    onComplete({
      company_id: company, 
      product_id: product, 
      document_type_id: docType,
      buyer_name: buyerName.trim(), 
      company_name: companyName.trim(),
      country: country.trim(), 
      phone: phone.trim(),
      ...(email.trim() ? { email: email.trim() } : {}),
    });
  };

  return (
    <Stack spacing={3}>
      <Typography variant="subtitle2" sx={{ color: "text.secondary", letterSpacing: 1, textTransform: "uppercase" }}>
        Supplier & Document
      </Typography>

      <TextField select label="Company (Supplier)" value={company}
        onChange={e => { setCompany(e.target.value); setProduct(""); setDocType(""); setError(null); }}>
        {(companies.data ?? []).map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
      </TextField>

      <TextField select label="Product" value={product} disabled={!company}
        onChange={e => { setProduct(e.target.value); setDocType(""); setError(null); }}>
        {(products.data ?? []).map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
      </TextField>

      <TextField select label="Document Type" value={docType} disabled={!product}
        onChange={e => { setDocType(e.target.value); setError(null); }}>
        {(docTypes.data ?? []).map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
      </TextField>

      <Divider />

      <Typography variant="subtitle2" sx={{ color: "text.secondary", letterSpacing: 1, textTransform: "uppercase" }}>
        Buyer Information
      </Typography>

      <TextField label="Buyer Name *" value={buyerName} required
        helperText="Min 2 characters"
        onChange={e => { setBuyerName(e.target.value); setError(null); }} />

      <TextField label="Company Name (Buyer) *" value={companyName} required
        helperText="Min 2 characters"
        onChange={e => { setCompanyName(e.target.value); setError(null); }} />

      <TextField label="Country *" value={country} required
        onChange={e => { setCountry(e.target.value); setError(null); }} />

      <TextField label="Phone Number *" value={phone} required
        helperText="Min 5 digits"
        onChange={e => { setPhone(e.target.value); setError(null); }} />

      <TextField label="Email (Optional)" value={email}
        onChange={e => { setEmail(e.target.value); setError(null); }} />

      {error && <Alert severity="error">{error}</Alert>}

      <Button variant="contained" color="primary" onClick={handleProceed} size="large">
        Proceed
      </Button>
    </Stack>
  );
}
