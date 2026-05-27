import { useEffect, useState } from "react";

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    bank_details: ""
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = () => {
    fetch("http://localhost:5000/companies")
      .then(res => res.json())
      .then(data => setCompanies(data));
  };

  const handleSubmit = async () => {
    await fetch("http://localhost:5000/companies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    fetchCompanies();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Companies</h2>

      {/* FORM */}
      <div style={{ marginBottom: "20px" }}>
        <input placeholder="Name"
          onChange={e => setForm({ ...form, name: e.target.value })} />

        <input placeholder="Address"
          onChange={e => setForm({ ...form, address: e.target.value })} />

        <input placeholder="Bank Details"
          onChange={e => setForm({ ...form, bank_details: e.target.value })} />

        <button onClick={handleSubmit}>Add Company</button>
      </div>

      {/* TABLE */}
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Bank Details</th>
          </tr>
        </thead>

        <tbody>
          {companies.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.address}</td>
              <td>{c.bank_details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Companies;