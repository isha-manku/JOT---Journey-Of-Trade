import { useEffect, useState } from "react";
import {
  FiPlus, FiX, FiEdit2, FiTrash2, FiSearch,
  FiMapPin, FiCreditCard, FiBriefcase, FiChevronRight,
  FiPhone, FiMail, FiGlobe, FiUser
} from "react-icons/fi";

// FiBriefcase is used in place of FiBuilding (not available in this react-icons version)
const FiBuilding = FiBriefcase;

function Companies() {
  const [companies, setCompanies]   = useState([]);
  const [search,    setSearch]      = useState("");
  const [showForm,  setShowForm]    = useState(false);
  const [editId,    setEditId]      = useState(null);
  const [selected,  setSelected]    = useState(null);
  const [form, setForm] = useState({
    name: "", address: "", bank_details: "",
    email: "", phone: "", website: "", contact_person: "", industry: ""
  });

 // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = () => {
    fetch("http://localhost:5000/companies")
      .then(r => r.json())
      .then(data => {
        setCompanies(data);
        if (data.length && !selected) setSelected(data[0]);
      })
      .catch(() => {});
  };

  const resetForm = () => setForm({
    name: "", address: "", bank_details: "",
    email: "", phone: "", website: "", contact_person: "", industry: ""
  });

  const openAdd = () => { resetForm(); setEditId(null); setShowForm(true); };

  const openEdit = (c) => {
    setForm({
      name:           c.name           || "",
      address:        c.address        || "",
      bank_details:   c.bank_details   || "",
      email:          c.email          || "",
      phone:          c.phone          || "",
      website:        c.website        || "",
      contact_person: c.contact_person || "",
      industry:       c.industry       || "",
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      alert("Name and Address are required"); return;
    }
    if (editId) {
      await fetch(`http://localhost:5000/companies/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("http://localhost:5000/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false); resetForm(); setEditId(null);
    fetchCompanies();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this company?")) return;
    await fetch(`http://localhost:5000/companies/${id}`, { method: "DELETE" })
      .catch(() => {});
    setSelected(null);
    fetchCompanies();
  };

  const filtered = companies.filter(c =>
    [c.name, c.address, c.industry].some(f =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  // Avatar initials + color
  const avatarColor = (name = "") => {
    const colors = ["#123524","#c9a96e","#356859","#8faf9f","#1d3b2f","#6b8f71"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = (name = "") =>
    name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("");

  return (
    <div className="comp-page">

      {/* ── MODAL FORM ── */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box comp-modal">
            <div className="modal-header">
              <h2>{editId ? "Edit Company" : "Add New Company"}</h2>
              <button className="close-btn" onClick={() => { setShowForm(false); resetForm(); }}>
                <FiX size={16} />
              </button>
            </div>

            <div className="comp-form-grid">
              <div className="comp-form-section">
                <h4 className="comp-form-section-title">Basic Info</h4>
                <div className="comp-field">
                  <label><FiBuilding size={12} /> Company Name *</label>
                  <input placeholder="e.g. Golden Horse Trading"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="comp-field">
                  <label>Industry</label>
                  <select value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}>
                    <option value="">Select Industry</option>
                    <option>Agriculture & Commodities</option>
                    <option>Import / Export</option>
                    <option>Trading</option>
                    <option>Manufacturing</option>
                    <option>Logistics</option>
                    <option>Finance</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="comp-field">
                  <label><FiMapPin size={12} /> Address *</label>
                  <textarea placeholder="Full company address" rows={3}
                    value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>

              <div className="comp-form-section">
                <h4 className="comp-form-section-title">Contact Details</h4>
                <div className="comp-field">
                  <label><FiUser size={12} /> Contact Person</label>
                  <input placeholder="e.g. isha "
                    value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
                </div>
                <div className="comp-field">
                  <label><FiMail size={12} /> Email</label>
                  <input placeholder="company@email.com" type="email"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="comp-field">
                  <label><FiPhone size={12} /> Phone</label>
                  <input placeholder="+91 XXXXXXXXXX"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="comp-field">
                  <label><FiGlobe size={12} /> Website</label>
                  <input placeholder="https://yourcompany.com"
                    value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
                </div>
              </div>

              <div className="comp-form-section comp-form-full">
                <h4 className="comp-form-section-title"><FiCreditCard size={12} /> Bank Details</h4>
                <div className="comp-field">
                  <textarea placeholder="Bank name, account number, SWIFT/IBAN, branch details..." rows={4}
                    value={form.bank_details} onChange={e => setForm({ ...form, bank_details: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="jot-cancel-btn" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
              <button className="save-btn" onClick={handleSubmit}>
                {editId ? "Update Company" : "Add Company"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="comp-page-header">
        <div>
          <h1 className="comp-page-title">Companies</h1>
          <p className="comp-page-sub">{companies.length} registered {companies.length === 1 ? "company" : "companies"}</p>
        </div>
        <button className="comp-add-btn" onClick={openAdd}>
          <FiPlus size={15} /> Add Company
        </button>
      </div>

      {/* ── BODY: LIST + DETAIL ── */}
      <div className="comp-layout">

        {/* LEFT: Company List */}
        <div className="comp-list-col">
          <div className="comp-search-wrap">
            <FiSearch size={14} className="comp-search-icon" />
            <input
              className="comp-search"
              placeholder="Search companies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <FiX size={14} className="comp-search-clear" onClick={() => setSearch("")} />}
          </div>

          <div className="comp-list">
            {filtered.length ? filtered.map(c => (
              <div
                key={c.id}
                className={`comp-list-item ${selected?.id === c.id ? "comp-list-active" : ""}`}
                onClick={() => setSelected(c)}
              >
                <div className="comp-list-avatar" style={{ background: avatarColor(c.name) }}>
                  {initials(c.name)}
                </div>
                <div className="comp-list-info">
                  <strong>{c.name}</strong>
                  <span>{c.industry || "Company"}</span>
                </div>
                <FiChevronRight size={14} className="comp-list-arrow" />
              </div>
            )) : (
              <div className="comp-empty-list">
                <FiBuilding size={28} />
                <p>No companies found</p>
                <button className="comp-add-btn" style={{ marginTop: 10 }} onClick={openAdd}>
                  <FiPlus size={13} /> Add First Company
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Company Detail */}
        <div className="comp-detail-col">
          {selected ? (
            <div className="comp-detail">

              {/* Detail Header */}
              <div className="comp-detail-header">
                <div className="comp-detail-avatar" style={{ background: avatarColor(selected.name) }}>
                  {initials(selected.name)}
                </div>
                <div className="comp-detail-title-wrap">
                  <h2>{selected.name}</h2>
                  {selected.industry && (
                    <span className="comp-industry-badge">{selected.industry}</span>
                  )}
                </div>
                <div className="comp-detail-actions">
                  <button className="comp-edit-btn" onClick={() => openEdit(selected)}>
                    <FiEdit2 size={14} /> Edit
                  </button>
                  <button className="comp-delete-btn" onClick={() => handleDelete(selected.id)}>
                    <FiTrash2 size={14} /> Delete
                  </button>
                </div>
              </div>

              {/* Info Cards Row */}
              <div className="comp-info-grid">

                <div className="comp-info-card">
                  <div className="comp-info-icon" style={{ background: "#d1fae5", color: "#065f46" }}>
                    <FiMapPin size={18} />
                  </div>
                  <div>
                    <label>Address</label>
                    <p>{selected.address || "—"}</p>
                  </div>
                </div>

                <div className="comp-info-card">
                  <div className="comp-info-icon" style={{ background: "#dbeafe", color: "#1e40af" }}>
                    <FiUser size={18} />
                  </div>
                  <div>
                    <label>Contact Person</label>
                    <p>{selected.contact_person || "—"}</p>
                  </div>
                </div>

                <div className="comp-info-card">
                  <div className="comp-info-icon" style={{ background: "#fef3c7", color: "#92400e" }}>
                    <FiMail size={18} />
                  </div>
                  <div>
                    <label>Email</label>
                    <p>{selected.email
                      ? <a href={`mailto:${selected.email}`}>{selected.email}</a>
                      : "—"}
                    </p>
                  </div>
                </div>

                <div className="comp-info-card">
                  <div className="comp-info-icon" style={{ background: "#ede9fe", color: "#5b21b6" }}>
                    <FiPhone size={18} />
                  </div>
                  <div>
                    <label>Phone</label>
                    <p>{selected.phone || "—"}</p>
                  </div>
                </div>

                <div className="comp-info-card">
                  <div className="comp-info-icon" style={{ background: "#f0fdf4", color: "#166534" }}>
                    <FiGlobe size={18} />
                  </div>
                  <div>
                    <label>Website</label>
                    <p>{selected.website
                      ? <a href={selected.website} target="_blank" rel="noreferrer">{selected.website}</a>
                      : "—"}
                    </p>
                  </div>
                </div>

              </div>

              {/* Bank Details */}
              <div className="comp-bank-card">
                <div className="comp-bank-header">
                  <FiCreditCard size={16} />
                  <h3>Bank Details</h3>
                </div>
                {selected.bank_details ? (
                  <div className="comp-bank-body">
                    {selected.bank_details.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="comp-bank-empty">No bank details added yet.</p>
                )}
              </div>

            </div>
          ) : (
            <div className="comp-detail-empty">
              <FiBuilding size={48} />
              <h3>Select a Company</h3>
              <p>Click a company from the list to view its details</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Companies;