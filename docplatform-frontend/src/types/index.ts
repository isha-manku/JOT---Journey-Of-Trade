export interface Company { id: string; name: string; code: string; }
export interface Product { id: string; name: string; code: string; unit: string; }
export interface DocumentType { id: string; name: string; code: string; }

export type FieldType = "text" | "number" | "date" | "dropdown" | "textarea" | "checkbox";

export interface SchemaField {
  id: string;
  key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  order: number;
  options?: string[] | null;
  default_value?: string | null;
  placeholder?: string | null;
}

export interface DocumentSchema {
  id: string;
  template_id: string;
  version: number;
  fields: SchemaField[];
}

export interface GeneratedDocument {
  id: string;
  document_number: string;
  buyer_id: number;
  company: string;
  product: string;
  document_type: string;
  latest_version: number;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  version: number;
  created_at: string;
  created_by?: string | null;
  form_values: Record<string, unknown>;
}

export interface SearchResult { items: GeneratedDocument[]; total: number; }

export interface Selection {
  company_id: string;
  product_id: string;
  document_type_id: string;
  buyer_name: string;
  company_name: string;
  country: string;
  phone: string;
  email?: string;
}

export interface BuyerListItem {
  id: number;
  display_name: string | null;
  crm_buyer_id: string;
  document_count: number;
}

export interface BuyerDocumentItem {
  id: string;
  document_number: string;
  document_type: string;
  latest_version: number;
  created_at: string;
  is_manual?: boolean;
  file_path?: string;
}

export interface BuyerProductGroup {
  product_name: string;
  product_code: string;
  documents: BuyerDocumentItem[];
}

export interface BuyerCompanyGroup {
  company_name: string;
  company_code: string;
  products: BuyerProductGroup[];
}

export interface BuyerProfileStats {
  total_companies: number;
  total_products: number;
  total_documents: number;
}

export interface BuyerProfile {
  buyer: { id: number; display_name: string | null; buyer_name: string | null; company_name: string | null; phone?: string; email?: string; country?: string; };
  stats: BuyerProfileStats;
  companies: BuyerCompanyGroup[];
}

export interface SellerDocumentItem {
  id: number;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  uploaded_by?: string | null;
}

export interface SellerProductGroup {
  product_name: string;
  documents: SellerDocumentItem[];
}

export interface SellerCompanyGroup {
  company_name: string;
  products: SellerProductGroup[];
}

export interface SellerProfileStats {
  total_companies: number;
  total_products: number;
  total_documents: number;
}

export interface SellerProfile {
  seller: {
    id: number;
    name: string;
    country: string;
    email: string;
    phone: string;
    product: string;
  };
  stats: SellerProfileStats;
  companies: SellerCompanyGroup[];
}

