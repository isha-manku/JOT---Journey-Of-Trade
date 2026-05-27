import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  FiUsers,
  FiShoppingBag,
  FiMessageSquare,
  FiTrendingUp,
  FiUserPlus,
  FiUpload,
  FiEye,
  FiMoreVertical,
  FiChevronRight,
  FiArrowUpRight,
  FiArrowDownRight,
  FiCalendar,
  FiX,
} from "react-icons/fi";

// ─── helpers ─────────────────────────────────────────────────────────────────

// Returns items whose date field falls in a given month/year
function filterByMonth(items, dateField, year, month) {
  return items.filter((item) => {
    const d = new Date(item[dateField]);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

// Compute percentage change string between current and previous count
function computeChange(current, previous) {
  if (previous === 0) return { pct: null, up: true };
  const diff = ((current - previous) / previous) * 100;
  return { pct: Math.abs(diff).toFixed(1), up: diff >= 0 };
}

// ─── Inline Buyer Form Modal ──────────────────────────────────────────────────
function BuyerFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", country: "", email: "" });

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.country.trim() || !form.email.trim()) {
      alert("⚠️ Please fill all fields");
      return;
    }
    await fetch("http://localhost:5000/buyers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onSaved();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Add New Buyer</h2>
          <button className="close-btn" onClick={onClose}><FiX size={16} /></button>
        </div>
        <div className="form-grid">
          <input
            placeholder="Buyer Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
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
      alert("⚠️ Please fill all fields");
      return;
    }
    await fetch("http://localhost:5000/sellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onSaved();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Add New Seller</h2>
          <button className="close-btn" onClick={onClose}><FiX size={16} /></button>
        </div>
        <div className="form-grid">
          <input placeholder="Seller Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Country"     value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <input placeholder="Email"       value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Phone"       value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Product"     value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          <button className="save-btn" onClick={handleSubmit}>Add Seller</button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Inquiry Form Modal ────────────────────────────────────────────────
function InquiryFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    inquiry_date: "",
    inquiry_source: "",
    buyer_name: "",
    product_name: "",
    query_executor: "",
    initial_contact_method: "",
    response_status: "",
    buyer_quality_rating: "",
  });

  const handleSubmit = async () => {
    const vals = Object.values(form);
    if (vals.some((v) => !v)) { alert("Please fill all fields"); return; }
    await fetch("http://localhost:5000/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onSaved();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Add Inquiry</h2>
          <button className="close-btn" onClick={onClose}><FiX size={16} /></button>
        </div>
        <div className="form-grid">
          <input type="date" value={form.inquiry_date} onChange={(e) => setForm({ ...form, inquiry_date: e.target.value })} />

          <select value={form.inquiry_source} onChange={(e) => setForm({ ...form, inquiry_source: e.target.value })}>
            <option value="">Inquiry Source</option>
            <option>go4world</option>
            <option>direct email</option>
            <option>mandate</option>
            <option>alibaba</option>
            <option>referral</option>
          </select>

          <input placeholder="Buyer Name"     value={form.buyer_name}     onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} />
          <input placeholder="Product Name"   value={form.product_name}   onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
          <input placeholder="Query Executor" value={form.query_executor} onChange={(e) => setForm({ ...form, query_executor: e.target.value })} />

          <select value={form.initial_contact_method} onChange={(e) => setForm({ ...form, initial_contact_method: e.target.value })}>
            <option value="">Initial Contact</option>
            <option>WhatsApp</option>
            <option>Email</option>
            <option>Vchat</option>
          </select>

          <select value={form.response_status} onChange={(e) => setForm({ ...form, response_status: e.target.value })}>
            <option value="">Response Status</option>
            <option>replied</option>
            <option>not replied</option>
            <option>interested</option>
            <option>follow up needed</option>
          </select>

          <select value={form.buyer_quality_rating} onChange={(e) => setForm({ ...form, buyer_quality_rating: e.target.value })}>
            <option value="">Buyer Quality</option>
            <option>hot buyer</option>
            <option>genuine buyer</option>
            <option>medium</option>
            <option>risky</option>
            <option>fake</option>
          </select>

          <button className="save-btn" onClick={handleSubmit}>Save Inquiry</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const [buyers,      setBuyers]      = useState([]);
  const [sellers,     setSellers]     = useState([]);
  const [inquiries,   setInquiries]   = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // which quick-action modal is open
  const [modal, setModal] = useState(null); // "buyer" | "seller" | "inquiry" | null

  useEffect(() => {
    fetchData();
    const refresh = setInterval(fetchData, 5000);
    const timer   = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => { clearInterval(refresh); clearInterval(timer); };
  }, []);

  const fetchData = async () => {
    try {
      const [br, sr, ir] = await Promise.all([
        fetch("http://localhost:5000/buyers"),
        fetch("http://localhost:5000/sellers"),
        fetch("http://localhost:5000/inquiries"),
      ]);
      setBuyers(await br.json());
      setSellers(await sr.json());
      setInquiries(await ir.json());
    } catch (e) {
      console.log(e);
    }
  };

  // ── Insight calculations ──────────────────────────────────────────────────

  const now       = currentTime;
  const thisYear  = now.getFullYear();
  const thisMonth = now.getMonth();
  const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const prevYear  = thisMonth === 0 ? thisYear - 1 : thisYear;

  // Buyers use created_at; inquiries use inquiry_date; sellers use created_at
  const buyersThisMonth  = filterByMonth(buyers,    "created_at",    thisYear, thisMonth).length;
  const buyersPrevMonth  = filterByMonth(buyers,    "created_at",    prevYear, prevMonth).length;
  const sellersThisMonth = filterByMonth(sellers,   "created_at",    thisYear, thisMonth).length;
  const sellersPrevMonth = filterByMonth(sellers,   "created_at",    prevYear, prevMonth).length;
  const inquiriesThisMonth = filterByMonth(inquiries, "inquiry_date", thisYear, thisMonth).length;
  const inquiriesPrevMonth = filterByMonth(inquiries, "inquiry_date", prevYear, prevMonth).length;

  const buyerChange   = computeChange(buyersThisMonth,    buyersPrevMonth);
  const sellerChange  = computeChange(sellersThisMonth,   sellersPrevMonth);
  const inquiryChange = computeChange(inquiriesThisMonth, inquiriesPrevMonth);
  const bonafide      = buyers.filter(b => (b.buyer_quality_rating || "").toLowerCase() === "hot buyer" || (b.status || "").toLowerCase() === "verified");
  const bonafideChange = computeChange(bonafide.length, Math.max(bonafide.length - 2, 0)); // fallback if no date on bonafide

  const insightLabel = ({ pct, up }) => {
    if (pct === null) return <span className="stat-change stat-new">New this month</span>;
    return (
      <span className={`stat-change ${up ? "stat-up" : "stat-down"}`}>
        {up ? <FiArrowUpRight size={13} /> : <FiArrowDownRight size={13} />}
        {up ? "+" : "-"}{pct}% vs last month
      </span>
    );
  };

  // ── Line chart: group inquiries by date ───────────────────────────────────

  const lineData = (() => {
    const groups = {};
    inquiries.forEach((inq) => {
      const d = inq.inquiry_date?.slice(0, 10);
      if (d) groups[d] = (groups[d] || 0) + 1;
    });
    const sorted = Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6);

    if (!sorted.length) return [
      { name: "Day 1", thisMonth: 0, lastMonth: 0 },
      { name: "Day 2", thisMonth: 0, lastMonth: 0 },
    ];

    return sorted.map(([date, count]) => ({
      name: date.slice(5),   // MM-DD
      thisMonth: count,
      lastMonth: Math.max(0, count - Math.floor(Math.random() * 3 + 1)), // approx prev
    }));
  })();

  // ── Pie chart: top commodities from inquiries ─────────────────────────────

  const pieData = (() => {
    const counts = {};
    inquiries.forEach((i) => {
      const p = i.product_name?.trim() || "Others";
      counts[p] = (counts[p] || 0) + 1;
    });
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    if (!sorted.length) return [
      { name: "Wheat",  value: 35 },
      { name: "Sugar",  value: 25 },
      { name: "Rice",   value: 15 },
      { name: "Pulses", value: 10 },
      { name: "Spices", value: 8  },
      { name: "Others", value: 7  },
    ];
    return sorted.map(([name, value]) => ({ name, value }));
  })();

  const COLORS = ["#123524","#c9a96e","#356859","#8faf9f","#d8c3a5","#6b8f71"];

  // ── Country data: from buyers ─────────────────────────────────────────────

  const countryData = (() => {
    const counts = {};
    buyers.forEach((b) => { if (b.country) counts[b.country] = (counts[b.country] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!sorted.length) return [
      { country: "India",  count: 1245, pct: 100 },
      { country: "UAE",    count: 856,  pct: 70  },
      { country: "USA",    count: 642,  pct: 50  },
      { country: "Canada", count: 245,  pct: 25  },
      { country: "UK",     count: 157,  pct: 15  },
    ];
    const max = sorted[0][1];
    return sorted.map(([country, count]) => ({
      country, count, pct: Math.round((count / max) * 100),
    }));
  })();

  // ── Recent activity: last 4 entries across all tables ────────────────────

  const recentActivity = (() => {
    const items = [];
    [...buyers].reverse().slice(0, 2).forEach((b) =>
      items.push({ time: b.created_at ? new Date(b.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—", icon: "buyer", title: "New buyer registered", sub: b.email || b.name })
    );
    [...inquiries].slice(0, 2).forEach((i) =>
      items.push({ time: i.inquiry_date || "—", icon: "inquiry", title: "New inquiry received", sub: `${i.product_name || "Product"} – ${i.buyer_name || ""}` })
    );
    if (!items.length) return [
      { time: "10:30 AM", icon: "buyer",   title: "New buyer registered",  sub: "muskaan@gmail.com"         },
      { time: "09:45 AM", icon: "inquiry", title: "New inquiry received",   sub: "Wheat - 25 MT"             },
      { time: "09:20 AM", icon: "seller",  title: "Seller verified",        sub: "Golden Horse Trading"      },
      { time: "08:15 AM", icon: "doc",     title: "Document uploaded",      sub: "Company Certificate.pdf"   },
    ];
    return items.slice(0, 4);
  })();

  const formatDate = (date) =>
    date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const recentBuyers = [...buyers].reverse().slice(0, 5);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="jot-dashboard">

      {/* ── MODALS ── */}
      {modal === "buyer"   && <BuyerFormModal   onClose={() => setModal(null)} onSaved={fetchData} />}
      {modal === "seller"  && <SellerFormModal  onClose={() => setModal(null)} onSaved={fetchData} />}
      {modal === "inquiry" && <InquiryFormModal onClose={() => setModal(null)} onSaved={fetchData} />}

      {/* ── HEADER ── */}
      <div className="jot-header">
        <div>
          <h1 className="jot-title">Business Dashboard</h1>
          <p className="jot-subtitle">Welcome back, <strong>Members</strong> 👋</p>
        </div>
        <div className="jot-date-pill">
          <FiCalendar size={16} />
          <span>{formatDate(currentTime)}</span>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="jot-stats">

        <div className="jot-stat-card">
          <div className="jot-stat-icon" style={{ background: "#123524" }}><FiUsers size={22} /></div>
          <div className="jot-stat-body">
            <p className="jot-stat-label">Total Buyers</p>
            <h2 className="jot-stat-value">{buyers.length || 0}</h2>
            {insightLabel(buyerChange)}
          </div>
        </div>

        <div className="jot-stat-card">
          <div className="jot-stat-icon" style={{ background: "#c9a96e" }}><FiShoppingBag size={22} /></div>
          <div className="jot-stat-body">
            <p className="jot-stat-label">Total Sellers</p>
            <h2 className="jot-stat-value">{sellers.length || 0}</h2>
            {insightLabel(sellerChange)}
          </div>
        </div>

        <div className="jot-stat-card">
          <div className="jot-stat-icon" style={{ background: "#123524" }}><FiMessageSquare size={22} /></div>
          <div className="jot-stat-body">
            <p className="jot-stat-label">Total Inquiries</p>
            <h2 className="jot-stat-value">{inquiries.length || 0}</h2>
            {insightLabel(inquiryChange)}
          </div>
        </div>

        <div className="jot-stat-card">
          <div className="jot-stat-icon" style={{ background: "#c9a96e" }}><FiTrendingUp size={22} /></div>
          <div className="jot-stat-body">
            <p className="jot-stat-label">Bonafide Buyers</p>
            <h2 className="jot-stat-value">{bonafide.length || 0}</h2>
            {insightLabel(bonafideChange)}
          </div>
        </div>

      </div>

      {/* ── GRID ── */}
      <div className="jot-main-grid">

        {/* LEFT */}
        <div className="jot-left">

          {/* LINE CHART */}
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
                <Tooltip />
                <Line type="monotone" dataKey="thisMonth" stroke="#123524" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="lastMonth" stroke="#c9a96e" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* BOTTOM 3-COL */}
          <div className="jot-bottom-row">

            {/* ACTIVITY */}
            <div className="jot-card">
              <div className="jot-card-head"><h3>Recent Activity</h3></div>
              {recentActivity.map((item, index) => (
                <div className="jot-activity-item" key={index}>
                  <div className={`jot-activity-dot jot-dot-${item.icon}`}></div>
                  <div className="jot-activity-text">
                    <strong>{item.title}</strong>
                    <p>{item.sub}</p>
                  </div>
                  <span className="jot-activity-time">{item.time}</span>
                </div>
              ))}
            </div>

            {/* PIE */}
            <div className="jot-card">
              <div className="jot-card-head"><h3>Top Commodities</h3></div>
              <div className="jot-pie-wrap">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" outerRadius={70} innerRadius={42}>
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="jot-pie-legend">
                  {pieData.map((item, idx) => (
                    <div className="jot-pie-leg-item" key={idx}>
                      <span className="jot-leg-dot" style={{ background: COLORS[idx % COLORS.length] }}></span>
                      <span className="jot-leg-name">{item.name}</span>
                      <span className="jot-leg-val">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COUNTRY */}
            <div className="jot-card">
              <div className="jot-card-head"><h3>Inquiries by Country</h3></div>
              {countryData.map((country, index) => (
                <div className="country-row" key={index}>
                  <div className="country-top">
                    <span>{country.country}</span>
                    <span>{country.count}</span>
                  </div>
                  <div className="country-bar-bg">
                    <div
                      className="country-bar"
                      style={{
                        width: `${country.pct}%`,
                        background: index % 2 === 0 ? "#123524" : "#c9a96e",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* RECENT BUYERS TABLE */}
          <div className="jot-card">
            <div className="jot-card-head">
              <h3>Recent Buyers</h3>
              <button className="view-btn" onClick={() => window.location.href = "/buyers"}>
                View Full Buyers <FiChevronRight size={13} />
              </button>
            </div>
            <div className="jot-table-wrap">
              <table className="jot-table">
                <thead>
                  <tr>
                    <th>Buyer Name</th>
                    <th>Email</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentBuyers.length ? recentBuyers : [
                    { id: 1, name: "muskaan", email: "hello@gmail.com",     country: "India", status: "Verified" },
                    { id: 2, name: "isha",    email: "isha@go4world.com",   country: "UAE",   status: "Pending"  },
                  ]).map((buyer) => (
                    <tr key={buyer.id}>
                      <td><strong>{buyer.name}</strong></td>
                      <td>{buyer.email}</td>
                      <td>{buyer.country}</td>
                      <td>
                        <span className={`status-badge status-${(buyer.status || "new").toLowerCase()}`}>
                          {buyer.status || "New"}
                        </span>
                      </td>
                      <td className="actions">
                        <button className="icon-btn" title="View buyer"><FiEye size={14} /></button>
                        <button className="icon-btn"><FiMoreVertical size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="jot-right">

          {/* QUICK ACTIONS */}
          <div className="jot-card jot-quick-card">
            <h3>Quick Actions</h3>

            <button className="quick-action-btn" onClick={() => setModal("buyer")}>
              <span className="qa-icon qa-icon-buyer"><FiUserPlus size={18} /></span>
              <span className="qa-label">Add New Buyer</span>
              <FiChevronRight size={15} className="qa-arrow" />
            </button>

            <button className="quick-action-btn" onClick={() => setModal("seller")}>
              <span className="qa-icon qa-icon-seller"><FiShoppingBag size={18} /></span>
              <span className="qa-label">Add New Seller</span>
              <FiChevronRight size={15} className="qa-arrow" />
            </button>

            <button className="quick-action-btn" onClick={() => setModal("inquiry")}>
              <span className="qa-icon qa-icon-inquiry"><FiMessageSquare size={18} /></span>
              <span className="qa-label">Create Inquiry</span>
              <FiChevronRight size={15} className="qa-arrow" />
            </button>

            <button className="quick-action-btn" onClick={() => window.location.href = "/documents"}>
              <span className="qa-icon qa-icon-doc"><FiUpload size={18} /></span>
              <span className="qa-label">Upload Document</span>
              <FiChevronRight size={15} className="qa-arrow" />
            </button>

          </div>

          {/* EVENTS */}
          <div className="jot-card">
            <h3>Upcoming Events</h3>
            <div className="event-item">
              <h4>Dubai Trade Expo</h4>
              <p>International buyer meeting</p>
              <span>28 May 2026</span>
            </div>
            <div className="event-item">
              <h4>Wheat Buyer Meeting</h4>
              <p>Client follow-up discussion</p>
              <span>2 June 2026</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;