import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiRefreshCcw, FiFileText, FiClock, FiAlertCircle, FiArrowLeft } from "react-icons/fi";

function BuyersRecycleBin() {
  const navigate = useNavigate();
  const [deletedBuyers, setDeletedBuyers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDeletedBuyers();
  }, []);

  const fetchDeletedBuyers = () => {
    fetch("http://localhost:5000/buyers/recycle-bin")
      .then(res => res.json())
      .then(data => setDeletedBuyers(data))
      .catch(() => setDeletedBuyers([]));
  };

  const handleRestore = (e, id) => {
    e.stopPropagation();
    fetch(`http://localhost:5000/buyers/${id}/restore`, {
      method: "POST"
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchDeletedBuyers();
        }
      })
      .catch(err => console.error(err));
  };

  const filtered = deletedBuyers.filter(b => {
    const searchTerm = search.trim().toLowerCase();
    return (
      (b.buyer_name || "").toLowerCase().includes(searchTerm) ||
      (b.company_name || "").toLowerCase().includes(searchTerm) ||
      (b.email || "").toLowerCase().includes(searchTerm) ||
      (b.phone || "").toLowerCase().includes(searchTerm) ||
      (b.country || "").toLowerCase().includes(searchTerm)
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
          onClick={() => navigate("/buyers")}
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
          <FiArrowLeft size={16} /> Back to Buyers
        </button>
        <h1 style={{ 
          margin: "0 0 0 24px", 
          fontWeight: 700, 
          color: "#ffffff", 
          fontSize: "24px",
          fontFamily: '"Playfair Display", serif'
        }}>
          Buyers Recycle Bin
        </h1>
      </div>

      {/* Subtitle */}
      <p className="buyers-page-sub" style={{ 
        color: "#888", 
        fontSize: "14px", 
        marginBottom: "24px",
        marginLeft: "4px"
      }}>
        {deletedBuyers.length} deleted buyer{deletedBuyers.length !== 1 ? "s" : ""} currently stored
      </p>

      {/* Main Content Card */}
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
          placeholder="Search deleted by name, company, email..."
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
              <th>Buyer Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Country</th>
              <th>Deleted At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#aaa", padding: "40px" }}>
                  <FiAlertCircle size={24} style={{ marginBottom: "10px" }} />
                  <div>No deleted buyers found.</div>
                </td>
              </tr>
            )}
            {filtered.map(b => (
              <tr key={b.id}>
                <td><strong>{b.buyer_name || "—"}</strong></td>
                <td>{b.company_name || "—"}</td>
                <td>{b.email || "—"}</td>
                <td>{b.phone || "—"}</td>
                <td>{b.country || "—"}</td>
                <td>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#888" }}>
                    <FiClock size={12} />
                    {new Date(b.deleted_at).toLocaleString()}
                  </span>
                </td>
                <td>
                  <div className="action-buttons" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <button
                      className="buyer-action-btn"
                      style={{ backgroundColor: "#0e2318", color: "#c9a96e", border: "1px solid #c9a96e", padding: "0 12px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", height: "32px", minWidth: "90px", whiteSpace: "nowrap" }}
                      onClick={e => handleRestore(e, b.id)}
                    >
                      <FiRefreshCcw style={{ marginRight: "5px" }} /> Restore
                    </button>
                    <button
                      className="buyer-action-btn"
                      style={{ backgroundColor: "#2b2b2b", color: "#c9a96e", border: "none", padding: "0 12px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", height: "32px", minWidth: "120px", whiteSpace: "nowrap" }}
                      onClick={() => navigate(`/buyers/${b.id}/documents`, { state: { source: "recycle-bin" } })}
                    >
                      <FiFileText style={{ marginRight: "5px" }} /> View Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      </div> {/* End Main Content Card */}
    </div>
  );
}

export default BuyersRecycleBin;
