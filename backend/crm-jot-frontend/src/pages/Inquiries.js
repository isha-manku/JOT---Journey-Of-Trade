import { useEffect, useState } from "react";
import {
  FiPlus, FiSearch, FiX, FiChevronDown, FiChevronUp,
  FiCalendar, FiUser, FiPackage, FiMessageSquare,
  FiPhone, FiActivity, FiCheckCircle, FiAlertCircle
} from "react-icons/fi";

const EMPTY_FORM = {
  inquiry_date: "",
  inquiry_source: "",
  buyer_name: "",
  product_name: "",
  query_executor: "",
  initial_contact_method: "",
  response_status: "",
  buyer_quality_rating: ""
};

/* ── Badge colour helpers ── */
function QualityBadge({ val }) {
  const map = {
    "hot buyer":     { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
    "genuine buyer": { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
    "medium":        { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
    "risky":         { bg: "#ffedd5", color: "#9a3412", dot: "#f97316" },
    "fake":          { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  };
  const s = map[(val || "").toLowerCase()] || { bg: "#f3f4f6", color: "#555", dot: "#aaa" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 5
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, display: "inline-block" }}></span>
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

function Inquiries() {
  const [inquiries,   setInquiries]   = useState([]);
  const [search,      setSearch]      = useState("");
  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [expandedId,  setExpandedId]  = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);

  const role = localStorage.getItem("role");

  useEffect(() => { fetchInquiries(); }, []);

  const fetchInquiries = () => {
    fetch("http://localhost:5000/inquiries")
      .then(res => res.json())
      .then(data => setInquiries(data));
  };

  /* ── SUBMIT ── */
  const handleSubmit = async () => {
    const vals = Object.values(form);
    if (vals.some(v => !v)) { alert("Please fill all fields"); return; }

    if (editId) {
      await fetch(`http://localhost:5000/inquiries/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      setEditId(null);
    } else {
      await fetch("http://localhost:5000/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    fetchInquiries();
  };

  /* ── DELETE ── */
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this inquiry?")) return;
    await fetch(`http://localhost:5000/inquiries/${id}`, { method: "DELETE" });
    if (expandedId === id) setExpandedId(null);
    fetchInquiries();
  };

  /* ── INLINE REMARK UPDATE ── */
  const updateField = async (inq, key, val) => {
    const updated = { ...inq, [key]: val };
    setInquiries(prev => prev.map(item => item.id === inq.id ? updated : item));
    await fetch(`http://localhost:5000/inquiries/${inq.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });
  };

  /* ── SEARCH ── */
  const filtered = inquiries.filter(i => {
    const q = search.toLowerCase();
    return (
      i.inquiry_date?.toLowerCase().includes(q) ||
      i.inquiry_source?.toLowerCase().includes(q) ||
      i.buyer_name?.toLowerCase().includes(q) ||
      i.product_name?.toLowerCase().includes(q) ||
      i.query_executor?.toLowerCase().includes(q) ||
      i.initial_contact_method?.toLowerCase().includes(q) ||
      i.response_status?.toLowerCase().includes(q) ||
      i.buyer_quality_rating?.toLowerCase().includes(q) ||
      i.remarks?.toLowerCase().includes(q)
    );
  });

  /* ── OPEN EDIT ── */
  const handleEdit = (i, e) => {
    e.stopPropagation();
    setForm({
      inquiry_date: i.inquiry_date,
      inquiry_source: i.inquiry_source,
      buyer_name: i.buyer_name,
      product_name: i.product_name,
      query_executor: i.query_executor,
      initial_contact_method: i.initial_contact_method,
      response_status: i.response_status,
      buyer_quality_rating: i.buyer_quality_rating
    });
    setEditId(i.id);
    setShowForm(true);
  };

  /* ══════════════════════════ RENDER ══════════════════════════ */
  return (
    <div className="buyers-page">

      {/* PAGE HEADER */}
      <div className="buyers-page-header">
        <div>
          <h1 className="buyers-page-title">Inquiries</h1>
          <p className="buyers-page-sub">{inquiries.length} inquir{inquiries.length !== 1 ? "ies" : "y"} recorded</p>
        </div>
        <button
          className="comp-add-btn"
          onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}
        >
          <FiPlus size={16} /> Add Inquiry
        </button>
      </div>

      {/* SEARCH */}
      <div className="buyers-search-wrap">
        <FiSearch size={15} className="buyers-search-icon" />
        <input
          className="buyers-search"
          placeholder="Search by buyer, product, source, status…"
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
              <th>Buyer</th>
              <th>Product</th>
              <th>Executor</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Quality</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", color: "#aaa", padding: 40 }}>
                  No inquiries found.
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
                    <td><strong>{i.buyer_name || "—"}</strong></td>
                    <td>{i.product_name || "—"}</td>
                    <td>{i.query_executor || "—"}</td>
                    <td>{i.initial_contact_method || "—"}</td>
                    <td><StatusBadge val={i.response_status} /></td>
                    <td><QualityBadge val={i.buyer_quality_rating} /></td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={e => handleDelete(i.id, e)}>Delete</button>
                        <button onClick={e => handleEdit(i, e)}>Edit</button>
                      </div>
                    </td>
                  </tr>

                  {/* EXPANDED DETAIL ROW */}
                  {isOpen && (
                    <tr key={`${i.id}-detail`} className="buyer-detail-row">
                      <td colSpan={10}>
                        <div className="buyer-detail-panel">

                          {/* INFO CHIPS */}
                          <div className="buyer-detail-info">
                            <div className="buyer-detail-info-item">
                              <FiCalendar size={14} />
                              <span><strong>Date:</strong> {i.inquiry_date || "—"}</span>
                            </div>
                            <div className="buyer-detail-info-item">
                              <FiUser size={14} />
                              <span><strong>Buyer:</strong> {i.buyer_name || "—"}</span>
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
                            <span style={{ fontSize: 12, color: "#888", fontWeight: 600, marginLeft: 8 }}>Quality:</span>
                            <QualityBadge val={i.buyer_quality_rating} />
                            {i.remark_done && (
                              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#065f46", fontWeight: 700, background: "#d1fae5", padding: "3px 10px", borderRadius: 20 }}>
                                <FiCheckCircle size={13} /> Marked Done
                              </span>
                            )}
                          </div>

                          {/* REMARKS + FOLLOW-UP PANEL */}
                          <div className="inq-detail-grid">

                            {/* REMARKS */}
                            <div className="inq-detail-box">
                              <div className="inq-detail-box-head">
                                <FiMessageSquare size={14} />
                                <span>Remarks</span>
                              </div>
                              {role === "admin" ? (
                                <textarea
                                  className="inq-remark-textarea"
                                  rows={3}
                                  placeholder="Add a remark for this inquiry…"
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
                              {role === "admin" ? (
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

      {/* ══════════ MODAL FORM ══════════ */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>{editId ? "Edit Inquiry" : "Add Inquiry"}</h2>
              <button className="close-btn" onClick={() => { setShowForm(false); setEditId(null); }}>
                <FiX size={16} />
              </button>
            </div>

            <div className="form-grid">
              <input
                type="date"
                value={form.inquiry_date}
                onChange={e => setForm({ ...form, inquiry_date: e.target.value })}
              />
              <select
                value={form.inquiry_source}
                onChange={e => setForm({ ...form, inquiry_source: e.target.value })}
              >
                <option value="">Inquiry Source</option>
                <option>go4world</option>
                <option>direct email</option>
                <option>mandate</option>
                <option>alibaba</option>
                <option>referral</option>
              </select>
              <input
                placeholder="Buyer Name"
                value={form.buyer_name}
                onChange={e => setForm({ ...form, buyer_name: e.target.value })}
              />
              <input
                placeholder="Product Name"
                value={form.product_name}
                onChange={e => setForm({ ...form, product_name: e.target.value })}
              />
              <input
                placeholder="Query Executor"
                value={form.query_executor}
                onChange={e => setForm({ ...form, query_executor: e.target.value })}
              />
              <select
                value={form.initial_contact_method}
                onChange={e => setForm({ ...form, initial_contact_method: e.target.value })}
              >
                <option value="">Initial Contact</option>
                <option>WhatsApp</option>
                <option>Email</option>
                <option>Vchat</option>
              </select>
              <select
                value={form.response_status}
                onChange={e => setForm({ ...form, response_status: e.target.value })}
              >
                <option value="">Response Status</option>
                <option>replied</option>
                <option>not replied</option>
                <option>interested</option>
                <option>follow up needed</option>
              </select>
              <select
                value={form.buyer_quality_rating}
                onChange={e => setForm({ ...form, buyer_quality_rating: e.target.value })}
              >
                <option value="">Buyer Quality</option>
                <option>hot buyer</option>
                <option>genuine buyer</option>
                <option>medium</option>
                <option>risky</option>
                <option>fake</option>
              </select>

              <button className="save-btn" onClick={handleSubmit}>
                {editId ? "Update Inquiry" : "Save Inquiry"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Inquiries;