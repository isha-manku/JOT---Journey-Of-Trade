import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch, FiX, FiChevronDown,
  FiChevronUp, FiPackage, FiMapPin, FiMail, FiBriefcase,
  FiAlertCircle, FiAnchor, FiPhone, FiFileText, FiTrash2, FiArchive
} from "react-icons/fi";

function BuyerAvatar({ name }) {
  const initials = name
    ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return <div className="buyer-avatar">{initials}</div>;
}

function Buyers() {
  const navigate = useNavigate();
  const [buyers, setBuyers]         = useState([]);
  const [search, setSearch]         = useState("");
  const [expandedId, setExpandedId] = useState(null);
  
  const [recycleCount, setRecycleCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState(null);

  const [existingUploadModalOpen, setExistingUploadModalOpen] = useState(false);
  const [selectedBuyerForUpload, setSelectedBuyerForUpload] = useState(null);
  const [existingUploadConfig, setExistingUploadConfig] = useState({ supplier_company: "", product: "", document_type: "" });

  
  const [editBuyerModalOpen, setEditBuyerModalOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState({
    id: null, buyer_name: "", company_name: "", country: "", phone: "", email: "",
    supplier_company: "", product: "", document_type: ""
  });
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [editingDocUploads, setEditingDocUploads] = useState([]);

  const [addBuyerModalOpen, setAddBuyerModalOpen] = useState(false);
  const [newBuyer, setNewBuyer] = useState({
    buyer_name: "", company_name: "", country: "", phone: "", email: "",
    supplier_company: "", product: "", document_type: ""
  });
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const pdfs = files.filter(f => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf");
    if (pdfs.length !== files.length) {
      setUploadError("Only PDF files are allowed.");
    } else {
      setUploadError("");
    }
    setFilesToUpload([...filesToUpload, ...pdfs]);
    e.target.value = null;
  };
  
  const handleRemoveFile = (index) => {
    const newFiles = [...filesToUpload];
    newFiles.splice(index, 1);
    setFilesToUpload(newFiles);
  };

  
  const handleEditFileChange = (e) => {
    const files = Array.from(e.target.files);
    const pdfs = files.filter(f => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf");
    if (pdfs.length !== files.length) {
      setUploadError("Only PDF files are allowed.");
    } else {
      setUploadError("");
    }
    setEditingDocUploads([...editingDocUploads, ...pdfs]);
    e.target.value = null;
  };

  const handleRemoveEditFile = (index) => {
    const newFiles = [...editingDocUploads];
    newFiles.splice(index, 1);
    setEditingDocUploads(newFiles);
  };

  const submitEditBuyer = async () => {
    if (!editingBuyer.buyer_name) {
      setUploadError("Buyer Name is required.");
      return;
    }
    setUploading(true);
    setUploadError("");

    try {
      // 1. Update buyer details
      const updateRes = await fetch(`http://localhost:5000/buyers/${editingBuyer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_name: editingBuyer.buyer_name,
          company_name: editingBuyer.company_name,
          country: editingBuyer.country,
          phone: editingBuyer.phone,
          email: editingBuyer.email
          // Not sending supplier_company, product, document_type to buyers table
        })
      });
      const updateData = await updateRes.json();
      if (updateData.error) throw new Error(updateData.error);

      // 2. Upload new documents if any
      if (editingDocUploads.length > 0) {
        const formData = new FormData();
        formData.append("buyer_id", editingBuyer.id);
        if (editingBuyer.supplier_company) formData.append("company_name", editingBuyer.supplier_company);
        if (editingBuyer.product) formData.append("product_name", editingBuyer.product);
        if (editingBuyer.document_type) formData.append("document_type", editingBuyer.document_type);
        formData.append("uploaded_by", "CRM User");
        
        editingDocUploads.forEach(f => formData.append("files", f));
        
        const uploadRes = await fetch("http://localhost:5000/buyer-documents/upload", {
          method: "POST",
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          throw new Error(uploadData.errors ? uploadData.errors.map(e => e.error || e).join(", ") : uploadData.message);
        }
      }

      setEditBuyerModalOpen(false);
      setEditingDocUploads([]);
      setUploading(false);
      fetchBuyers();
    } catch (err) {
      setUploadError(err.message || "Failed to update buyer.");
      setUploading(false);
    }
  };

  const deleteUploadedDoc = (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    fetch(`http://localhost:5000/buyer-documents/${docId}/delete`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUploadedDocs(uploadedDocs.filter(d => d.id !== docId));
        }
      });
  };

  const submitNewBuyer = () => {
    if (!newBuyer.buyer_name) {
      setUploadError("Buyer Name is required.");
      return;
    }
    setUploading(true);
    setUploadError("");
    
    fetch("http://localhost:5000/buyers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyer_name: newBuyer.buyer_name,
        company_name: newBuyer.company_name,
        country: newBuyer.country,
        phone: newBuyer.phone,
        email: newBuyer.email,
        products: "[]"
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      const buyerId = data.id;
      
      if (filesToUpload.length === 0) {
        setAddBuyerModalOpen(false);
        setNewBuyer({buyer_name: "", company_name: "", country: "", phone: "", email: "", supplier_company: "", product: "", document_type: ""});
        setFilesToUpload([]);
        setUploading(false);
        fetchBuyers();
        return;
      }
      
      const formData = new FormData();
      formData.append("buyer_id", buyerId);
      if (newBuyer.supplier_company) formData.append("company_name", newBuyer.supplier_company);
      if (newBuyer.product) formData.append("product_name", newBuyer.product);
      if (newBuyer.document_type) formData.append("document_type", newBuyer.document_type);
      formData.append("uploaded_by", "CRM User");
      
      filesToUpload.forEach(f => {
        formData.append("files", f);
      });
      
      return fetch("http://localhost:5000/buyer-documents/upload", {
        method: "POST",
        body: formData
      })
      .then(res => res.json())
      .then(uploadData => {
        if (!uploadData.success) {
          setUploadError(uploadData.errors ? uploadData.errors.map(e => e.error || e).join(", ") : uploadData.message);
          setUploading(false);
          fetchBuyers();
        } else {
          setAddBuyerModalOpen(false);
          setNewBuyer({buyer_name: "", company_name: "", country: "", phone: "", email: "", supplier_company: "", product: "", document_type: ""});
          setFilesToUpload([]);
          setUploading(false);
          fetchBuyers();
        }
      });
    })
    .catch(err => {
      setUploadError(err.message || "Failed to create buyer.");
      setUploading(false);
    });
  };

  const submitExistingUpload = () => {
    if (filesToUpload.length === 0) {
      setUploadError("Please select at least one PDF file.");
      return;
    }
    if (!selectedBuyerForUpload) return;
    
    setUploading(true);
    setUploadError("");
    
    const formData = new FormData();
    formData.append("buyer_id", selectedBuyerForUpload.id);
    if (existingUploadConfig.supplier_company) formData.append("company_name", existingUploadConfig.supplier_company);
    if (existingUploadConfig.product) formData.append("product_name", existingUploadConfig.product);
    if (existingUploadConfig.document_type) formData.append("document_type", existingUploadConfig.document_type);
    formData.append("uploaded_by", "CRM User");
    
    filesToUpload.forEach(f => {
      formData.append("files", f);
    });
    
    fetch("http://localhost:5000/buyer-documents/upload", {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(uploadData => {
      if (!uploadData.success) {
        setUploadError(uploadData.errors ? uploadData.errors.map(e => e.error || e).join(", ") : uploadData.message);
        setUploading(false);
      } else {
        setExistingUploadModalOpen(false);
        setSelectedBuyerForUpload(null);
        setExistingUploadConfig({ supplier_company: "", product: "", document_type: "" });
        setFilesToUpload([]);
        setUploading(false);
        fetchBuyers();
      }
    })
    .catch(err => {
      setUploadError(err.message || "Failed to upload document.");
      setUploading(false);
    });
  };

  useEffect(() => { 
    fetchBuyers(); 
    fetchRecycleCount();
  }, []);

  const fetchRecycleCount = () => {
    fetch("http://localhost:5000/buyers/recycle-bin")
      .then(res => res.json())
      .then(data => setRecycleCount(data.length))
      .catch(() => setRecycleCount(0));
  };

  const confirmDelete = () => {
    if (!buyerToDelete) return;
    fetch(`http://localhost:5000/buyers/${buyerToDelete.id}/delete`, {
      method: "POST"
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchBuyers();
          fetchRecycleCount();
          setDeleteModalOpen(false);
          setBuyerToDelete(null);
        }
      })
      .catch(err => console.error(err));
  };

  const fetchBuyers = () => {
    fetch("http://localhost:5000/buyers")
      .then(res => res.json())
      .then(data => {
        const parsed = data.map(b => ({
          ...b,
          products: typeof b.products === "string"
            ? JSON.parse(b.products || "[]")
            : (b.products || [])
        }));
        setBuyers(parsed);
      })
      .catch(() => setBuyers([]));
  };

  /* ── FILTER ── */
  const filtered = buyers.filter(b =>
    (b.buyer_name   || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.email        || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.country      || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.phone        || "").toLowerCase().includes(search.toLowerCase())
  );

  /* ══════════════════════════ RENDER ══════════════════════════ */
  const customStyles = `
    .buyer-actions-container {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-wrap: nowrap;
    }
    .btn-view-docs {
      background-color: #0e2318;
      color: #c9a96e;
      border: 1px solid #c9a96e;
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
      height: 40px;
      min-width: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      transition: all 0.2s ease;
      font-size: 13px;
    }
    .btn-view-docs:hover {
      background-color: #153524;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .btn-delete-buyer {
      background-color: transparent;
      color: #d9534f;
      border: 1px solid #d9534f;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      height: 40px;
      width: 40px;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .btn-delete-buyer:hover {
      background-color: rgba(217, 83, 79, 0.1);
      color: #c9302c;
      border-color: #c9302c;
    }
    @media (max-width: 768px) {
      .buyer-actions-container {
        flex-direction: column;
        gap: 6px;
      }
    }
  `;

  return (
    <div className="buyers-page">
      <style>{customStyles}</style>

      {/* PAGE HEADER */}
      <div className="buyers-page-header">
        <div>
          <h1 className="buyers-page-title">Buyers</h1>
          <p className="buyers-page-sub">
            {buyers.length} buyer{buyers.length !== 1 ? "s" : ""} registered
            <span style={{ color: "#888", fontSize: 12, marginLeft: 8 }}>
              <FiFileText size={11} style={{ marginRight: 3 }} />
              Auto-populated from document generation
            </span>
          </p>
        </div>
      </div>

      {/* SEARCH AND RECYCLE BIN */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="buyers-search-wrap" style={{ margin: 0, flex: 1, maxWidth: "400px" }}>
          <FiSearch size={15} className="buyers-search-icon" />
          <input
            className="buyers-search"
            placeholder="Search by name, company, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <FiX
              size={15}
              className="buyers-search-clear"
              onClick={() => setSearch("")}
            />
          )}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            style={{ backgroundColor: "#c9a96e", color: "#0e2318", border: "none", padding: "10px 16px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap", width: "auto" }}
            onClick={() => setAddBuyerModalOpen(true)}
          >
            + Add Buyer
          </button>
          <button 
            style={{ backgroundColor: "#0e2318", color: "#c9a96e", border: "1px solid #c9a96e", padding: "10px 16px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap", width: "auto" }}
            onClick={() => navigate("/buyers/recycle-bin")}
          >
            ♻ Recycle Bin ({recycleCount})
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="buyers-table-outer">
        <table className="buyers-table">
          <thead>
            <tr>
              <th style={{ width: 28 }}></th>
              <th>Buyer Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Country</th>
              <th>Products</th>
              <th style={{ minWidth: "240px", width: "240px", textAlign: "center", whiteSpace: "nowrap" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "#aaa", padding: "40px" }}>
                  No buyers found. Buyers are created automatically when documents are generated.
                </td>
              </tr>
            )}
            {filtered.map(b => {
              const isOpen = expandedId === b.id;
              const products = b.products || [];
              return (
                <>
                  {/* MAIN ROW */}
                  <tr
                    key={b.id}
                    className={`buyer-main-row${isOpen ? " buyer-row-open" : ""}`}
                    onClick={() => setExpandedId(isOpen ? null : b.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ paddingLeft: 14 }}>
                      <button
                        className={`buyer-action-btn buyer-expand`}
                        title={isOpen ? "Collapse" : "Expand"}
                        onClick={e => { e.stopPropagation(); setExpandedId(isOpen ? null : b.id); }}
                      >
                        {isOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </button>
                    </td>
                    <td>
                      <div className="buyer-name-cell">
                        <BuyerAvatar name={b.buyer_name} />
                        <strong>{b.buyer_name || "—"}</strong>
                      </div>
                    </td>
                    <td>{b.company_name || "—"}</td>
                    <td>{b.email || "—"}</td>
                    <td>{b.phone || "—"}</td>
                    <td>{b.country || "—"}</td>
                    <td>
                      <div className="buyer-product-chips">
                        {products.slice(0, 2).map((p, i) => (
                          <span key={i} className="buyer-chip">{p.product}</span>
                        ))}
                        {products.length > 2 && (
                          <span className="buyer-chip buyer-chip-more">+{products.length - 2}</span>
                        )}
                        {products.length === 0 && <span style={{ color: "#aaa", fontSize: 12 }}>—</span>}
                      </div>
                    </td>
                    <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                      <div className="buyer-actions-container">
                        <button
                          className="btn-view-docs"
                          style={{ backgroundColor: "#0e2318", color: "#c9a96e" }}
                          onClick={e => { 
                            e.stopPropagation(); 
                            setSelectedBuyerForUpload(b); 
                            setExistingUploadModalOpen(true); 
                          }}
                        >
                          Upload Document
                        </button>
                        <button
                          className="btn-view-docs"
                          onClick={e => { e.stopPropagation(); navigate(`/buyers/${b.id}/documents`); }}
                        >
                          View Documents
                        </button>
                        <button
                          className="btn-view-docs"
                          onClick={e => { 
                            e.stopPropagation(); 
                            setEditingBuyer({
                              id: b.id,
                              buyer_name: b.buyer_name || "",
                              company_name: b.company_name || "",
                              country: b.country || "",
                              phone: b.phone || "",
                              email: b.email || "",
                              supplier_company: "",
                              product: "",
                              document_type: ""
                            });
                            setEditingDocUploads([]);
                            fetch(`http://localhost:5000/buyer-documents/${b.id}`)
                              .then(res => res.json())
                              .then(docs => setUploadedDocs(docs))
                              .catch(() => setUploadedDocs([]));
                            setEditBuyerModalOpen(true);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="btn-delete-buyer"
                          onClick={e => { 
                            e.stopPropagation(); 
                            setBuyerToDelete(b); 
                            setDeleteModalOpen(true); 
                          }}
                          title="Move to Recycle Bin"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* EXPANDED DETAIL ROW */}
                  {isOpen && (
                    <tr key={`${b.id}-detail`} className="buyer-detail-row">
                      <td colSpan={8}>
                        <div className="buyer-detail-panel">

                          {/* CONTACT INFO */}
                          <div className="buyer-detail-info">
                            <div className="buyer-detail-info-item">
                              <FiBriefcase size={14} />
                              <span><strong>Company:</strong> {b.company_name || "—"}</span>
                            </div>
                            <div className="buyer-detail-info-item">
                              <FiMail size={14} />
                              <span>{b.email || "—"}</span>
                            </div>
                            <div className="buyer-detail-info-item">
                              <FiPhone size={14} />
                              <span>{b.phone || "—"}</span>
                            </div>
                            <div className="buyer-detail-info-item">
                              <FiMapPin size={14} />
                              <span>{b.country || "—"}</span>
                            </div>
                            <div className="buyer-detail-info-item">
                              <FiMapPin size={14} />
                              <span>{b.address || "—"}</span>
                            </div>
                          </div>

                          {/* NOTES */}
                          {b.notes && (
                            <div className="buyer-important-note">
                              <FiAlertCircle size={16} />
                              <div>
                                <strong>Notes</strong>
                                <p>{b.notes}</p>
                              </div>
                            </div>
                          )}

                          {/* PRODUCTS TABLE */}
                          {products.length > 0 && (
                            <div className="buyer-products-wrap">
                              <div className="buyer-products-title">
                                <FiPackage size={14} /> Products &amp; Trade Terms
                              </div>
                              <div style={{ overflowX: "auto" }}>
                                <table className="buyer-products-table">
                                  <thead>
                                    <tr>
                                      <th>#</th>
                                      <th>Product</th>
                                      <th>Price</th>
                                      <th>Trial Qty</th>
                                      <th>Contract Qty</th>
                                      <th>Total Contract Price</th>
                                      <th>Destination Port</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {products.map((p, i) => (
                                      <tr key={i}>
                                        <td style={{ color: "#c9a96e", fontWeight: 700 }}>{i + 1}</td>
                                        <td><strong>{p.product || "—"}</strong></td>
                                        <td>{p.price ? `$${p.price}` : "—"}</td>
                                        <td>{p.trial_qty || "—"}</td>
                                        <td>{p.contract_qty || "—"}</td>
                                        <td>{p.total_contract_price ? `$${p.total_contract_price}` : "—"}</td>
                                        <td>
                                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <FiAnchor size={12} style={{ color: "#c9a96e" }} />
                                            {p.destination_port || "—"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* DELETE MODAL */}
      {deleteModalOpen && buyerToDelete && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: "#0e2318", padding: "30px", borderRadius: "12px", border: "1px solid #c9a96e", color: "white", maxWidth: "450px", width: "100%" }}>
            <h2 style={{ marginTop: 0, color: "#c9a96e", display: "flex", alignItems: "center", gap: "10px" }}><FiTrash2 /> Move Buyer to Recycle Bin?</h2>
            <p style={{ lineHeight: "1.6", color: "#e9ebea", marginBottom: "10px" }}>
              This buyer will be removed from the active Buyers list.
            </p>
            <p style={{ lineHeight: "1.6", color: "#aaa", fontSize: "14px", marginBottom: "25px" }}>
              All buyer information, generated documents, document history, account records, and analytics relationships will remain preserved and can be restored later.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px" }}>
              <button 
                onClick={() => { setDeleteModalOpen(false); setBuyerToDelete(null); }}
                style={{ backgroundColor: "transparent", border: "1px solid #aaa", color: "#aaa", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                style={{ backgroundColor: "#d9534f", border: "none", color: "white", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
              >
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* EDIT BUYER MODAL */}
      {editBuyerModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "12px", width: "90%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0e2318", color: "#c9a96e", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Edit Buyer</h2>
              <FiX size={24} style={{ cursor: "pointer" }} onClick={() => setEditBuyerModalOpen(false)} />
            </div>
            <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {uploadError && (
                <div style={{ padding: "12px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "6px", border: "1px solid #ef9a9a", fontSize: "0.9rem" }}>
                  {uploadError}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", color: "#0e2318", marginBottom: "12px", borderBottom: "2px solid #eee", paddingBottom: "8px" }}>Buyer Information</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555", fontWeight: "bold" }}>Buyer Name *</label>
                      <input value={editingBuyer.buyer_name} onChange={e => setEditingBuyer({...editingBuyer, buyer_name: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Company Name</label>
                      <input value={editingBuyer.company_name} onChange={e => setEditingBuyer({...editingBuyer, company_name: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Country</label>
                      <input value={editingBuyer.country} onChange={e => setEditingBuyer({...editingBuyer, country: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Email</label>
                      <input type="email" value={editingBuyer.email} onChange={e => setEditingBuyer({...editingBuyer, email: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Phone Number</label>
                      <input value={editingBuyer.phone} onChange={e => setEditingBuyer({...editingBuyer, phone: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: "1rem", color: "#0e2318", marginBottom: "12px", borderBottom: "2px solid #eee", paddingBottom: "8px" }}>Supplier Categorization (Optional)</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Supplier Company</label>
                      <input value={editingBuyer.supplier_company} onChange={e => setEditingBuyer({...editingBuyer, supplier_company: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="Only applies to new uploads" />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Product</label>
                      <input value={editingBuyer.product} onChange={e => setEditingBuyer({...editingBuyer, product: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="Only applies to new uploads" />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Document Type</label>
                      <input value={editingBuyer.document_type} onChange={e => setEditingBuyer({...editingBuyer, document_type: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="Only applies to new uploads" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "1rem", color: "#0e2318", marginBottom: "12px", borderBottom: "2px solid #eee", paddingBottom: "8px" }}>Existing Uploaded Documents</h3>
                {uploadedDocs.length === 0 ? (
                  <p style={{ color: "#888", fontSize: "0.9rem" }}>No manual documents uploaded.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {uploadedDocs.map(doc => (
                      <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", border: "1px solid #eee", borderRadius: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FiFileText color="#c9a96e" size={20} />
                          <div>
                            <div style={{ fontWeight: "600", fontSize: "0.9rem", color: "#333" }}>{doc.file_name}</div>
                            <div style={{ fontSize: "0.75rem", color: "#888" }}>{doc.company_name} • {doc.product_name}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <a href={`http://localhost:5000/buyer-documents/download/${doc.file_path.split(/[\\\/]/).pop()}`} target="_blank" rel="noreferrer" style={{ color: "#0e2318", textDecoration: "none", fontSize: "0.85rem", fontWeight: "bold" }}>View/Download</a>
                          <button onClick={() => deleteUploadedDoc(doc.id)} style={{ background: "transparent", border: "none", color: "#d9534f", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: "1rem", color: "#0e2318", marginBottom: "12px", borderBottom: "2px solid #eee", paddingBottom: "8px" }}>Upload Additional Documents</h3>
                <div style={{ border: "2px dashed #ccc", borderRadius: "8px", padding: "24px", textAlign: "center", backgroundColor: "#fafafa" }}>
                  <FiFileText size={32} color="#aaa" style={{ marginBottom: "12px" }} />
                  <p style={{ margin: "0 0 12px 0", color: "#555", fontSize: "0.95rem" }}>Drag and drop PDF files here or click to browse.</p>
                  <input type="file" multiple accept=".pdf,application/pdf" onChange={handleEditFileChange} style={{ display: "none" }} id="buyer-file-upload-edit" />
                  <label htmlFor="buyer-file-upload-edit" style={{ backgroundColor: "#0e2318", color: "#c9a96e", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", display: "inline-block", fontWeight: "bold", fontSize: "0.9rem" }}>
                    Select PDF Files
                  </label>
                </div>
                {editingDocUploads.length > 0 && (
                  <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {editingDocUploads.map((f, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#f1f3f5", borderRadius: "4px", fontSize: "0.85rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <FiFileText color="#c9a96e" /> {f.name}
                        </span>
                        <FiX size={16} color="#d9534f" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => handleRemoveEditFile(i)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ padding: "16px 24px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: "12px", backgroundColor: "#f8f9fa", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}>
              <button 
                onClick={() => setEditBuyerModalOpen(false)}
                disabled={uploading}
                style={{ padding: "8px 16px", backgroundColor: "transparent", border: "1px solid #ccc", borderRadius: "6px", cursor: uploading ? "not-allowed" : "pointer", fontWeight: "500" }}
              >
                Cancel
              </button>
              <button 
                onClick={submitEditBuyer}
                disabled={uploading}
                style={{ padding: "8px 24px", backgroundColor: "#c9a96e", color: "#0e2318", border: "none", borderRadius: "6px", cursor: uploading ? "not-allowed" : "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}
              >
                {uploading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD BUYER MODAL */}
      {addBuyerModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "12px", width: "90%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0e2318", color: "#c9a96e", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Add Buyer & Upload Documents</h2>
              <FiX size={24} style={{ cursor: "pointer" }} onClick={() => setAddBuyerModalOpen(false)} />
            </div>
            <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {uploadError && (
                <div style={{ padding: "12px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "6px", border: "1px solid #ef9a9a", fontSize: "0.9rem" }}>
                  {uploadError}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", color: "#0e2318", marginBottom: "12px", borderBottom: "2px solid #eee", paddingBottom: "8px" }}>Buyer Information</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555", fontWeight: "bold" }}>Buyer Name *</label>
                      <input value={newBuyer.buyer_name} onChange={e => setNewBuyer({...newBuyer, buyer_name: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="John Doe" />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Company Name</label>
                      <input value={newBuyer.company_name} onChange={e => setNewBuyer({...newBuyer, company_name: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="Acme Corp" />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Country</label>
                      <input value={newBuyer.country} onChange={e => setNewBuyer({...newBuyer, country: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="USA" />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Email</label>
                      <input type="email" value={newBuyer.email} onChange={e => setNewBuyer({...newBuyer, email: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="john@example.com" />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Phone Number</label>
                      <input value={newBuyer.phone} onChange={e => setNewBuyer({...newBuyer, phone: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="+1 555-0100" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: "1rem", color: "#0e2318", marginBottom: "12px", borderBottom: "2px solid #eee", paddingBottom: "8px" }}>Supplier Categorization (Optional)</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Supplier Company</label>
                      <input value={newBuyer.supplier_company} onChange={e => setNewBuyer({...newBuyer, supplier_company: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="Global Suppliers Inc." />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Product</label>
                      <input value={newBuyer.product} onChange={e => setNewBuyer({...newBuyer, product: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="Premium Widget" />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Document Type</label>
                      <input value={newBuyer.document_type} onChange={e => setNewBuyer({...newBuyer, document_type: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="Sales Contract" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "1rem", color: "#0e2318", marginBottom: "12px", borderBottom: "2px solid #eee", paddingBottom: "8px" }}>Upload Documents (Optional)</h3>
                <div style={{ border: "2px dashed #ccc", borderRadius: "8px", padding: "24px", textAlign: "center", backgroundColor: "#fafafa" }}>
                  <FiFileText size={32} color="#aaa" style={{ marginBottom: "12px" }} />
                  <p style={{ margin: "0 0 12px 0", color: "#555", fontSize: "0.95rem" }}>Drag and drop PDF files here or click to browse.</p>
                  <input type="file" multiple accept=".pdf,application/pdf" onChange={handleFileChange} style={{ display: "none" }} id="buyer-file-upload" />
                  <label htmlFor="buyer-file-upload" style={{ backgroundColor: "#0e2318", color: "#c9a96e", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", display: "inline-block", fontWeight: "bold", fontSize: "0.9rem" }}>
                    Select PDF Files
                  </label>
                </div>
                {filesToUpload.length > 0 && (
                  <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {filesToUpload.map((f, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#f1f3f5", borderRadius: "4px", fontSize: "0.85rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <FiFileText color="#c9a96e" /> {f.name}
                        </span>
                        <FiX size={16} color="#d9534f" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => handleRemoveFile(i)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ padding: "16px 24px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: "12px", backgroundColor: "#f8f9fa", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}>
              <button 
                onClick={() => setAddBuyerModalOpen(false)}
                disabled={uploading}
                style={{ padding: "8px 16px", backgroundColor: "transparent", border: "1px solid #ccc", borderRadius: "6px", cursor: uploading ? "not-allowed" : "pointer", fontWeight: "500" }}
              >
                Cancel
              </button>
              <button 
                onClick={submitNewBuyer}
                disabled={uploading}
                style={{ padding: "8px 24px", backgroundColor: "#c9a96e", color: "#0e2318", border: "none", borderRadius: "6px", cursor: uploading ? "not-allowed" : "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}
              >
                {uploading ? "Saving..." : "Create Buyer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT (EXISTING BUYER) MODAL */}
      {existingUploadModalOpen && selectedBuyerForUpload && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "12px", width: "90%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0e2318", color: "#c9a96e", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Upload Document for {selectedBuyerForUpload.buyer_name}</h2>
              <FiX size={24} style={{ cursor: "pointer" }} onClick={() => setExistingUploadModalOpen(false)} />
            </div>
            <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {uploadError && (
                <div style={{ padding: "12px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "6px", border: "1px solid #ef9a9a", fontSize: "0.9rem" }}>
                  {uploadError}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", color: "#0e2318", marginBottom: "12px", borderBottom: "2px solid #eee", paddingBottom: "8px" }}>Supplier Categorization (Optional)</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Supplier Company</label>
                      <input value={existingUploadConfig.supplier_company} onChange={e => setExistingUploadConfig({...existingUploadConfig, supplier_company: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="Global Suppliers Inc." />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Product</label>
                      <input value={existingUploadConfig.product} onChange={e => setExistingUploadConfig({...existingUploadConfig, product: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="Premium Widget" />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#555" }}>Document Type</label>
                      <input value={existingUploadConfig.document_type} onChange={e => setExistingUploadConfig({...existingUploadConfig, document_type: e.target.value})} style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: "4px", boxSizing: "border-box" }} placeholder="Sales Contract" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "1rem", color: "#0e2318", marginBottom: "12px", borderBottom: "2px solid #eee", paddingBottom: "8px" }}>Upload Documents *</h3>
                <div style={{ border: "2px dashed #ccc", borderRadius: "8px", padding: "24px", textAlign: "center", backgroundColor: "#fafafa" }}>
                  <FiFileText size={32} color="#aaa" style={{ marginBottom: "12px" }} />
                  <p style={{ margin: "0 0 12px 0", color: "#555", fontSize: "0.95rem" }}>Drag and drop PDF files here or click to browse.</p>
                  <input type="file" multiple accept=".pdf,application/pdf" onChange={handleFileChange} style={{ display: "none" }} id="buyer-file-upload-existing" />
                  <label htmlFor="buyer-file-upload-existing" style={{ backgroundColor: "#0e2318", color: "#c9a96e", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", display: "inline-block", fontWeight: "bold", fontSize: "0.9rem" }}>
                    Select PDF Files
                  </label>
                </div>
                {filesToUpload.length > 0 && (
                  <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {filesToUpload.map((f, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#f1f3f5", borderRadius: "4px", fontSize: "0.85rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <FiFileText color="#c9a96e" /> {f.name}
                        </span>
                        <FiX size={16} color="#d9534f" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => handleRemoveFile(i)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ padding: "16px 24px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: "12px", backgroundColor: "#f8f9fa", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}>
              <button 
                onClick={() => setExistingUploadModalOpen(false)}
                disabled={uploading}
                style={{ padding: "8px 16px", backgroundColor: "transparent", border: "1px solid #ccc", borderRadius: "6px", cursor: uploading ? "not-allowed" : "pointer", fontWeight: "500" }}
              >
                Cancel
              </button>
              <button 
                onClick={submitExistingUpload}
                disabled={uploading}
                style={{ padding: "8px 24px", backgroundColor: "#c9a96e", color: "#0e2318", border: "none", borderRadius: "6px", cursor: uploading ? "not-allowed" : "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}
              >
                {uploading ? "Uploading..." : "Upload Files"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Buyers;