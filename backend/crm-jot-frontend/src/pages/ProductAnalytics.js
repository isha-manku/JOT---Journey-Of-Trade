import { useEffect, useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { FiPackage, FiTrendingUp, FiUsers, FiShoppingBag } from "react-icons/fi";

// ── Brand colours ─────────────────────────────────────────────────────────────
const COLORS = ["#0e2318","#c9a96e","#356859","#8faf9f","#d8c3a5","#6b8f71","#a0785a","#1d3b2f","#e8d5a3","#4a7c59"];

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #ede9df", borderRadius: 10,
      padding: "10px 14px", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
    }}>
      {label && <p style={{ fontWeight: 700, color: "#0e2318", marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#0e2318", margin: "2px 0" }}>
          <strong>{p.name}:</strong> {p.value}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0].payload;
  return (
    <div style={{
      background: "#fff", border: "1px solid #ede9df", borderRadius: 10,
      padding: "10px 14px", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
    }}>
      <p style={{ fontWeight: 700, color: "#0e2318" }}>{name}</p>
      <p style={{ color: "#555" }}>Count: <strong>{value}</strong></p>
      <p style={{ color: "#888" }}>{(percent * 100).toFixed(1)}% of total</p>
    </div>
  );
};

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 18, padding: "20px 22px",
      display: "flex", alignItems: "center", gap: 16,
      boxShadow: "0 2px 12px rgba(0,0,0,0.05)"
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: 14,
        background: color, display: "flex", alignItems: "center",
        justifyContent: "center", color: "#fff", flexShrink: 0
      }}>
        <Icon size={22} />
      </div>
      <div>
        <p style={{ fontSize: 12, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: "#0e2318", lineHeight: 1.1 }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Section card wrapper ───────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children, fullWidth }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 20, padding: 24,
      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      gridColumn: fullWidth ? "1 / -1" : undefined,
      display: "flex", flexDirection: "column", gap: 16
    }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0e2318", marginBottom: 2 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: "#aaa" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Custom legend for pie ──────────────────────────────────────────────────────
