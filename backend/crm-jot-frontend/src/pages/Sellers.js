import { useEffect, useState } from "react";

function Sellers() {
  const [sellers, setSellers]   = useState([]);
  const [editId, setEditId]     = useState(null);
  const [search, setSearch]     = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    country: "",
    email: "",
    phone: "",
    product: ""
  });

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = () => {
    fetch("http://localhost:5000/sellers")
      .then(res => res.json())
      .then(data => setSellers(data));
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

    if (editId) {
      await fetch(`http://localhost:5000/sellers/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      setEditId(null);
    } else {
      await fetch("http://localhost:5000/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
    }

    setForm({ name: "", country: "", email: "", phone: "", product: "" });
    setShowForm(false);
    fetchSellers();
  };

  // DELETE
  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/sellers/${id}`, { method: "DELETE" });
    fetchSellers();
  };

  // SEARCH
  const filteredSellers = sellers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card">

      {/* TOP BAR */}
      <div className="table-top-bar">
        <input
          className="search-input"
          placeholder="Search Seller..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="add-btn"
          onClick={() => {
            setForm({ name: "", country: "", email: "", phone: "", product: "" });
            setEditId(null);
            setShowForm(true);
          }}
        >
          + Add Seller
        </button>
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
              <button className="save-btn" onClick={handleSubmit}>
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
                  <button onClick={() => handleDelete(s.id)}>Delete</button>
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
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
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