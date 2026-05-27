import { useEffect, useState } from "react";

function Buyers() {
  const [buyers, setBuyers]     = useState([]);
  const [editId, setEditId]     = useState(null);
  const [search, setSearch]     = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    country: "",
    email: ""
  });

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = () => {
    fetch("http://localhost:5000/buyers")
      .then(res => res.json())
      .then(data => setBuyers(data));
  };

  // ADD + UPDATE
  const handleSubmit = async () => {
    if (
      !form.name.trim() ||
      !form.country.trim() ||
      !form.email.trim()
    ) {
      alert("⚠️ Please fill all fields");
      return;
    }

    if (editId) {
      await fetch(`http://localhost:5000/buyers/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      setEditId(null);
    } else {
      await fetch("http://localhost:5000/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
    }

    setForm({ name: "", country: "", email: "" });
    setShowForm(false);
    fetchBuyers();
  };

  // DELETE
  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/buyers/${id}`, { method: "DELETE" });
    fetchBuyers();
  };

  // SEARCH
  const filteredBuyers = buyers.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card">

      {/* TOP BAR */}
      <div className="table-top-bar">
        <input
          className="search-input"
          placeholder="Search Buyer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="add-btn"
          onClick={() => {
            setForm({ name: "", country: "", email: "" });
            setEditId(null);
            setShowForm(true);
          }}
        >
          + Add Buyer
        </button>
      </div>

      {/* POPUP FORM */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box">

            <div className="modal-header">
              <h2>{editId ? "Edit Buyer" : "Add Buyer"}</h2>
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
              <button className="save-btn" onClick={handleSubmit}>
                {editId ? "Update Buyer" : "Add Buyer"}
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBuyers.map(b => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.country}</td>
                <td>{b.email}</td>
                <td className="action-buttons">
                  <button onClick={() => handleDelete(b.id)}>Delete</button>
                  <button
                    onClick={() => {
                      setForm({ name: b.name, country: b.country, email: b.email });
                      setEditId(b.id);
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

export default Buyers;