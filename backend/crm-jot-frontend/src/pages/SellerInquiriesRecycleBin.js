import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiRefreshCcw, FiAlertCircle, FiArrowLeft, FiTrash2, FiClock } from "react-icons/fi";

function SellerInquiriesRecycleBin() {
  const navigate = useNavigate();
  const [deletedInquiries, setDeletedInquiries] = useState([]);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalInquiry, setModalInquiry] = useState(null);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    fetchDeletedInquiries();
  }, []);

  const fetchDeletedInquiries = () => {
    // Requires credentials so authenticateCRMUser middleware can read crm_session cookie
    fetch("http://localhost:5000/seller-inquiries/recycle-bin", { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("Access denied");
        return res.json();
      })
      .then(data => setDeletedInquiries(data))
      .catch(() => setDeletedInquiries([]));
  };

  const handleRestore = (e, id) => {
    e.stopPropagation();
    fetch(`http://localhost:5000/seller-inquiries/${id}/restore`, { 
      method: "POST",
      credentials: "include"
    })
      .then(res => res.json())
      .then(() => fetchDeletedInquiries())
      .catch(err => console.error(err));
  };

  const openDeleteModal = (inquiry) => {
    setModalInquiry(inquiry);
    setModalError("");
    setShowModal(true);
  };

  const confirmPermanentDelete = () => {
    fetch(`http://localhost:5000/seller-inquiries/${modalInquiry.id}/permanent`, { 
      method: "DELETE",
      credentials: "include"
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setModalError(errData.error || "Failed to permanently delete.");
        } else {
          setShowModal(false);
          fetchDeletedInquiries();
        }
      })
      .catch(() => {
        setModalError("An unexpected error occurred.");
      });
  };

  const filtered = deletedInquiries.filter(s => {
    const searchTerm = search.trim().toLowerCase();
    return (
      (s.seller_name || "").toLowerCase().includes(searchTerm) ||
      (s.product_name || "").toLowerCase().includes(searchTerm) ||
      (s.query_executor || "").toLowerCase().includes(searchTerm) ||
      (s.deleted_by || "").toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="buyers-page" style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 0 48px" }}>
      
      {/* Header Bar */}
      <div style={{ 
        display: "flex", alignItems: "center", backgroundColor: "#0e2318", 
        color: "#ffffff", padding: "16px", borderRadius: "12px", marginBottom: "32px"
      }}>
        <button
          onClick={() => navigate("/seller-inquiries")}
          style={{ 
            backgroundColor: "#c9a96e", color: "#0e2318", fontWeight: 700, 
            borderRadius: "8px", padding: "8px 20px", border: "none",
            display: "flex", alignItems: "center", gap: "8px", cursor: "pointer",
            fontSize: "14px", fontFamily: "inherit", transition: "background-color 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = "#b38e4a"}
          onMouseOut={e => e.currentTarget.style.backgroundColor = "#c9a96e"}
        >
          <FiArrowLeft size={16} /> Back to Seller Inquiries
        </button>
        <h1 style={{ 
          margin: "0 0 0 24px", fontWeight: 700, color: "#ffffff", 
          fontSize: "24px", fontFamily: '"Playfair Display", serif'
        }}>
          Seller Inquiries Recycle Bin
        </h1>
      </div>

      <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px", marginLeft: "4px" }}>
        {deletedInquiries.length} deleted inquir{deletedInquiries.length !== 1 ? "ies" : "y"} currently stored
      </p>

      {/* Main Content Card */}
      <div style={{ 
        padding: "32px", backgroundColor: "#ffffff", borderRadius: "16px", 
        borderTop: "6px solid #c9a96e", boxShadow: "0px 10px 30px rgba(14, 35, 24, 0.03)",
        marginBottom: "32px"
      }}>
        <div className="buyers-search-wrap" style={{ marginBottom: "20px", display: "flex", alignItems: "center", position: "relative" }}>
          <FiSearch size={15} style={{ position: "absolute", left: "14px", color: "#888" }} />
          <input
            style={{ width: "100%", padding: "12px 12px 12px 40px", border: "1px solid #e0dcd3", borderRadius: "8px", fontSize: "14px", outline: "none" }}
            placeholder="Search deleted by seller name, product, executor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <FiX size={15} style={{ position: "absolute", right: "14px", color: "#888", cursor: "pointer" }} onClick={() => setSearch("")} />
          )}
        </div>

        <div className="buyers-table-outer">
          <table className="buyers-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f0ede6", color: "#0e2318" }}>
                <th style={{ padding: "12px 16px" }}>Seller Name</th>
                <th style={{ padding: "12px 16px" }}>Product Name</th>
                <th style={{ padding: "12px 16px" }}>Query Executor</th>
                <th style={{ padding: "12px 16px" }}>Deleted By</th>
                <th style={{ padding: "12px 16px" }}>Deleted At</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#aaa", padding: "40px" }}>
                    <FiAlertCircle size={24} style={{ marginBottom: "10px" }} />
                    <div>No deleted inquiries found.</div>
                  </td>
                </tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f0ede6" }}>
                  <td style={{ padding: "16px" }}><strong>{s.seller_name || "—"}</strong></td>
                  <td style={{ padding: "16px" }}>{s.product_name || "—"}</td>
                  <td style={{ padding: "16px" }}>{s.query_executor || "—"}</td>
                  <td style={{ padding: "16px" }}>{s.deleted_by || "—"}</td>
                  <td style={{ padding: "16px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#888", fontSize: "13px" }}>
                      <FiClock size={12} />
                      {new Date(s.deleted_at).toLocaleString()}
                    </span>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <button
                        style={{ backgroundColor: "#0e2318", color: "#c9a96e", border: "1px solid #c9a96e", padding: "0 12px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", height: "32px", fontSize: "13px" }}
                        onClick={e => handleRestore(e, s.id)}
                      >
                        <FiRefreshCcw style={{ marginRight: "5px" }} /> Restore
                      </button>
                      <button
                        style={{ backgroundColor: "#dc2626", color: "#fff", border: "none", padding: "0 12px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", height: "32px", fontSize: "13px" }}
                        onClick={() => openDeleteModal(s)}
                      >
                        <FiTrash2 style={{ marginRight: "5px" }} /> Permanently Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permanent Delete Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ backgroundColor: "#fff", padding: "32px", borderRadius: "16px", maxWidth: "400px", width: "100%", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 16px 0", color: "#0e2318", display: "flex", alignItems: "center", gap: "8px" }}>
              <FiAlertCircle color="#dc2626" /> Permanently Delete Inquiry?
            </h2>
            
            {modalError ? (
              <div style={{ backgroundColor: "#fee2e2", color: "#dc2626", padding: "16px", borderRadius: "8px", marginBottom: "24px", fontSize: "14px", lineHeight: "1.5" }}>
                {modalError}
              </div>
            ) : (
              <p style={{ color: "#555", marginBottom: "24px", fontSize: "14px", lineHeight: "1.5" }}>
                This action cannot be undone.<br/><br/>
                The inquiry from <strong>{modalInquiry?.seller_name}</strong> will be permanently removed.
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{ padding: "10px 16px", backgroundColor: "#f0ede6", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", color: "#555" }}
              >
                {modalError ? "Close" : "Cancel"}
              </button>
              
              {!modalError && (
                <button 
                  onClick={confirmPermanentDelete}
                  style={{ padding: "10px 16px", backgroundColor: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", color: "#fff" }}
                >
                  Permanently Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SellerInquiriesRecycleBin;