function PieLegend({ data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0, display: "inline-block" }} />
          <span style={{ flex: 1, color: "#444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
          <span style={{ fontWeight: 700, color: "#0e2318" }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Ranking table ──────────────────────────────────────────────────────────────
function RankTable({ data, label }) {
  const max = data[0]?.value || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.slice(0, 8).map((item, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#333" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%", fontSize: 11, fontWeight: 700,
                background: i === 0 ? "#c9a96e" : i === 1 ? "#8faf9f" : i === 2 ? "#d8c3a5" : "#f0ede6",
                color: i < 3 ? "#0e2318" : "#888",
                display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>{i + 1}</span>
              {item.name}
            </span>
            <span style={{ color: "#0e2318" }}>{item.value} {label}</span>
          </div>
          <div style={{ height: 7, background: "#f0ede6", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${(item.value / max) * 100}%`,
              background: i === 0 ? "#c9a96e" : "#0e2318",
              transition: "width 0.6s ease"
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ProductAnalytics() {
  const [inquiries, setInquiries] = useState([]);
  const [buyers,    setBuyers]    = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:5000/inquiries").then(r => r.json()).catch(() => []),
      fetch("http://localhost:5000/buyers").then(r => r.json()).catch(() => []),
    ]).then(([inq, buy]) => {
      setInquiries(Array.isArray(inq) ? inq : []);
      // parse products JSON from buyers
      setBuyers((Array.isArray(buy) ? buy : []).map(b => ({
        ...b,
        products: typeof b.products === "string"
          ? (() => { try { return JSON.parse(b.products || "[]"); } catch { return []; } })()
          : (b.products || [])
      })));
      setLoading(false);
    });
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────

  // 1. Most inquired products (from inquiries table)
  const inquiredProducts = useMemo(() => {
    const counts = {};
    inquiries.forEach(i => {
      const p = (i.product_name || "").trim();
      if (p) counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [inquiries]);

  // 2. Products in buyers (from buyers.products JSON)
  const buyerProducts = useMemo(() => {
    const counts = {};
    buyers.forEach(b => {
      (b.products || []).forEach(p => {
        const name = (p.product || "").trim();
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [buyers]);

  // 3. Quality rating breakdown per top product
  const qualityByProduct = useMemo(() => {
    const map = {};
    inquiries.forEach(i => {
      const p = (i.product_name || "").trim();
      const q = (i.buyer_quality_rating || "other").toLowerCase();
      if (!p) return;
      if (!map[p]) map[p] = { name: p, "hot buyer": 0, "genuine buyer": 0, "medium": 0, "risky": 0, "fake": 0 };
      if (map[p][q] !== undefined) map[p][q]++;
    });
    return Object.values(map)
      .sort((a, b) =>
        (b["hot buyer"] + b["genuine buyer"]) - (a["hot buyer"] + a["genuine buyer"])
      )
      .slice(0, 6);
  }, [inquiries]);

  // 4. Source breakdown per top product
  const sourceByProduct = useMemo(() => {
    const map = {};
    inquiries.forEach(i => {
      const p = (i.product_name || "").trim();
      const s = (i.inquiry_source || "unknown").toLowerCase();
      if (!p) return;
      if (!map[p]) map[p] = { name: p };
      map[p][s] = (map[p][s] || 0) + 1;
    });
    return Object.values(map).slice(0, 6);
  }, [inquiries]);

  // 5. Response status by product
  const statusByProduct = useMemo(() => {
    const map = {};
    inquiries.forEach(i => {
      const p = (i.product_name || "").trim();
      const s = (i.response_status || "unknown").toLowerCase();
      if (!p) return;
      if (!map[p]) map[p] = { name: p, replied: 0, "not replied": 0, interested: 0, "follow up needed": 0 };
      if (map[p][s] !== undefined) map[p][s]++;
    });
    return Object.values(map).slice(0, 6);
  }, [inquiries]);

  // 6. Radar: top 6 products — inquiries vs buyer deals
  const radarData = useMemo(() => {
    const inqMap = {};
    inquiries.forEach(i => { const p = (i.product_name || "").trim(); if (p) inqMap[p] = (inqMap[p] || 0) + 1; });
    const buyMap = {};
    buyers.forEach(b => (b.products || []).forEach(p => { const n = (p.product || "").trim(); if (n) buyMap[n] = (buyMap[n] || 0) + 1; }));
    const all = new Set([...Object.keys(inqMap), ...Object.keys(buyMap)]);
    return [...all]
      .map(name => ({ name, Inquiries: inqMap[name] || 0, "Buyer Deals": buyMap[name] || 0 }))
      .sort((a, b) => (b.Inquiries + b["Buyer Deals"]) - (a.Inquiries + a["Buyer Deals"]))
      .slice(0, 6);
  }, [inquiries, buyers]);

  // ── Top-level stats ───────────────────────────────────────────────────────
  const uniqueInquiryProducts = inquiredProducts.length;
  const uniqueBuyerProducts   = buyerProducts.length;
  const totalInquiries        = inquiries.length;
  const topProduct            = inquiredProducts[0]?.name || "—";

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#aaa", fontSize: 15 }}>
        Loading product data…
      </div>
    );
  }

  return (
    <div style={{ padding: 28, paddingBottom: 48, background: "#f5f2eb", minHeight: "100vh", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#0e2318", marginBottom: 4 }}>
          Product Analytics
        </h1>
        <p style={{ fontSize: 14, color: "#888" }}>
          Insights drawn from inquiries &amp; registered buyer products
        </p>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard icon={FiPackage}    label="Unique Products Inquired" value={uniqueInquiryProducts} sub="from inquiries"       color="#0e2318" />
        <StatCard icon={FiShoppingBag} label="Products in Buyer Deals" value={uniqueBuyerProducts}  sub="from buyers"          color="#c9a96e" />
        <StatCard icon={FiTrendingUp} label="Total Inquiries"          value={totalInquiries}        sub="across all products"  color="#356859" />
        <StatCard icon={FiUsers}      label="Top Product"              value={topProduct}            sub={`${inquiredProducts[0]?.value || 0} inquiries`} color="#8faf9f" />
      </div>

      {/* ROW 1: Pie + Ranking */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Most Inquired — Pie */}
        <ChartCard title="Most Inquired Products" subtitle="By number of inquiry records">
          {inquiredProducts.length === 0
            ? <p className="ana-empty">No inquiry data yet</p>
            : (
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <ResponsiveContainer width="55%" height={220}>
                  <PieChart>
                    <Pie data={inquiredProducts.slice(0, 8)} dataKey="value" outerRadius={90} innerRadius={50}>
                      {inquiredProducts.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <PieLegend data={inquiredProducts.slice(0, 8)} />
                </div>
              </div>
            )
          }
        </ChartCard>

        {/* Products in Buyer Deals — Pie */}
        <ChartCard title="Products in Buyer Deals" subtitle="Products registered under buyer profiles">
          {buyerProducts.length === 0
            ? <p className="ana-empty">No buyer product data yet</p>
            : (
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <ResponsiveContainer width="55%" height={220}>
                  <PieChart>
                    <Pie data={buyerProducts.slice(0, 8)} dataKey="value" outerRadius={90} innerRadius={50}>
                      {buyerProducts.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <PieLegend data={buyerProducts.slice(0, 8)} />
                </div>
              </div>
            )
          }
        </ChartCard>

      </div>

      {/* ROW 2: Bar — inquiries count + ranking */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>

        {/* Bar chart: top inquired products */}
        <ChartCard title="Inquiry Volume by Product" subtitle="Top products by total inquiry count">
          {inquiredProducts.length === 0
            ? <p className="ana-empty">No data yet</p>
            : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={inquiredProducts.slice(0, 8)} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#aaa" }} interval={0} angle={-20} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 11, fill: "#aaa" }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Inquiries" radius={[6, 6, 0, 0]}>
                    {inquiredProducts.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#c9a96e" : "#0e2318"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </ChartCard>

        {/* Ranking table */}
        <ChartCard title="Product Ranking" subtitle="Sorted by inquiry count">
          {inquiredProducts.length === 0
            ? <p className="ana-empty">No data yet</p>
            : <RankTable data={inquiredProducts} label="inquiries" />
          }
        </ChartCard>

      </div>

      {/* ROW 3: Quality by product (stacked bar) */}
      <ChartCard
        title="Buyer Quality by Product"
        subtitle="Breakdown of buyer quality ratings per product"
        fullWidth
      >
        {qualityByProduct.length === 0
          ? <p className="ana-empty">No data yet</p>
          : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={qualityByProduct} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#aaa" }} interval={0} angle={-15} textAnchor="end" height={44} />
                <YAxis tick={{ fontSize: 11, fill: "#aaa" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="hot buyer"     stackId="q" name="Hot Buyer"     fill="#f59e0b" radius={[0,0,0,0]} />
                <Bar dataKey="genuine buyer" stackId="q" name="Genuine Buyer" fill="#10b981" radius={[0,0,0,0]} />
                <Bar dataKey="medium"        stackId="q" name="Medium"        fill="#3b82f6" radius={[0,0,0,0]} />
                <Bar dataKey="risky"         stackId="q" name="Risky"         fill="#f97316" radius={[0,0,0,0]} />
                <Bar dataKey="fake"          stackId="q" name="Fake"          fill="#ef4444" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </ChartCard>

      {/* ROW 4: Response status + Inquiries vs Buyer Deals radar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Response status by product */}
        <ChartCard title="Response Status by Product" subtitle="How buyers responded per product">
          {statusByProduct.length === 0
            ? <p className="ana-empty">No data yet</p>
            : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statusByProduct} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#aaa" }} interval={0} angle={-15} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 11, fill: "#aaa" }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="replied"           stackId="s" name="Replied"          fill="#10b981" />
                  <Bar dataKey="interested"        stackId="s" name="Interested"       fill="#8b5cf6" />
                  <Bar dataKey="follow up needed"  stackId="s" name="Follow Up"        fill="#f59e0b" />
                  <Bar dataKey="not replied"       stackId="s" name="Not Replied"      fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </ChartCard>

        {/* Radar: Inquiries vs Buyer Deals */}
        <ChartCard title="Inquiries vs Buyer Deals" subtitle="Top products comparison">
          {radarData.length === 0
            ? <p className="ana-empty">No data yet</p>
            : (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f0ede6" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: "#bbb" }} allowDecimals={false} />
                  <Radar name="Inquiries"   dataKey="Inquiries"    stroke="#0e2318" fill="#0e2318" fillOpacity={0.25} />
                  <Radar name="Buyer Deals" dataKey="Buyer Deals"  stroke="#c9a96e" fill="#c9a96e" fillOpacity={0.25} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            )
          }
        </ChartCard>

      </div>

      {/* ROW 5: Source by product */}
      <ChartCard
        title="Inquiry Source by Product"
        subtitle="Where inquiries for each product are coming from"
        fullWidth
      >
        {sourceByProduct.length === 0
          ? <p className="ana-empty">No data yet</p>
          : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sourceByProduct} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#aaa" }} interval={0} angle={-15} textAnchor="end" height={44} />
                <YAxis tick={{ fontSize: 11, fill: "#aaa" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="go4world"    stackId="s" name="Go4World"    fill="#0e2318" />
                <Bar dataKey="direct email" stackId="s" name="Direct Email" fill="#c9a96e" />
                <Bar dataKey="mandate"     stackId="s" name="Mandate"     fill="#356859" />
                <Bar dataKey="alibaba"     stackId="s" name="Alibaba"     fill="#8faf9f" />
                <Bar dataKey="referral"    stackId="s" name="Referral"    fill="#d8c3a5" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </ChartCard>

    </div>
  );
}