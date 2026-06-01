import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  FiUsers, FiShoppingBag, FiMessageSquare, FiTrendingUp,
  FiArrowUpRight,
} from "react-icons/fi";

const COLORS = ["#0e2318","#c9a96e","#356859","#8faf9f","#d8c3a5","#6b8f71"];

// group array by a string field, return sorted [{name, value}]
function groupBy(arr, field) {
  const map = {};
  arr.forEach((item) => {
    const key = item[field]?.trim() || "Unknown";
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

// group by month from a date field  e.g. "2026-05-10" → "May"
function groupByMonth(arr, dateField) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const map = {};
  arr.forEach((item) => {
    const raw = item[dateField];
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d)) return;
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => new Date("1 " + a[0]) - new Date("1 " + b[0]))
    .map(([name, value]) => ({ name, value }));
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="jot-stat-card">
      <div className="jot-stat-icon" style={{ background: color }}>
        <Icon size={22} />
      </div>
      <div className="jot-stat-body">
        <p className="jot-stat-label">{label}</p>
        <h2 className="jot-stat-value">{value}</h2>
        <span className="stat-change stat-up">
          <FiArrowUpRight size={13} /> Live data
        </span>
      </div>
    </div>
  );
}

function Analytics() {
  const [buyers,    setBuyers]    = useState([]);
  const [sellers,   setSellers]   = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:5000/buyers").then(r => r.json()).catch(() => []),
      fetch("http://localhost:5000/sellers").then(r => r.json()).catch(() => []),
      fetch("http://localhost:5000/inquiries").then(r => r.json()).catch(() => []),
    ]).then(([b, s, i]) => {
      setBuyers(Array.isArray(b) ? b : []);
      setSellers(Array.isArray(s) ? s : []);
      setInquiries(Array.isArray(i) ? i : []);
      setLoading(false);
    });
  }, []);

  // ── derived data ────────────────────────────────────────────────────────
  const buyersByCountry   = groupBy(buyers,    "country");
  const sellersByCountry  = groupBy(sellers,   "country");
  const inquiryBySource   = groupBy(inquiries, "inquiry_source");
  const inquiryByProduct  = groupBy(inquiries, "product_name");
  const inquiryByStatus   = groupBy(inquiries, "response_status");
  const inquiryByQuality  = groupBy(inquiries, "buyer_quality_rating");
  const inquiriesOverTime = groupByMonth(inquiries, "inquiry_date");
  const buyersOverTime    = groupByMonth(buyers,    "created_at");

  // combined monthly trend
  const allMonths = Array.from(new Set([
    ...inquiriesOverTime.map(d => d.name),
    ...buyersOverTime.map(d => d.name),
  ])).sort((a, b) => new Date("1 " + a) - new Date("1 " + b));

  const trendData = allMonths.map(month => ({
    name: month,
    Inquiries: inquiriesOverTime.find(d => d.name === month)?.value || 0,
    Buyers:    buyersOverTime.find(d => d.name === month)?.value    || 0,
  }));

  if (loading) {
    return (
      <div style={{ padding: 40, color: "#0e2318", textAlign: "center" }}>
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="jot-dashboard">

      {/* HEADER */}
      <div className="jot-header">
        <div>
          <h1 className="jot-title">Analytics</h1>
          <p className="jot-subtitle">Live insights from your CRM data</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="jot-stats">
        <StatCard icon={FiUsers}        label="Total Buyers"    value={buyers.length}    color="#0e2318" />
        <StatCard icon={FiShoppingBag}  label="Total Sellers"   value={sellers.length}   color="#c9a96e" />
        <StatCard icon={FiMessageSquare}label="Total Inquiries" value={inquiries.length} color="#0e2318" />
        <StatCard
  icon={FiTrendingUp}
  label="Genuine Buyers"
  value={new Set(
    inquiries
      .filter(i => (i.buyer_quality_rating || "").toLowerCase() === "genuine buyer")
      .map(i => (i.buyer_name || "").toLowerCase().trim())
      .filter(Boolean)
  ).size}
  color="#c9a96e"
/>
      </div>

      {/* ROW 1: Trend + Inquiry Source */}
      <div className="ana-row">

        <div className="jot-card ana-card-lg">
          <div className="jot-card-head">
            <h3>Monthly Trend</h3>
            <div className="jot-legend">
              <span className="jot-legend-dot" style={{ background:"#0e2318" }}></span> Inquiries &nbsp;
              <span className="jot-legend-dot" style={{ background:"#c9a96e" }}></span> Buyers
            </div>
          </div>
          {trendData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#aaa" }} />
                <YAxis tick={{ fontSize: 11, fill: "#aaa" }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="Inquiries" stroke="#0e2318" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Buyers"    stroke="#c9a96e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="ana-empty">Not enough date data yet. Add created_at to buyers and inquiry_date to inquiries.</p>
          )}
        </div>

        <div className="jot-card ana-card-sm">
          <div className="jot-card-head"><h3>Inquiry Sources</h3></div>
          {inquiryBySource.length ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={inquiryBySource} dataKey="value" outerRadius={75} innerRadius={45}>
                    {inquiryBySource.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="jot-pie-legend">
                {inquiryBySource.map((item, i) => (
                  <div className="jot-pie-leg-item" key={i}>
                    <span className="jot-leg-dot" style={{ background: COLORS[i % COLORS.length] }}></span>
                    <span className="jot-leg-name">{item.name}</span>
                    <span className="jot-leg-val">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="ana-empty">No inquiry source data yet.</p>}
        </div>

      </div>

      {/* ROW 2: Top Products + Response Status + Quality */}
      <div className="ana-row-3">

        <div className="jot-card">
          <div className="jot-card-head"><h3>Top Products</h3></div>
          {inquiryByProduct.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={inquiryByProduct.slice(0, 7)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {inquiryByProduct.slice(0, 7).map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "#0e2318" : "#c9a96e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="ana-empty">No product data yet.</p>}
        </div>

        <div className="jot-card">
          <div className="jot-card-head"><h3>Response Status</h3></div>
          {inquiryByStatus.length ? (
            <>
              {inquiryByStatus.map((item, i) => {
                const max = inquiryByStatus[0].value;
                return (
                  <div className="country-row" key={i}>
                    <div className="country-top">
                      <span>{item.name}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="country-bar-bg">
                      <div
                        className="country-bar"
                        style={{
                          width: `${(item.value / max) * 100}%`,
                          background: i % 2 === 0 ? "#0e2318" : "#c9a96e",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          ) : <p className="ana-empty">No status data yet.</p>}
        </div>

        <div className="jot-card">
          <div className="jot-card-head"><h3>Buyer Quality</h3></div>
          {inquiryByQuality.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={inquiryByQuality}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {inquiryByQuality.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="ana-empty">No quality data yet.</p>}
        </div>

      </div>

      {/* ROW 3: Buyers by Country + Sellers by Country */}
      <div className="ana-row">

        <div className="jot-card ana-card-lg">
          <div className="jot-card-head"><h3>Buyers by Country</h3></div>
          {buyersByCountry.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={buyersByCountry.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0e2318" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="ana-empty">No buyer country data yet.</p>}
        </div>

        <div className="jot-card ana-card-sm">
          <div className="jot-card-head"><h3>Sellers by Country</h3></div>
          {sellersByCountry.length ? (
            <>
              {sellersByCountry.slice(0, 6).map((item, i) => {
                const max = sellersByCountry[0].value;
                return (
                  <div className="country-row" key={i}>
                    <div className="country-top">
                      <span>{item.name}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="country-bar-bg">
                      <div
                        className="country-bar"
                        style={{
                          width: `${(item.value / max) * 100}%`,
                          background: i % 2 === 0 ? "#c9a96e" : "#0e2318",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          ) : <p className="ana-empty">No seller country data yet.</p>}
        </div>

      </div>

    </div>
  );
}

export default Analytics;
