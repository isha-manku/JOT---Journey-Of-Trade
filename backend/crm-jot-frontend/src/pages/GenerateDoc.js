import { useEffect, useState } from "react";

function GenerateDoc() {
  const [buyers, setBuyers] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/buyers")
      .then(res => res.json())
      .then(setBuyers);

    fetch("http://localhost:5000/companies")
      .then(res => res.json())
      .then(setCompanies);
  }, []);

  return (
    <div>
      <h2>Generate Document</h2>

      <select>
        <option>Select Buyer</option>
        {buyers.map(b => (
          <option key={b.id}>{b.name}</option>
        ))}
      </select>

      <br /><br />

      <select>
        <option>Select Company</option>
        {companies.map(c => (
          <option key={c.id}>{c.name}</option>
        ))}
      </select>

      <br /><br />

      <select>
        <option>FCO</option>
        <option>SCO</option>
        <option>Invoice</option>
      </select>

      <br /><br />

      <button>Generate</button>
    </div>
  );
}

export default GenerateDoc;