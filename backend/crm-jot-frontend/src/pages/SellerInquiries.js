import { useEffect, useState } from "react";
import {
  FiPlus, FiSearch, FiX, FiChevronDown, FiChevronUp,
  FiCalendar, FiUser, FiPackage, FiMessageSquare,
  FiPhone, FiActivity, FiCheckCircle, FiAlertCircle,
  FiDollarSign, FiTag, FiClock
} from "react-icons/fi";

const EMPTY_FORM = {
  inquiry_date: "",
  inquiry_source: "",
  seller_name: "",
  product_name: "",
  query_executor: "",
  initial_contact_method: "",
  response_status: "",
  seller_quality_rating: "",
  offered_price: "",
  price_currency: "USD",
  price_validity: "",
  price_remarks: ""
};

/* ── Badge helpers ── */
function QualityBadge({ val }) {
  const map = {
    "reliable seller":  { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
    "genuine seller":   { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
    "medium":           { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
    "risky":            { bg: "#ffedd5", color: "#9a3412", dot: "#f97316" },
    "blacklisted":      { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  };
  const s = map[(val || "").toLowerCase()] || { bg: "#f3f4f6", color: "#555", dot: "#aaa" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 5
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {val || "—"}
    </span>
  );
}

function StatusBadge({ val }) {
  const map = {
    "replied":           { bg: "#d1fae5", color: "#065f46" },
    "not replied":       { bg: "#fee2e2", color: "#991b1b" },
    "interested":        { bg: "#ede9fe", color: "#5b21b6" },
    "follow up needed":  { bg: "#fef3c7", color: "#92400e" },
    "price received":    { bg: "#dbeafe", color: "#1e40af" },
    "negotiating":       { bg: "#ffedd5", color: "#9a3412" },
  };
  const s = map[(val || "").toLowerCase()] || { bg: "#f3f4f6", color: "#555" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700
    }}>
      {val || "—"}
    </span>
  );
}

function SellerInquiries() {
  const [inquiries,  setInquiries]  = useState([]);
  const [search,     setSearch]     = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);

  const role = localStorage.getItem("role");

  useEffect(() => { fetchInquiries(); }, []);

  const fetchInquiries = () => {
    fetch("http://localhost:5000/seller-inquiries")
      .then(r => r.json())
      .then(data => setInquiries(data))
      .catch(() => {});
  };

  /* ── SUBMIT ── */
  const handleSubmit = async () => {
    const required = [
      "inquiry_date","inquiry_source","seller_name","product_name",
      "query_executor","initial_contact_method","response_status",
      "seller_quality_rating","offered_price","price_currency"
    ];
    if (required.some(k => !form[k])) { alert("Please fill all required fields"); return; }

    const url    = editId
      ? `http://localhost:5000/seller-inquiries/${editId}`
      : "http://localhost:5000/seller-inquiries";
    const method = editId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
    fetchInquiries();
  };

  /* ── DELETE ── */
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this seller inquiry?")) return;
    await fetch(`http://localhost:5000/seller-inquiries/${id}`, { method: "DELETE" });
    if (expandedId === id) setExpandedId(null);
    fetchInquiries();
  };

  /* ── INLINE FIELD UPDATE ── */
  const updateField = async (inq, key, val) => {
    const updated = { ...inq, [key]: val };
    setInquiries(prev => prev.map(item => item.id === inq.id ? updated : item));
    await fetch(`http://localhost:5000/seller-inquiries/${inq.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });
  };

  /* ── OPEN EDIT ── */
  const handleEdit = (i, e) => {
    e.stopPropagation();
    setForm({
      inquiry_date:           i.inquiry_date,
      inquiry_source:         i.inquiry_source,
      seller_name:            i.seller_name,
      product_name:           i.product_name,
      query_executor:         i.query_executor,
      initial_contact_method: i.initial_contact_method,
      response_status:        i.response_status,
      seller_quality_rating:  i.seller_quality_rating,
      offered_price:          i.offered_price,
      price_currency:         i.price_currency || "USD",
      price_validity:         i.price_validity || "",
      price_remarks:          i.price_remarks  || ""
    });
    setEditId(i.id);
    setShowForm(true);
  };

  /* ── SEARCH ── */
  const filtered = inquiries.filter(i => {
    const q = search.toLowerCase();
    return (
      i.inquiry_date?.toLowerCase().includes(q) ||
      i.inquiry_source?.toLowerCase().includes(q) ||
      i.seller_name?.toLowerCase().includes(q) ||
      i.product_name?.toLowerCase().includes(q) ||
      i.query_executor?.toLowerCase().includes(q) ||
      i.initial_contact_method?.toLowerCase().includes(q) ||
      i.response_status?.toLowerCase().includes(q) ||
      i.seller_quality_rating?.toLowerCase().includes(q) ||
      i.offered_price?.toLowerCase().includes(q) ||
      i.remarks?.toLowerCase().includes(q)
    );
  });

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  /* ══════════════════════════ RENDER ══════════════════════════ */
  return (
    <div className="buyers-page">

      {/* PAGE HEADER */}
      <div className="buyers-page-header">
        <div>
          <h1 className="buyers-page-title">Seller Inquiries</h1>
          <p className="buyers-page-sub">
            {inquiries.length} seller inquir{inquiries.length !== 1 ? "ies" : "y"} recorded
          </p>
        </div>
        {(role === "admin" || role === "manager" || role === "member") && (
          <button
            className="comp-add-btn"
            onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}
          >
            <FiPlus size={16} /> Add Seller Inquiry
          </button>
        )}
      </div>

      {/* SEARCH */}
      <div className="buyers-search-wrap">
        <FiSearch size={15} className="buyers-search-icon" />
        <input
          className="buyers-search"
          placeholder="Search by seller, product, source, status, price…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <FiX size={15} className="buyers-search-clear" onClick={() => setSearch("")} />}
      </div>

      {/* TABLE */}
      <div className="buyers-table-outer">
        <table className="buyers-table">
          <thead>
            <tr>
              <th style={{ width: 28 }}></th>
              <th>Date</th>
              <th>Source</th>
              <th>Seller</th>
              <th>Product</th>
              <th>Executor</th>
              <th>Contact</th>
              <th>Offered Price</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", color: "#aaa", padding: 40 }}>
                  No seller inquiries found.
                </td>
              </tr>
            )}

            {filtered.map(i => {
              const isOpen = expandedId === i.id;
              return (
                <>
                  {/* MAIN ROW */}
                  <tr
                    key={i.id}
                    className={`buyer-main-row${isOpen ? " buyer-row-open" : ""}`}
                    onClick={() => setExpandedId(isOpen ? null : i.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ paddingLeft: 14 }}>
                      <button
                        className="buyer-action-btn buyer-expand"
                        onClick={e => { e.stopPropagation(); setExpandedId(isOpen ? null : i.id); }}
                      >
                        {isOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </button>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{i.inquiry_date || "—"}</td>
                    <td>{i.inquiry_source || "—"}</td>
                    <td><strong>{i.seller_name || "—"}</strong></td>
                    <td>{i.product_name || "—"}</td>
                    <td>{i.query_executor || "—"}</td>
                    <td>{i.initial_contact_method || "—"}</td>
                    <td>
                      {i.offered_price ? (
                        <span style={{
                          background: "#f0f7f3", color: "#0e2318",
                          border: "1px solid #c9a96e",
                          borderRadius: 20, padding: "3px 10px",
                          fontSize: 12, fontWeight: 700,
                          display: "inline-flex", alignItems: "center", gap: 4
                        }}>
                          <FiDollarSign size={11} />
                          {i.offered_price} {i.price_currency}
                        </span>
                      ) : "—"}
                    </td>
                    <td><StatusBadge val={i.response_status} /></td>
                    <td><QualityBadge val={i.seller_quality_rating} /></td>
                    <td>
                      <div className="action-buttons">
                        {role === "admin" && (
                          <button onClick={e => handleDelete(i.id, e)}>Delete</button>
                        )}
                        {(role === "admin" || role === "manager") && (
                          <button onClick={e => handleEdit(i, e)}>Edit</button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* EXPANDED DETAIL ROW */}
                  {isOpen && (
                    <tr key={`${i.id}-detail`} className="buyer-detail-row">
                      <td colSpan={11}>
                        <div className="buyer-detail-panel">

                          {/* INFO CHIPS */}
                          <div className="buyer-detail-info">
                            <div className="buyer-detail-info-item">
                              <FiCalendar size={14} />
                              <span><strong>Date:</strong> {i.inquiry_date || "—"}</span>
                            </div>
                            <div className="buyer-detail-info-item">
                              <FiUser size={14} />
                              <span><strong>Seller:</strong> {i.seller_name || "—"}</span>
                            </div>
                            <div className="buyer-detail-info-item">
                              <FiPackage size={14} />
                              <span><strong>Product:</strong> {i.product_name || "—"}</span>
                            </div>
                            <div className="buyer-detail-info-item">
                              <FiUser size={14} />
                              <span><strong>Executor:</strong> {i.query_executor || "—"}</span>
                            </div>
                            <div className="buyer-detail-info-item">
                              <FiPhone size={14} />
                              <span><strong>Contact via:</strong> {i.initial_contact_method || "—"}</span>
                            </div>
                            <div className="buyer-detail-info-item">
                              <FiActivity size={14} />
                              <span><strong>Source:</strong> {i.inquiry_source || "—"}</span>
                            </div>
                          </div>

                          {/* STATUS + QUALITY ROW */}
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Response:</span>
                            <StatusBadge val={i.response_status} />
                            <span style={{ fontSize: 12, color: "#888", fontWeight: 600, marginLeft: 8 }}>Rating:</span>
                            <QualityBadge val={i.seller_quality_rating} />
                            {i.remark_done && (
                              <span style={{
                                display: "flex", alignItems: "center", gap: 5,
                                fontSize: 12, color: "#065f46", fontWeight: 700,
                                background: "#d1fae5", padding: "3px 10px", borderRadius: 20
                              }}>
                                <FiCheckCircle size={13} /> Marked Done
                              </span>
                            )}
                          </div>

                          {/* PRICE LIST PANEL */}
                          <div className="sinq-price-panel">
                            <div className="sinq-price-head">
                              <FiDollarSign size={14} />
                              <span>Price List Details</span>
                            </div>
                            <div className="sinq-price-grid">
                              <div className="sinq-price-item">
                                <span className="sinq-price-label">Offered Price</span>
                                <span className="sinq-price-value">
                                  {i.offered_price
                                    ? `${i.offered_price} ${i.price_currency || "USD"}`
                                    : "—"}
                                </span>
                              </div>
                              <div className="sinq-price-item">
                                <span className="sinq-price-label">Price Validity</span>
                                <span className="sinq-price-value">{i.price_validity || "—"}</span>
                              </div>
                              <div className="sinq-price-item sinq-price-full">
                                <span className="sinq-price-label">Price / Terms Remarks</span>
                                <span className="sinq-price-value sinq-price-notes">
                                  {i.price_remarks || <em style={{ color: "#bbb" }}>No price remarks</em>}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* REMARKS + FOLLOW-UP */}
                          <div className="inq-detail-grid">

                            {/* REMARKS */}
                            <div className="inq-detail-box">
                              <div className="inq-detail-box-head">
                                <FiMessageSquare size={14} />
                                <span>Remarks</span>
                              </div>
                              {role === "admin" || role === "manager" ? (
                                <textarea
                                  className="inq-remark-textarea"
                                  rows={3}
                                  placeholder="Add a remark for this seller inquiry…"
                                  value={i.remarks || ""}
                                  onChange={e => updateField(i, "remarks", e.target.value)}
                                />
                              ) : (
                                <p className="inq-remark-text">
                                  {i.remarks || <em style={{ color: "#bbb" }}>No remarks yet</em>}
                                </p>
                              )}
                            </div>

                            {/* FOLLOW-UP */}
                            <div className="inq-detail-box">
                              <div className="inq-detail-box-head">
                                <FiAlertCircle size={14} />
                                <span>Follow-up</span>
                              </div>
                              {role === "admin" || role === "manager" ? (
                                <textarea
                                  className="inq-remark-textarea"
                                  rows={3}
                                  placeholder="Add follow-up notes…"
                                  value={i.followup || ""}
                                  onChange={e => updateField(i, "followup", e.target.value)}
                                />
                              ) : (
                                <p className="inq-remark-text">
                                  {i.followup || <em style={{ color: "#bbb" }}>No follow-up notes</em>}
                                </p>
                              )}
                            </div>

                          </div>

                          {/* DONE CHECKBOX */}
                          <div className="inq-done-row">
                            <label className="inq-done-label">
                              <input
                                type="checkbox"
                                checked={i.remark_done || false}
                                onChange={e => updateField(i, "remark_done", e.target.checked)}
                                style={{ width: 17, height: 17, accentColor: "#0e2318", cursor: "pointer" }}
                              />
                              <span>Mark as Done</span>
                            </label>
                          </div>

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

      {/* ══════════════════════════ MODAL FORM ══════════════════════════ */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box sinq-modal">
            <div className="modal-header">
              <h2>{editId ? "Edit Seller Inquiry" : "Add Seller Inquiry"}</h2>
              <button className="close-btn" onClick={() => { setShowForm(false); setEditId(null); }}>
                <FiX size={16} />
              </button>
            </div>

            {/* ── SECTION 1: Basic Info ── */}
            <div className="sinq-form-section">
              <div className="sinq-form-section-title">
                <FiActivity size={13} /> Inquiry Details
              </div>
              <div className="sinq-form-grid">
                <div className="sinq-field">
                  <label>Date <span className="sinq-req">*</span></label>
                  <input type="date" value={form.inquiry_date} onChange={e => f("inquiry_date", e.target.value)} />
                </div>
                <div className="sinq-field">
                  <label>Inquiry Source <span className="sinq-req">*</span></label>
                  <select value={form.inquiry_source} onChange={e => f("inquiry_source", e.target.value)}>
                    <option value="">Select Source</option>
                    <option>go4world</option>
                    <option>direct email</option>
                    <option>mandate</option>
                    <option>alibaba</option>
                    <option>referral</option>
                    <option>website</option>
                    <option>cold call</option>
                  </select>
                </div>
                <div className="sinq-field">
                  <label>Seller Name <span className="sinq-req">*</span></label>
                  <input placeholder="Enter seller name" value={form.seller_name} onChange={e => f("seller_name", e.target.value)} />
                </div>
                <div className="sinq-field">
                  <label>Product Name <span className="sinq-req">*</span></label>
                  <input placeholder="Enter product name" value={form.product_name} onChange={e => f("product_name", e.target.value)} />
                </div>
                <div className="sinq-field">
                  <label>Query Executor <span className="sinq-req">*</span></label>
                  <input placeholder="Who handled this?" value={form.query_executor} onChange={e => f("query_executor", e.target.value)} />
                </div>
                <div className="sinq-field">
                  <label>Initial Contact <span className="sinq-req">*</span></label>
                  <select value={form.initial_contact_method} onChange={e => f("initial_contact_method", e.target.value)}>
                    <option value="">Select Method</option>
                    <option>WhatsApp</option>
                    <option>Email</option>
                    <option>Vchat</option>
                    <option>Phone</option>
                  </select>
                </div>
                <div className="sinq-field">
                  <label>Response Status <span className="sinq-req">*</span></label>
                  <select value={form.response_status} onChange={e => f("response_status", e.target.value)}>
                    <option value="">Select Status</option>
                    <option>replied</option>
                    <option>not replied</option>
                    <option>interested</option>
                    <option>follow up needed</option>
                    <option>price received</option>
                    <option>negotiating</option>
                  </select>
                </div>
                <div className="sinq-field">
                  <label>Seller Rating <span className="sinq-req">*</span></label>
                  <select value={form.seller_quality_rating} onChange={e => f("seller_quality_rating", e.target.value)}>
                    <option value="">Select Rating</option>
                    <option>reliable seller</option>
                    <option>genuine seller</option>
                    <option>medium</option>
                    <option>risky</option>
                    <option>blacklisted</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Price List ── */}
            <div className="sinq-form-section">
              <div className="sinq-form-section-title">
                <FiDollarSign size={13} /> Price List from Seller
              </div>
              <div className="sinq-form-grid">
                <div className="sinq-field">
                  <label>Offered Price <span className="sinq-req">*</span></label>
                  <input
                    placeholder="e.g. 450 or 450/MT"
                    value={form.offered_price}
                    onChange={e => f("offered_price", e.target.value)}
                  />
                </div>
                <div className="sinq-field">
                  <label>Currency <span className="sinq-req">*</span></label>
                  <select value={form.price_currency} onChange={e => f("price_currency", e.target.value)}>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>INR</option>
                    <option>GBP</option>
                    <option>AED</option>
                    <option>CNY</option>
                  </select>
                </div>
                <div className="sinq-field">
                  <label>Price Validity</label>
                  <input
                    placeholder="e.g. valid till 30 June 2026"
                    value={form.price_validity}
                    onChange={e => f("price_validity", e.target.value)}
                  />
                </div>
                <div className="sinq-field sinq-field-full">
                  <label>Price / Terms Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. FOB Mumbai, min order 5 MT, payment terms 30% advance…"
                    value={form.price_remarks}
                    onChange={e => f("price_remarks", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button className="save-btn" onClick={handleSubmit}>
              {editId ? "Update Seller Inquiry" : "Save Seller Inquiry"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default SellerInquiries;