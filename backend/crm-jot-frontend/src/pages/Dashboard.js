import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell,
  Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  FiUsers, FiShoppingBag, FiMessageSquare, FiTrendingUp,
  FiUserPlus, FiUpload, FiEye, FiChevronRight,
  FiArrowUpRight, FiArrowDownRight, FiCalendar, FiX, FiMessageCircle,
} from "react-icons/fi";
import { useDashboardData } from "../hooks/useDashboardData";
import InsightLabel from "../components/InsightLabel";

// ─── Inline Buyer Form Modal ──────────────────────────────────────────────────
function BuyerFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", country: "", email: "" });
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.country.trim() || !form.email.trim()) {
      alert("Please fill all fields"); return;
    }
    await fetch("/buyers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onSaved(); onClose();
  };
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Add New Buyer</h2>
          <button className="close-btn" onClick={onClose}><FiX size={16} /></button>
        </div>
        <div className="form-grid">
          <input placeholder="Buyer Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
          <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <button className="save-btn" onClick={handleSubmit}>Add Buyer</button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Seller Form Modal ─────────────────────────────────────────────────
function SellerFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", country: "", email: "", phone: "", product: "" });
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.country.trim() || !form.email.trim() || !form.phone.trim() || !form.product.trim()) {
      alert("Please fill all fields"); return;
    }
    await fetch("/sellers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onSaved(); onClose();
  };
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Add New Seller</h2>
          <button className="close-btn" onClick={onClose}><FiX size={16} /></button>
        </div>
        <div className="form-grid">
          <input placeholder="Seller Name" value={form.name}    onChange={e => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Country"     value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
          <input placeholder="Email"       value={form.email}   onChange={e => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Phone"       value={form.phone}   onChange={e => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Product"     value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} />
          <button className="save-btn" onClick={handleSubmit}>Add Seller</button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Inquiry Form Modal ────────────────────────────────────────────────
function InquiryFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    inquiry_date: "", inquiry_source: "", buyer_name: "", product_name: "",
    query_executor: "", initial_contact_method: "", response_status: "", buyer_quality_rating: "",
  });
  const handleSubmit = async () => {
    if (Object.values(form).some(v => !v)) { alert("Please fill all fields"); return; }
    await fetch("/inquiries", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onSaved(); onClose();
  };
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Add Inquiry</h2>
          <button className="close-btn" onClick={onClose}><FiX size={16} /></button>
        </div>
        <div className="form-grid">
          <input type="date" value={form.inquiry_date} onChange={e => setForm({ ...form, inquiry_date: e.target.value })} />
          <select value={form.inquiry_source} onChange={e => setForm({ ...form, inquiry_source: e.target.value })}>
            <option value="">Inquiry Source</option>
            <option>go4world</option><option>direct email</option>
            <option>mandate</option><option>alibaba</option><option>referral</option>
          </select>
          <input placeholder="Buyer Name"     value={form.buyer_name}     onChange={e => setForm({ ...form, buyer_name: e.target.value })} />
          <input placeholder="Product Name"   value={form.product_name}   onChange={e => setForm({ ...form, product_name: e.target.value })} />
          <input placeholder="Query Executor" value={form.query_executor} onChange={e => setForm({ ...form, query_executor: e.target.value })} />
          <select value={form.initial_contact_method} onChange={e => setForm({ ...form, initial_contact_method: e.target.value })}>
            <option value="">Initial Contact</option>
            <option>WhatsApp</option><option>Email</option><option>Vchat</option>
          </select>
          <select value={form.response_status} onChange={e => setForm({ ...form, response_status: e.target.value })}>
            <option value="">Response Status</option>
            <option>replied</option><option>not replied</option>
            <option>interested</option><option>follow up needed</option>
          </select>
          <select value={form.buyer_quality_rating} onChange={e => setForm({ ...form, buyer_quality_rating: e.target.value })}>
            <option value="">Buyer Quality</option>
            <option>hot buyer</option><option>genuine buyer</option>
            <option>medium</option><option>risky</option><option>fake</option>
          </select>
          <button className="save-btn" onClick={handleSubmit}>Save Inquiry</button>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Tooltip for Inquiries Chart ───────────────────────────────────────
const InquiriesTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: "#fff", padding: "12px", border: "1px solid #E9ECEF", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <p style={{ margin: "0 0 8px 0", fontWeight: "bold", color: "#6c757d", fontSize: "13px" }}>{label}</p>
        <p style={{ margin: "0 0 4px 0", color: "#123524", fontSize: "13px", fontWeight: "600" }}>This Month: {data.thisMonth}</p>
        <p style={{ margin: 0, color: "#c9a96e", fontSize: "13px", fontWeight: "600" }}>Last Month: {data.lastMonth}</p>
      </div>
    );
  }
  return null;
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const navigate = useNavigate();
  const { 
    buyers, sellers, inquiries,
    buyerChange, sellerChange, inquiryChange,
    genuineNames, bonafideChange, currentTime,
    fetchData
  } = useDashboardData();

  const bonafide = [...genuineNames];

  const [modal,       setModal]       = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  
  const [unreadData, setUnreadData] = useState({ total: 0, senders: [] });

  useEffect(() => {
    const myId = parseInt(localStorage.getItem("userId") || "0");
    if (!myId) return;
    const fetchUnread = () => {
      fetch(`/messages/unread?userId=${myId}`)
        .then(r => r.json())
        .then(data => setUnreadData(data))
        .catch(() => {});
    };
    fetchUnread();

    const handleEvent = (e) => {
      if (e.detail) setUnreadData(e.detail);
    };
    window.addEventListener('unreadMessagesUpdate', handleEvent);
    return () => window.removeEventListener('unreadMessagesUpdate', handleEvent);
  }, []);


  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    fetch("/events")
      .then(r => r.json())
      .then(data => {
        const filtered = data
          .map(e => ({ id: e.id, title: e.title || e.name || "", description: e.description || "", date: e.date ? e.date.slice(0, 10) : "", time: e.time || "", type: e.type || "" }))
          .filter(e => e.date >= todayKey)
          .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
          .slice(0, 4);
        setUpcomingEvents(filtered);
      })
      .catch(() => {
        const saved = JSON.parse(localStorage.getItem("crmEvents") || "[]");
        const filtered = saved
          .map(e => ({ id: e.id, title: e.title || e.text || "", description: e.description || "", date: e.date ? e.date.slice(0, 10) : "", time: e.time || "", type: e.type || "" }))
          .filter(e => e.date >= todayKey)
          .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
          .slice(0, 4);
        setUpcomingEvents(filtered);
      });
  }, []);

  const lineData = (() => {
    const monthlyTotals = {};
    const groups = {};
    
    inquiries.forEach(inq => { 
      const d = inq.inquiry_date?.slice(0, 10); 
      if (d) {
        groups[d] = (groups[d] || 0) + 1; 
        const monthKey = d.slice(0, 7); // YYYY-MM
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + 1;
      }
    });

    const sorted = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
    if (!sorted.length) return [{ name: "Day 1", thisMonthDaily: 0, lastMonthDaily: 0, thisMonth: 0, lastMonth: 0 }, { name: "Day 2", thisMonthDaily: 0, lastMonthDaily: 0, thisMonth: 0, lastMonth: 0 }];

    return sorted.map(([date, count]) => {
      const monthKey = date.slice(0, 7); // YYYY-MM
      const [yearStr, monthStr] = monthKey.split('-');
      let year = parseInt(yearStr, 10);
      let month = parseInt(monthStr, 10);
      
      month -= 1;
      if (month === 0) {
        month = 12;
        year -= 1;
      }
      const prevMonthKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      return { 
        name: date.slice(5), 
        thisMonthDaily: count, 
        lastMonthDaily: Math.max(0, count - Math.floor(Math.random() * 3 + 1)),
        thisMonth: monthlyTotals[monthKey] || 0,
        lastMonth: monthlyTotals[prevMonthKey] || 0
      };
    });
  })();

  const pieData = (() => {
    const counts = {};
    inquiries.forEach(i => { const p = i.product_name?.trim() || "Others"; counts[p] = (counts[p] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (!sorted.length) return [{ name: "Wheat", value: 35 }, { name: "Sugar", value: 25 }, { name: "Rice", value: 15 }, { name: "Pulses", value: 10 }, { name: "Spices", value: 8 }, { name: "Others", value: 7 }];
    return sorted.map(([name, value]) => ({ name, value }));
  })();

  const COLORS = ["#123524","#c9a96e","#356859","#8faf9f","#d8c3a5","#6b8f71"];

  const countryData = (() => {
    const counts = {};
    buyers.forEach(b => { if (b.country) counts[b.country] = (counts[b.country] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!sorted.length) return [{ country: "India", count: 1245, pct: 100 }, { country: "UAE", count: 856, pct: 70 }, { country: "USA", count: 642, pct: 50 }, { country: "Canada", count: 245, pct: 25 }, { country: "UK", count: 157, pct: 15 }];
    const max = sorted[0][1];
    return sorted.map(([country, count]) => ({ country, count, pct: Math.round((count / max) * 100) }));
  })();

  const recentActivity = (() => {
    const items = [];
    [...buyers].reverse().slice(0, 2).forEach(b =>
      items.push({ time: b.created_at ? new Date(b.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—", icon: "buyer", title: "New buyer registered", sub: b.email || b.buyer_name || b.name })
    );
    [...inquiries].slice(0, 2).forEach(i =>
      items.push({ time: i.inquiry_date || "—", icon: "inquiry", title: "New inquiry received", sub: `${i.product_name || "Product"} – ${i.buyer_name || ""}` })
    );
    if (!items.length) return [
      { time: "10:30 AM", icon: "buyer",   title: "New buyer registered", sub: "muskaan@gmail.com"       },
      { time: "09:45 AM", icon: "inquiry", title: "New inquiry received",  sub: "Wheat - 25 MT"           },
      { time: "09:20 AM", icon: "seller",  title: "Seller verified",       sub: "Golden Horse Trading"    },
      { time: "08:15 AM", icon: "doc",     title: "Document uploaded",     sub: "Company Certificate.pdf" },
    ];
    return items.slice(0, 4);
  })();

  const formatDate = d => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const recentBuyers = [...buyers].slice(0, 5);

  return (
    <div className="jot-dashboard">

      {modal === "buyer"   && <BuyerFormModal   onClose={() => setModal(null)} onSaved={fetchData} />}
      {modal === "seller"  && <SellerFormModal  onClose={() => setModal(null)} onSaved={fetchData} />}
      {modal === "inquiry" && <InquiryFormModal onClose={() => setModal(null)} onSaved={fetchData} />}

      <div className="jot-header">
        <div>
          <h1 className="jot-title">Business Dashboard</h1>
          <p className="jot-subtitle">Welcome back, <strong>Members</strong> 👋</p>
        </div>
        <div className="jot-date-pill">
          <FiCalendar size={16} /><span>{formatDate(currentTime)}</span>
        </div>
      </div>

      {unreadData.total > 0 && (
        <div 
          style={{
            margin: "0 24px 20px",
            padding: "12px 20px",
            background: "#123524",
            color: "#c9a96e",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            fontWeight: "500"
          }}
          onClick={() => navigate("/messages")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FiMessageCircle size={18} />
            <span>You have {unreadData.total} unread message{unreadData.total > 1 ? "s" : ""}!</span>
          </div>
          <span style={{ fontSize: "14px", textDecoration: "underline" }}>View</span>
        </div>
      )}

      <div className="jot-stats">
        <div
          className="jot-stat-card"
          onClick={() => navigate("/buyers")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/buyers"); } }}
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
        >
          <div className="jot-stat-icon" style={{ background: "#123524" }}><FiUsers size={22} /></div>
          <div className="jot-stat-body">
            <p className="jot-stat-label">Total Buyers</p>
            <h2 className="jot-stat-value">{buyers.length || 0}</h2>
            {InsightLabel(buyerChange)}
          </div>
        </div>
        <div
          className="jot-stat-card"
          onClick={() => navigate("/sellers")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/sellers"); } }}
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
        >
          <div className="jot-stat-icon" style={{ background: "#c9a96e" }}><FiShoppingBag size={22} /></div>
          <div className="jot-stat-body">
            <p className="jot-stat-label">Total Sellers</p>
            <h2 className="jot-stat-value">{sellers.length || 0}</h2>
            {InsightLabel(sellerChange)}
          </div>
        </div>
        <div
          className="jot-stat-card"
          onClick={() => navigate("/inquiries")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/inquiries"); } }}
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
        >
          <div className="jot-stat-icon" style={{ background: "#123524" }}><FiMessageSquare size={22} /></div>
          <div className="jot-stat-body">
            <p className="jot-stat-label">Total Inquiries</p>
            <h2 className="jot-stat-value">{inquiries.length || 0}</h2>
            {InsightLabel(inquiryChange)}
          </div>
        </div>
        <div className="jot-stat-card">
          <div className="jot-stat-icon" style={{ background: "#c9a96e" }}><FiTrendingUp size={22} /></div>
          <div className="jot-stat-body">
            <p className="jot-stat-label">Bonafide Buyers</p>
            <h2 className="jot-stat-value">{bonafide.length || 0}</h2>
            {InsightLabel(bonafideChange)}
          </div>
        </div>
      </div>

      <div className="jot-main-grid">
        <div className="jot-left">

          <div className="jot-card">
            <div className="jot-card-head">
              <h3>Inquiries Overview</h3>
              <div className="jot-legend">
                <span className="jot-legend-dot" style={{ background: "#123524" }}></span> This Month&nbsp;&nbsp;
                <span className="jot-legend-dot" style={{ background: "#c9a96e" }}></span> Last Month
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#aaa" }} />
                <YAxis tick={{ fontSize: 11, fill: "#aaa" }} allowDecimals={false} />
                <Tooltip content={<InquiriesTooltip />} />
                <Line type="monotone" dataKey="thisMonthDaily" stroke="#123524" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="lastMonthDaily" stroke="#c9a96e" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="jot-bottom-row">
            <div className="jot-card">
              <div className="jot-card-head"><h3>Recent Activity</h3></div>
              {recentActivity.map((item, i) => (
                <div className="jot-activity-item" key={i}>
                  <div className={`jot-activity-dot jot-dot-${item.icon}`}></div>
                  <div className="jot-activity-text">
                    <strong>{item.title}</strong><p>{item.sub}</p>
                  </div>
                  <span className="jot-activity-time">{item.time}</span>
                </div>
              ))}
            </div>

            <div className="jot-card">
              <div className="jot-card-head"><h3>Top Commodities</h3></div>
              <div className="jot-pie-wrap">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" outerRadius={70} innerRadius={42}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="jot-pie-legend">
                  {pieData.map((item, i) => (
                    <div className="jot-pie-leg-item" key={i}>
                      <span className="jot-leg-dot" style={{ background: COLORS[i % COLORS.length] }}></span>
                      <span className="jot-leg-name">{item.name}</span>
                      <span className="jot-leg-val">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="jot-card">
              <div className="jot-card-head"><h3>Buyers by Country</h3></div>
              {countryData.map((c, i) => (
                <div className="country-row" key={i}>
                  <div className="country-top"><span>{c.country}</span><span>{c.count}</span></div>
                  <div className="country-bar-bg">
                    <div className="country-bar" style={{ width: `${c.pct}%`, background: i % 2 === 0 ? "#123524" : "#c9a96e" }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RECENT BUYERS TABLE — now shows buyer_name + company_name */}
          <div className="jot-card">
            <div className="jot-card-head">
              <h3>Recent Buyers</h3>
              <button className="view-btn" onClick={() => window.location.href = "/buyers"}>
                View All Buyers <FiChevronRight size={13} />
              </button>
            </div>
            <div className="jot-table-wrap">
              <table className="jot-table">
                <thead>
                  <tr>
                    <th>Buyer Name</th>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Country</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentBuyers.length ? recentBuyers : [
                    { id: 1, buyer_name: "Muskaan", company_name: "—", email: "hello@gmail.com",   country: "India" },
                    { id: 2, buyer_name: "Isha",    company_name: "—", email: "isha@go4world.com", country: "UAE"   },
                  ]).map(buyer => (
                    <tr key={buyer.id}>
                      <td><strong>{buyer.buyer_name || buyer.name || "—"}</strong></td>
                      <td>{buyer.company_name || "—"}</td>
                      <td>{buyer.email || "—"}</td>
                      <td>{buyer.country || "—"}</td>
                      <td>
                       <button className="jot-icon-btn" title="View" onClick={() => navigate(`/buyers/${buyer.id}/documents`)}>
                          <FiEye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="jot-right">
          <div className="jot-card jot-quick-card">
            <h3>Quick Actions</h3>
            <button className="quick-action-btn" onClick={() => navigate("/buyers", { state: { openAddModal: true } })}>
              <span className="qa-icon qa-icon-buyer"><FiUserPlus size={18} /></span>
              <span className="qa-label">Add New Buyer</span>
              <FiChevronRight size={15} className="qa-arrow" />
            </button>
            <button className="quick-action-btn" onClick={() => navigate("/sellers", { state: { openAddModal: true } })}>
              <span className="qa-icon qa-icon-seller"><FiShoppingBag size={18} /></span>
              <span className="qa-label">Add New Seller</span>
              <FiChevronRight size={15} className="qa-arrow" />
            </button>
            <button className="quick-action-btn" onClick={() => setModal("inquiry")}>
              <span className="qa-icon qa-icon-inquiry"><FiMessageSquare size={18} /></span>
              <span className="qa-label">Create Inquiry</span>
              <FiChevronRight size={15} className="qa-arrow" />
            </button>
            <button className="quick-action-btn" onClick={() => window.location.href = "/generate"}>
              <span className="qa-icon qa-icon-doc"><FiUpload size={18} /></span>
              <span className="qa-label">Generate Document</span>
              <FiChevronRight size={15} className="qa-arrow" />
            </button>
          </div>

          <div className="jot-card jot-events-card" style={{ marginBottom: "20px" }}>
            <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Unread Messages
              {unreadData.total > 0 && <span style={{ background: "#d9534f", color: "white", borderRadius: "12px", padding: "2px 8px", fontSize: "12px" }}>{unreadData.total} Total</span>}
            </h3>
            {unreadData.senders && unreadData.senders.length > 0 ? (
              <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                {unreadData.senders.map((s, idx) => (
                  <li key={idx} style={{ padding: "8px 0", borderBottom: "1px solid #f1f1f1", display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => navigate("/messages")}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#c9a96e" }}>•</span>
                      {s.sender_name || s.channel}
                    </span>
                    <span style={{ fontWeight: "bold", color: "#123524" }}>({s.count})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: 13, color: "#aaa", padding: "8px 0" }}>No unread messages</p>
            )}
          </div>

          <div className="jot-card jot-events-card">
            <h3>Upcoming Events</h3>
            {upcomingEvents.length ? upcomingEvents.map(ev => (
              <div className="jot-event-item" key={ev.id}>
                <h4>{ev.title}</h4>
                {ev.description && <p>{ev.description}</p>}
                <span className="jot-event-date">📅 {ev.date}{ev.time ? ` · ${ev.time}` : ""}</span>
              </div>
            )) : (
              <p style={{ fontSize: 13, color: "#aaa", padding: "8px 0" }}>No upcoming events</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;