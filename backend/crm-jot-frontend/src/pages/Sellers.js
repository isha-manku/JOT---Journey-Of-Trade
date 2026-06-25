import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Sellers() {
  const navigate = useNavigate();
  const [sellers, setSellers]   = useState([]);
  const [recycleCount, setRecycleCount] = useState(0);
  const [editId, setEditId]     = useState(null);
  const [search, setSearch]     = useState("");
  const [showForm, setShowForm] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState("");

  const [form, setForm] = useState({
    name: "",
    country: "",
    email: "",
    phone: "",
    product: ""
  });

  useEffect(() => {
    fetchSellers();
    fetchRecycleCount();
  }, []);

  const fetchRecycleCount = () => {
    fetch("http://localhost:5000/sellers/recycle-bin")
      .then(res => res.json())
      .then(data => setRecycleCount(data.length))
      .catch(() => setRecycleCount(0));
  };

  const fetchSellers = () => {
    fetch("http://localhost:5000/sellers")
      .then(res => res.json())
      .then(data => setSellers(data));
  };

  const handleFileChange = (e) => {
    setFileError("");
    const files = Array.from(e.target.files);
    const nonPdfs = files.filter(f => !f.name.toLowerCase().endsWith(".pdf") && f.type !== "application/pdf");
    if (nonPdfs.length > 0) {
      setFileError("❌ Only PDF files are allowed.");
      e.target.value = ""; // Reset
      setSelectedFiles([]);
      return;
    }
    setSelectedFiles(files);
  };

  // ADD + UPDATE
  const handleSubmit = async () => {
    if (
      !form.name.trim() ||
      !form.country.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.product.trim()
    ) {
      alert("⚠️ Please fill all fields");
      return;
    }

    let sellerId = editId;

    if (editId) {
      await fetch(`http://localhost:5000/sellers/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
    } else {
      const response = await fetch("http://localhost:5000/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      sellerId = data.id;
    }

    // Upload documents if selected
    if (selectedFiles.length > 0 && sellerId) {
      const formData = new FormData();
      formData.append("uploaded_by", localStorage.getItem("username") || "System");
      selectedFiles.forEach(file => {
        formData.append("documents", file);
      });

      await fetch(`http://localhost:5000/sellers/${sellerId}/documents`, {
        method: "POST",
        body: formData
      });
    }

    setForm({ name: "", country: "", email: "", phone: "", product: "" });
    setSelectedFiles([]);
    setFileError("");
    setShowForm(false);
    fetchSellers();
  };

  // DELETE
  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/sellers/${id}/delete`, { method: "POST" });
    fetchSellers();
    fetchRecycleCount();
  };

  // SEARCH
  const filteredSellers = sellers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card">

      {/* TOP BAR */}
      <div className="table-top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <input
          className="search-input"
          placeholder="Search Seller..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            style={{ backgroundColor: "#0e2318", color: "#c9a96e", border: "1px solid #c9a96e", padding: "0 20px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap", height: "40px" }}
            onClick={() => navigate("/sellers/recycle-bin")}
          >
            ♻ Recycle Bin ({recycleCount})
          </button>
          <button
            className="add-btn"
            onClick={() => {
              setForm({ name: "", country: "", email: "", phone: "", product: "" });
              setEditId(null);
              setSelectedFiles([]);
              setFileError("");
              setShowForm(true);
            }}
          >
            + Add Seller
          </button>
        </div>
      </div>

      {/* POPUP FORM */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box">

            <div className="modal-header">
              <h2>{editId ? "Edit Seller" : "Add Seller"}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setSelectedFiles([]);
                  setFileError("");
                }}
              >
                ✖
              </button>
            </div>

            <div className="form-grid">
              <input
                placeholder="Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              <input
                placeholder="Country"
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
              />
              <input
                placeholder="Email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              <input
                placeholder="Phone"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
              <input
                placeholder="Product"
                value={form.product}
                onChange={e => setForm({ ...form, product: e.target.value })}
              />
              
              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "5px", marginTop: "10px" }}>
                <label style={{ fontWeight: 600, color: "#0e2318", fontSize: "13px" }}>Upload Documents (PDF only)</label>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  style={{ padding: "8px 0" }}
                />
                {fileError && <span style={{ color: "red", fontSize: "12px" }}>{fileError}</span>}
              </div>

              <button className="save-btn" onClick={handleSubmit} style={{ marginTop: "15px" }}>
                {editId ? "Update Seller" : "Add Seller"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Country</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Product</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSellers.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.country}</td>
                <td>{s.email}</td>
                <td>{s.phone}</td>
                <td>{s.product}</td>
                <td className="action-buttons">
                  <button 
                    style={{ backgroundColor: "#2b2b2b", color: "#c9a96e", marginRight: "8px" }}
                    onClick={() => navigate(`/sellers/${s.id}/documents`)}
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      setForm({
                        name: s.name,
                        country: s.country,
                        email: s.email,
                        phone: s.phone,
                        product: s.product
                      });
                      setEditId(s.id);
                      setSelectedFiles([]);
                      setFileError("");
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Sellers;