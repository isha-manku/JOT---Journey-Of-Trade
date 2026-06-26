import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiPlus, FiSearch, FiX, FiChevronDown,
  FiChevronUp, FiPackage, FiMapPin, FiMail, FiBriefcase,
  FiAlertCircle, FiDollarSign, FiAnchor,  FiTrash
} from "react-icons/fi";

const EMPTY_PRODUCT = {
  product: "",
  price: "",
  trial_qty: "",
  contract_qty: "",
  total_contract_price: "",
  destination_port: ""
};

const EMPTY_FORM = {
  buyer_name: "",
  company_name: "",
  address: "",
  email: "",
  country: "",
  notes: "",
  products: [{ ...EMPTY_PRODUCT }]
};

function BuyerAvatar({ name }) {
  const initials = name
    ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return <div className="buyer-avatar">{initials}</div>;
}

function Buyers() {
  const navigate = useNavigate();
  const location = useLocation();

  const [buyers, setBuyers]       = useState([]);
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [loading, setLoading]     = useState(false);

  useEffect(() => { fetchBuyers(); }, []);

  useEffect(() => {
    if (location.state?.openAddModal) {
      setForm(EMPTY_FORM);
      setEditId(null);
      setShowForm(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const fetchBuyers = () => {
    fetch("http://localhost:5000/buyers")
      .then(res => res.json())
      .then(data => {
        // Parse products JSON string if needed
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

  /* ── FORM HELPERS ── */
  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const setProduct = (idx, key, val) =>
    setForm(f => {
      const products = f.products.map((p, i) =>
        i === idx ? { ...p, [key]: val } : p
      );
      return { ...f, products };
    });

  const addProduct = () =>
    setForm(f => ({ ...f, products: [...f.products, { ...EMPTY_PRODUCT }] }));

  const removeProduct = idx =>
    setForm(f => ({
      ...f,
      products: f.products.filter((_, i) => i !== idx)
    }));

  /* ── SUBMIT ── */
  const handleSubmit = async () => {
    if (!form.buyer_name.trim() || !form.company_name.trim() || !form.email.trim() || !form.country.trim()) {
      alert("⚠️ Buyer Name, Company Name, Email and Country are required.");
      return;
    }
    for (let i = 0; i < form.products.length; i++) {
      if (!form.products[i].product.trim()) {
        alert(`⚠️ Please fill Product Name for product #${i + 1}`);
        return;
      }
    }

    setLoading(true);
    const payload = { ...form, products: JSON.stringify(form.products) };

    if (editId) {
      await fetch(`http://localhost:5000/buyers/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch("http://localhost:5000/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    setLoading(false);
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    fetchBuyers();
  };

  /* ── DELETE (soft delete → moves to recycle bin) ── */
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Move this buyer to the recycle bin?")) return;
    await fetch(`http://localhost:5000/buyers/${id}/delete`, { method: "POST" });
    if (expandedId === id) setExpandedId(null);
    fetchBuyers();
  };

  /* ── EDIT ── */
  const handleEdit = (b, e) => {
    e.stopPropagation();
    setForm({
      buyer_name:   b.buyer_name   || "",
      company_name: b.company_name || "",
      address:      b.address      || "",
      email:        b.email        || "",
      country:      b.country      || "",
      notes:        b.notes        || "",
      products:     b.products?.length ? b.products : [{ ...EMPTY_PRODUCT }]
    });
    setEditId(b.id);
    setShowForm(true);
  };

  

  /* ── FILTER ── */
  const filtered = buyers.filter(b =>
    (b.buyer_name   || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.email        || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.country       || "").toLowerCase().includes(search.toLowerCase())
  );

  /* ── OPEN FORM ── */
  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  };

  /* ══════════════════════════ RENDER ══════════════════════════ */
  return (
    <div className="buyers-page">

      {/* PAGE HEADER */}
      <div className="buyers-page-header">
        <div>
          <h1 className="buyers-page-title">Buyers</h1>
          <p className="buyers-page-sub">{buyers.length} buyer{buyers.length !== 1 ? "s" : ""} registered</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="comp-edit-btn"
            onClick={() => navigate("/buyers/recycle-bin")}
            title="View deleted buyers"
          >
            <FiTrash size={15} /> Recycle Bin
          </button>
          <button className="comp-add-btn" onClick={openAddForm}>
            <FiPlus size={16} /> Add Buyer
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="buyers-search-wrap">
        <FiSearch size={15} className="buyers-search-icon" />
        <input
          className="buyers-search"
          placeholder="Search by name, company or email…"
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

      {/* TABLE */}
      <div className="buyers-table-outer">
        <table className="buyers-table">
          <thead>
            <tr>
              <th style={{ width: 28 }}></th>
              <th>Buyer Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Country</th>
              <th>Address</th>
              <th>Products</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#aaa", padding: "40px" }}>
                  No buyers found.
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
                    <td>{b.country || "—"}</td>
                    <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {b.address || "—"}
                    </td>
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
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/buyers/${b.id}/documents`); }}
                        >
                          View Documents
                        </button>
                        <button
                          onClick={e => handleEdit(b, e)}
                        >
                          Edit
                        </button>
                        <button
                          onClick={e => handleDelete(b.id, e)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* EXPANDED DETAIL ROW */}
                  {isOpen && (
                    <tr key={`${b.id}-detail`} className="buyer-detail-row">
                      <td colSpan={7}>
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

      {/* ══════════ MODAL FORM ══════════ */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box buyers-modal">

            {/* HEADER */}
            <div className="modal-header">
              <h2>{editId ? "Edit Buyer" : "Add New Buyer"}</h2>
              <button
                className="close-btn"
                onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* ── SECTION 1: BUYER INFO ── */}
            <div className="buyers-form-section">
              <div className="buyers-form-title">
                <FiBriefcase size={14} /> Buyer Information
              </div>
              <div className="buyers-form-grid">
                <div className="buyers-field">
                  <label>Buyer Name *</label>
                  <input
                    placeholder="e.g. John Smith"
                    value={form.buyer_name}
                    onChange={e => setField("buyer_name", e.target.value)}
                  />
                </div>
                <div className="buyers-field">
                  <label>Company Name *</label>
                  <input
                    placeholder="e.g. Golden Horse Trading"
                    value={form.company_name}
                    onChange={e => setField("company_name", e.target.value)}
                  />
                </div>
                <div className="buyers-field">
                  <label>Email *</label>
                  <input
                    placeholder="e.g. buyer@company.com"
                    value={form.email}
                    onChange={e => setField("email", e.target.value)}
                  />
                </div>
                    <div className="buyers-field">
                  <label>Country*</label>
                  <input
                    placeholder="e.g. India"
                    value={form.country}
                    onChange={e => setField("country", e.target.value)}
                  />
                </div>
                <div className="buyers-field">
                  <label>Address</label>
                  <input
                    placeholder="e.g. Toronto, Canada"
                    value={form.address}
                    onChange={e => setField("address", e.target.value)}
                  />
                </div>
                <div className="buyers-field buyers-field-full buyers-field-note">
                  <label><FiAlertCircle size={11} /> Notes / Important Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Any important notes about this buyer…"
                    value={form.notes}
                    onChange={e => setField("notes", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 2: PRODUCTS ── */}
            <div className="buyers-form-section">
              <div className="buyers-products-head">
                <div className="buyers-form-title" style={{ marginBottom: 0 }}>
                  <FiPackage size={14} /> Products &amp; Trade Terms
                </div>
                <button className="buyers-add-product-btn" onClick={addProduct}>
                  <FiPlus size={13} /> Add Product
                </button>
              </div>

              {form.products.map((p, idx) => (
                <div key={idx} className="buyers-product-row">
                  <div className="buyers-product-num">{idx + 1}</div>
                  <div className="buyers-product-fields">
                    <div className="buyers-field">
                      <label>Product Name *</label>
                      <input
                        placeholder="e.g. Basmati Rice"
                        value={p.product}
                        onChange={e => setProduct(idx, "product", e.target.value)}
                      />
                    </div>
                    <div className="buyers-field">
                      <label><FiDollarSign size={10} /> Price (USD)</label>
                      <input
                        type="number"
                        placeholder="e.g. 850"
                        value={p.price}
                        onChange={e => setProduct(idx, "price", e.target.value)}
                      />
                    </div>
                    <div className="buyers-field">
                      <label>Trial Quantity</label>
                      <input
                        placeholder="e.g. 5 MT"
                        value={p.trial_qty}
                        onChange={e => setProduct(idx, "trial_qty", e.target.value)}
                      />
                    </div>
                    <div className="buyers-field">
                      <label>Contract Quantity</label>
                      <input
                        placeholder="e.g. 100 MT"
                        value={p.contract_qty}
                        onChange={e => setProduct(idx, "contract_qty", e.target.value)}
                      />
                    </div>
                    <div className="buyers-field">
                      <label><FiDollarSign size={10} /> Total Contract Price</label>
                      <input
                        type="number"
                        placeholder="e.g. 85000"
                        value={p.total_contract_price}
                        onChange={e => setProduct(idx, "total_contract_price", e.target.value)}
                      />
                    </div>
                    <div className="buyers-field">
                      <label><FiAnchor size={10} /> Destination Port</label>
                      <input
                        placeholder="e.g. Port of Vancouver"
                        value={p.destination_port}
                        onChange={e => setProduct(idx, "destination_port", e.target.value)}
                      />
                    </div>
                  </div>
                  {form.products.length > 1 && (
                    <button
                      className="buyers-remove-product"
                      title="Remove product"
                      onClick={() => removeProduct(idx)}
                    >
                      <FiX size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <div className="modal-footer">
              <button
                className="jot-cancel-btn"
                onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
              >
                Cancel
              </button>
              <button className="save-btn" style={{ gridColumn: "unset" }} onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving…" : editId ? "Update Buyer" : "Add Buyer"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Buyers;