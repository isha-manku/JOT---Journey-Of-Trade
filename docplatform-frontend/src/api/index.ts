import axios from "axios";
import type {
  Company, Product, DocumentType, DocumentSchema,
  GeneratedDocument, DocumentVersion, SearchResult,
  BuyerListItem, BuyerProfile, SellerProfile
} from "../types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/doc-api",
  withCredentials: true,
});

if (import.meta.env.DEV) {
  api.interceptors.request.use(request => {
    console.group(`🚀 API Request: ${request.method?.toUpperCase()} ${request.url}`);
    console.log("Base URL:", request.baseURL);
    console.log("Full URL:", `${request.baseURL}${request.url}`);
    console.log("Params:", request.params);
    console.log("Payload:", request.data);
    console.groupEnd();
    return request;
  });
}

api.interceptors.response.use(response => {
  if (import.meta.env.DEV) {
    console.group(`✅ API Response: ${response.config.url}`);
    console.log("Status:", response.status);
    console.log("Payload:", response.data);
    console.groupEnd();
  }
  return response;
}, error => {
  if (import.meta.env.DEV) {
    console.group(`❌ API Error: ${error.config?.url}`);
    console.log("Message:", error.message);
    console.log("Response:", error.response?.data);
    console.groupEnd();
  }
  
  // Auto-logout if session is invalid
  if (error.response?.status === 401) {
    if (window.parent !== window) {
      window.parent.postMessage({ action: "navigate", to: "/login", forceLogout: true }, "*");
    } else {
      window.location.href = "/login";
    }
  }
  
  return Promise.reject(error);
});

export const refApi = {
  companies: () => api.get<Company[]>("/reference/companies").then(r => r.data),
  products: (company_id: string) =>
    api.get<Product[]>("/reference/products", { params: { company_id } }).then(r => r.data),
  documentTypes: (company_id: string, product_id: string) =>
    api.get<DocumentType[]>("/reference/document-types",
      { params: { company_id, product_id } }).then(r => r.data),
  buyers: (search?: string) =>
    api.get<BuyerListItem[]>("/reference/buyers", { params: search ? { search } : {} }).then(r => r.data),
};

export const docApi = {
  schema: (p: { company_id: string; product_id: string; document_type_id: string }) =>
    api.get<DocumentSchema>("/documents/schema", { params: p }).then(r => r.data),

  schemaByDoc: (document_id: string) =>
    api.get<DocumentSchema>(`/documents/${document_id}/schema`).then(r => r.data),

  get: (document_id: string) =>
    api.get<GeneratedDocument>(`/documents/${document_id}`).then(r => r.data),

  generate: (body: {
    company_id: string; product_id: string; document_type_id: string;
    buyer_name: string; company_name: string; country: string; phone: string;
    email?: string;
    form_values: Record<string, unknown>;
  }) => api.post<GeneratedDocument>("/documents/generate", body).then(r => r.data),

  search: (params: Record<string, string | number | undefined>) =>
    api.get<SearchResult>("/documents/search", { params }). then(r => r.data),

  latest: (document_id: string) =>
    api.get<DocumentVersion>(`/documents/${document_id}/latest`).then(r => r.data),

  revise: (body: { document_id: string; form_values: Record<string, unknown> }) =>
    api.post<GeneratedDocument>("/documents/revise", body).then(r => r.data),

  versions: (document_id: string) =>
    api.get<DocumentVersion[]>(`/documents/${document_id}/versions`).then(r => r.data),

  extractScratch: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<{ schema: any[] }>("/documents/scratch/extract", formData).then(r => r.data);
  },

  generateScratch: (file: File, form_values: Record<string, unknown>) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("form_values", JSON.stringify(form_values));
    return api.post<Blob>("/documents/scratch/generate", formData, { responseType: 'blob' }).then(r => r.data);
  },

  pdfUrl: (document_id: string, version?: number, download = false, language = "en") => {
    const base = api.defaults.baseURL || "/doc-api";
    let url = `${base}/documents/${document_id}/pdf`;
    const params = new URLSearchParams();
    if (version) params.set("version", String(version));
    if (download) params.set("download", "true");
    if (language !== "en") params.set("language", language);
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  },

  buyerProfile: (buyerId: string | number) =>
    api.get<BuyerProfile>(`/documents/buyer/${buyerId}/profile`).then(r => r.data),

  deleteGeneratedDocument: (document_id: string) =>
    api.post<{ success: boolean }>(`/documents/generated/${document_id}/delete`).then(r => r.data),

  deleteBuyerDocument: (document_id: string | number) => {
    let crmBaseUrl = "";
    if (api.defaults.baseURL && api.defaults.baseURL.startsWith("http")) {
      crmBaseUrl = api.defaults.baseURL.replace(/\/doc-api\/?$/, "");
    } else if (window.location.origin.includes("localhost:3000")) {
      crmBaseUrl = "";
    } else {
      crmBaseUrl = window.location.origin;
    }
    return axios.post<{ success: boolean }>(`${crmBaseUrl}/buyer-documents/${document_id}/delete`, {}, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("crm_token")}` },
      withCredentials: true
    }).then(r => r.data);
  },

  uploadBuyerDocument: (buyer_id: string | number, file: File | Blob, filename: string) => {
    let crmBaseUrl = "";
    if (api.defaults.baseURL && api.defaults.baseURL.startsWith("http")) {
      crmBaseUrl = api.defaults.baseURL.replace(/\/doc-api\/?$/, "");
    } else if (window.location.origin.includes("localhost:3000")) {
      crmBaseUrl = "";
    } else {
      crmBaseUrl = window.location.origin;
    }
    
    const formData = new FormData();
    formData.append("buyer_id", String(buyer_id));
    formData.append("document_type", "Generated Document");
    formData.append("files", file, filename);

    return axios.post(`${crmBaseUrl}/buyer-documents/upload`, formData, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("crm_token")}` },
      withCredentials: true
    }).then(r => r.data);
  },
};

