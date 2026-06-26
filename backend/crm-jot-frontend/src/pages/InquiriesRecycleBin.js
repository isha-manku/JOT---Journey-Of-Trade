import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiAlertCircle, FiArrowLeft, FiTrash2, FiRotateCcw } from "react-icons/fi";
import { getDeletedInquiries, restoreInquiry, permanentlyDeleteInquiry } from "../api/inquiries";

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

function InquiriesRecycleBin() {
  const navigate = useNavigate();
  const [deletedInquiries, setDeletedInquiries] = useState([]);
  const [search, setSearch] = useState("");
  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchDeletedInquiries();
  }, []);

  const fetchDeletedInquiries = () => {
    getDeletedInquiries()
      .then(data => setDeletedInquiries(data))
      .catch(() => setDeletedInquiries([]));
  };

  const handleRestore = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Restore Inquiry?\n\nThis inquiry will return to the active inquiry list.")) return;

    try {
      await restoreInquiry(id);
      fetchDeletedInquiries();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDelete = async (e, id) => {
    e.stopPropagation();
    if (role !== "admin") return;
    if (!window.confirm("Delete Permanently?\n\nThis action cannot be undone.\n\nThis inquiry and its recycle-bin record will be permanently removed.")) return;

    try {
      await permanentlyDeleteInquiry(id);
      fetchDeletedInquiries();
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  };

  const filtered = deletedInquiries.filter(i => {
    const q = search.trim().toLowerCase();
    return (
      (i.inquiry_date || "").toLowerCase().includes(q) ||
      (i.inquiry_source || "").toLowerCase().includes(q) ||
      (i.buyer_name || "").toLowerCase().includes(q) ||
      (i.product_name || "").toLowerCase().includes(q) ||
      (i.query_executor || "").toLowerCase().includes(q) ||
      (i.initial_contact_method || "").toLowerCase().includes(q) ||
      (i.response_status || "").toLowerCase().includes(q) ||
      (i.buyer_quality_rating || "").toLowerCase().includes(q) ||
      (i.remarks || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="buyers-page" style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 0 48px" }}>
      
      {/* Header Bar */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        backgroundColor: "#0e2318", 
        color: "#ffffff",
        padding: "16px", 
        borderRadius: "12px",
        marginBottom: "32px"
      }}>
        <button
          onClick={() => navigate("/inquiries")}
          style={{ 
            backgroundColor: "#c9a96e", 
            color: "#0e2318", 
            fontWeight: 700, 
            borderRadius: "8px",
            padding: "8px 20px",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontFamily: "inherit",
            transition: "background-color 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = "#b38e4a"}
          onMouseOut={e => e.currentTarget.style.backgroundColor = "#c9a96e"}
        >
          <FiArrowLeft size={16} /> Back to Inquiries
        </button>
        <h1 style={{ 
          margin: "0 0 0 24px", 
          fontWeight: 700, 
          color: "#ffffff", 
          fontSize: "24px",
          fontFamily: '"Playfair Display", serif'
        }}>
          Inquiries Recycle Bin
        </h1>
      </div>

      <p className="buyers-page-sub" style={{ 
        color: "#888", 
        fontSize: "14px", 
        marginBottom: "24px",
        marginLeft: "4px"
      }}>
        {deletedInquiries.length} deleted inquir{deletedInquiries.length !== 1 ? "ies" : "y"} currently stored
      </p>

      <div style={{ 
        padding: "32px", 
        backgroundColor: "#ffffff", 
        borderRadius: "16px", 
        borderTop: "6px solid #c9a96e",
        boxShadow: "0px 10px 30px rgba(14, 35, 24, 0.03)",
        marginBottom: "32px"
      }}>

      <div className="buyers-search-wrap" style={{ marginBottom: "20px" }}>
        <FiSearch size={15} className="buyers-search-icon" />
        <input
          className="buyers-search"
          placeholder="Search by buyer, product, source, status…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <FiX size={15} className="buyers-search-clear" onClick={() => setSearch("")} />
        )}
      </div>

      <div className="buyers-table-outer">
        <table className="buyers-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Source</th>
              <th>Buyer</th>
              <th>Product</th>
              <th>Executor</th>
              <th>Status</th>
              <th>Quality</th>
              <th>Deleted By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "#aaa", padding: "40px" }}>
                  <FiAlertCircle size={24} style={{ marginBottom: "10px" }} />
                  <div>No deleted inquiries found.</div>
                </td>
              </tr>
            )}
            {filtered.map(i => {
              const d = new Date(i.deleted_at);
              const delDate = !isNaN(d) ? `${d.toISOString().slice(0, 10)} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}` : "—";
              return (
              <tr key={i.id}>
                <td style={{ whiteSpace: "nowrap" }}>{i.inquiry_date ? i.inquiry_date.slice(0, 10) : "—"}</td>
                <td>{i.inquiry_source || "—"}</td>
                <td><strong>{i.buyer_name || "—"}</strong></td>
                <td>{i.product_name || "—"}</td>
                <td>{i.query_executor || "—"}</td>
                <td><StatusBadge val={i.response_status} /></td>
                <td><QualityBadge val={i.buyer_quality_rating} /></td>
                <td style={{ color: "#888", fontSize: "12px" }}>
                  {i.deleted_by || "Unknown"}<br/>
                  <span style={{ fontSize: "11px" }}>{delDate}</span>
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button 
                    onClick={(e) => handleRestore(e, i.id)}
                    style={{
                      padding: "6px 12px", background: "#f3f4f6", color: "#374151", 
                      border: "none", borderRadius: "6px", cursor: "pointer", 
                      fontWeight: 600, fontSize: "13px", marginRight: "8px",
                      display: "inline-flex", alignItems: "center", gap: "4px"
                    }}
                  >
                    <FiRotateCcw size={14} /> Restore
                  </button>
                  {role === "admin" && (
                    <button 
                      onClick={(e) => handlePermanentDelete(e, i.id)}
                      style={{
                        padding: "6px 12px", background: "#fee2e2", color: "#b91c1c", 
                        border: "none", borderRadius: "6px", cursor: "pointer", 
                        fontWeight: 600, fontSize: "13px",
                        display: "inline-flex", alignItems: "center", gap: "4px"
                      }}
                    >
                      <FiTrash2 size={14} /> Permanent
                    </button>
                  )}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

export default InquiriesRecycleBin;
