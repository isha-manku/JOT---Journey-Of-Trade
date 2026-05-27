import { useEffect, useState } from "react";

function Inquiries() {

  const [inquiries, setInquiries] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // USER ROLE
  const role = localStorage.getItem("role");

  const [form, setForm] = useState({
    inquiry_date: "",
    inquiry_source: "",
    buyer_name: "",
    product_name: "",
    query_executor: "",
    initial_contact_method: "",
    response_status: "",
    buyer_quality_rating: ""
  });

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = () => {
    fetch("http://localhost:5000/inquiries")
      .then(res => res.json())
      .then(data => setInquiries(data));
  };

  // ADD + UPDATE INQUIRY
  const handleSubmit = async () => {

    if (
      !form.inquiry_date ||
      !form.inquiry_source ||
      !form.buyer_name ||
      !form.product_name ||
      !form.query_executor ||
      !form.initial_contact_method ||
      !form.response_status ||
      !form.buyer_quality_rating
    ) {
      alert("Please fill all fields");
      return;
    }

    if (editId) {

      await fetch(`http://localhost:5000/inquiries/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      setEditId(null);

    } else {

      await fetch("http://localhost:5000/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
    }

    // RESET FORM 
    setForm({
      inquiry_date: "",
      inquiry_source: "",
      buyer_name: "",
      product_name: "",
      query_executor: "",
      initial_contact_method: "",
      response_status: "",
      buyer_quality_rating: ""
    });

    setShowForm(false);

    fetchInquiries();
  };

  // DELETE
  const handleDelete = async (id) => {

    await fetch(`http://localhost:5000/inquiries/${id}`, {
      method: "DELETE"
    });

    fetchInquiries();
  };

  // SEARCH
const filteredInquiries = inquiries.filter(i => {

  const query = search.toLowerCase();

  return (

    i.inquiry_date?.toLowerCase().includes(query) ||
    i.inquiry_source?.toLowerCase().includes(query) ||
    i.buyer_name?.toLowerCase().includes(query) ||
    i.product_name?.toLowerCase().includes(query) ||
    i.query_executor?.toLowerCase().includes(query) ||
    i.initial_contact_method?.toLowerCase().includes(query) ||
    i.response_status?.toLowerCase().includes(query) ||
    i.buyer_quality_rating?.toLowerCase().includes(query) ||
    i.remarks?.toLowerCase().includes(query)

  );

});

  return (
    <div className="card">

    
     {/* TOP SECTION */}
<div className="table-top-bar">

  <input
    className="search-input"
    placeholder="Search Query..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <button
    className="add-btn"
    onClick={() => {
      setShowForm(true);
      setEditId(null);
    }}
  >
    + Add Inquiry
  </button>

</div>
      {/* POPUP FORM */}
      {showForm && (

        <div className="modal-overlay">

          <div className="modal-box">

            {/* HEADER */}
            <div className="modal-header">

              <h2>
                {editId ? "Edit Inquiry" : "Add Inquiry"}
              </h2>

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

            {/* FORM */}
            <div className="form-grid">

              <input
                type="date"
                value={form.inquiry_date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    inquiry_date: e.target.value
                  })
                }
              />

              <select
                value={form.inquiry_source}
                onChange={(e) =>
                  setForm({
                    ...form,
                    inquiry_source: e.target.value
                  })
                }
              >
                <option value="">Inquiry Source</option>
                <option>go4world</option>
                <option>direct email</option>
                <option>mandate</option>
                <option>alibaba</option>
                <option>referral</option>
              </select>

              <input
                placeholder="Buyer Name"
                value={form.buyer_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    buyer_name: e.target.value
                  })
                }
              />

              <input
                placeholder="Product Name"
                value={form.product_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    product_name: e.target.value
                  })
                }
              />

              <input
                placeholder="Query Executor"
                value={form.query_executor}
                onChange={(e) =>
                  setForm({
                    ...form,
                    query_executor: e.target.value
                  })
                }
              />

              <select
                value={form.initial_contact_method}
                onChange={(e) =>
                  setForm({
                    ...form,
                    initial_contact_method: e.target.value
                  })
                }
              >
                <option value="">Initial Contact</option>
                <option>WhatsApp</option>
                <option>Email</option>
                <option>Vchat</option>
              </select>

              <select
                value={form.response_status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    response_status: e.target.value
                  })
                }
              >
                <option value="">Response Status</option>
                <option>replied</option>
                <option>not replied</option>
                <option>interested</option>
                <option>follow up needed</option>
              </select>

              <select
                value={form.buyer_quality_rating}
                onChange={(e) =>
                  setForm({
                    ...form,
                    buyer_quality_rating: e.target.value
                  })
                }
              >
                <option value="">Buyer Quality</option>
                <option>hot buyer</option>
                <option>genuine buyer</option>
                <option>medium</option>
                <option>risky</option>
                <option>fake</option>
              </select>

              <button
                className="save-btn"
                onClick={handleSubmit}
              >
                {editId ? "Update Inquiry" : "Save Inquiry"}
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
              <th>Date</th>
              <th>Source</th>
              <th>Buyer</th>
              <th>Product</th>
              <th>Executor</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Quality</th>
              <th>Remarks</th>
              <th>Done</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {filteredInquiries.map(i => (

              <tr key={i.id}>

                <td>{i.inquiry_date}</td>
                <td>{i.inquiry_source}</td>
                <td>{i.buyer_name}</td>
                <td>{i.product_name}</td>
                <td>{i.query_executor}</td>
                <td>{i.initial_contact_method}</td>
                <td>{i.response_status}</td>
                <td>{i.buyer_quality_rating}</td>

                {/* REMARKS */}
                <td>

                  {role === "admin" ? (

                    <input
                      type="text"
                      value={i.remarks || ""}
                      placeholder="Add remark"

                      onChange={async (e) => {

                        const updatedRemark = e.target.value;

                        setInquiries(prev =>
                          prev.map(item =>
                            item.id === i.id
                              ? {
                                  ...item,
                                  remarks: updatedRemark
                                }
                              : item
                          )
                        );
                        await fetch(`http://localhost:5000/inquiries/${i.id}`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({
                            ...i,
                            remarks: updatedRemark
                          })
                        });
                      }}
                    />

                  ) : (

                    <div className="remark-view">
                      {i.remarks || "No Remarks"}
                    </div>

                  )}

                </td>

                {/* CHECKBOX */}
                <td>
                  
                 <input
                    type="checkbox"
                    checked={i.remark_done || false}
                    onChange={async (e) => {

                      const checkedValue = e.target.checked;

                      setInquiries(prev =>
                        prev.map(item =>
                          item.id === i.id
                            ? { ...item, remark_done: checkedValue }
                            : item
                        )
                      );

                      await fetch(`http://localhost:5000/inquiries/${i.id}`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                          ...i,
                          remark_done: checkedValue
                        })
                      });
                    }}
                  />

                </td>

                {/* ACTIONS */}
                <td className="action-buttons">

                  <button
                    onClick={() => handleDelete(i.id)}
                  >
                    Delete
                  </button>

                  <button
                    onClick={() => {

                      setForm({
                        inquiry_date: i.inquiry_date,
                        inquiry_source: i.inquiry_source,
                        buyer_name: i.buyer_name,
                        product_name: i.product_name,
                        query_executor: i.query_executor,
                        initial_contact_method: i.initial_contact_method,
                        response_status: i.response_status,
                        buyer_quality_rating: i.buyer_quality_rating
                      });

                      setEditId(i.id);

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

export default Inquiries;