export const templateApi = {
  list: () => {
    let crmBaseUrl = "";
    if (api.defaults.baseURL && api.defaults.baseURL.startsWith("http")) {
      crmBaseUrl = api.defaults.baseURL.replace(/\/doc-api\/?$/, "");
    } else if (window.location.origin.includes("localhost:3000")) {
      crmBaseUrl = "";
    } else {
      crmBaseUrl = window.location.origin;
    }
    return axios.get(`${crmBaseUrl}/settings/templates`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("crm_token")}` },
      withCredentials: true
    }).then(r => r.data);
  },
  
  create: (data: { name: string, company_name: string, product_name: string, document_type_name: string }) => {
    let crmBaseUrl = "";
    if (api.defaults.baseURL && api.defaults.baseURL.startsWith("http")) {
      crmBaseUrl = api.defaults.baseURL.replace(/\/doc-api\/?$/, "");
    } else if (window.location.origin.includes("localhost:3000")) {
      crmBaseUrl = "";
    } else {
      crmBaseUrl = window.location.origin;
    }
    return axios.post(`${crmBaseUrl}/settings/templates`, data, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("crm_token")}` },
      withCredentials: true
    }).then(r => r.data);
  },

  uploadDocx: (id: string | number, file: File) => {
    let crmBaseUrl = "";
    if (api.defaults.baseURL && api.defaults.baseURL.startsWith("http")) {
      crmBaseUrl = api.defaults.baseURL.replace(/\/doc-api\/?$/, "");
    } else if (window.location.origin.includes("localhost:3000")) {
      crmBaseUrl = "";
    } else {
      crmBaseUrl = window.location.origin;
    }
    const formData = new FormData();
    formData.append("file", file);
    return axios.post(`${crmBaseUrl}/settings/templates/${id}/upload-docx`, formData, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("crm_token")}` },
      withCredentials: true
    }).then(r => r.data);
  },

  downloadDocx: (id: string | number) => {
    let crmBaseUrl = "";
    if (api.defaults.baseURL && api.defaults.baseURL.startsWith("http")) {
      crmBaseUrl = api.defaults.baseURL.replace(/\/doc-api\/?$/, "");
    } else if (window.location.origin.includes("localhost:3000")) {
      crmBaseUrl = "";
    } else {
      crmBaseUrl = window.location.origin;
    }
    return axios.get(`${crmBaseUrl}/settings/templates/${id}/docx`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("crm_token")}` },
      withCredentials: true,
      responseType: 'blob'
    }).then(r => r.data);
  }
};

export const sellerApi = {
  profile: (sellerId: string | number) =>
    axios.get<SellerProfile>(`/sellers/${sellerId}/profile`).then(r => r.data),
  
  downloadUrl: (filename: string) => `/seller-documents/download/${filename}`,
  
  previewUrl: (filename: string) => `/uploads/seller_documents/${filename}`
};

