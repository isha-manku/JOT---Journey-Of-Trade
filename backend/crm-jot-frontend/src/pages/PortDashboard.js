import { useState, useEffect, useMemo } from "react";
import { 
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend 
} from "recharts";
import { 
  FiDollarSign, FiAnchor, FiActivity, FiArrowLeft, FiFileText, FiUser, FiPackage, FiArrowRight 
} from "react-icons/fi";
import { AnalyticsCard, AnalyticsTable } from "./AccountsDashboard";

export default function PortDashboard({ portName, onBack, onDrilldown }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPortData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/accounts/analytics/port?portName=${encodeURIComponent(portName)}`, {
        headers: { "x-user-role": "admin" }
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Error fetching port dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (portName) fetchPortData();
  }, [portName]);

  const mostUsedRoute = useMemo(() => {
    if (!data || !data.routes || data.routes.length === 0) return "—";
    const sorted = [...data.routes].sort((a, b) => b.transactions - a.transactions);
    const top = sorted[0];
    return `${top.loading_port} → ${top.destination_port}`;
  }, [data]);

  const kpis = useMemo(() => {
    if (!data) return [];
    const s = data.stats;
    return [
      { title: "Total Shipments Logged", value: `${s.total_transactions} shipments`, icon: FiFileText, isDark: true, trend: "Gateway Traffic" },
      { title: "Total Volume Handled", value: `${Number(s.total_volume).toLocaleString()} MT`, icon: FiPackage, isDark: true, color: "#c9a96e", trend: "Logistics Cargo" },
      { title: "Total Profit Generated", value: `USD ${Number(s.total_profit).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: true, color: "#28a745", trend: "Net Yield" },
      { title: "Most Used Trade Route", value: mostUsedRoute, icon: FiAnchor, isDark: true, trend: "Primary Corridor" }
    ];
  }, [data, mostUsedRoute]);

  if (loading && !data) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#6c757d" }}>Loading port logistics intelligence...</div>;
  }

  // Custom tooltip renderer for charts
  const ChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "#0e2318",
          border: "1px solid #c9a96e",
          padding: "12px 16px",
          borderRadius: "8px",
          color: "#ffffff",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          fontFamily: '"DM Sans", sans-serif',
          fontSize: "12px"
        }}>
          <div style={{ fontWeight: 700, marginBottom: "6px", color: "#c9a96e" }}>{label}</div>
          {payload.map((p, i) => (
            <div key={i} style={{ marginTop: "4px" }}>
              <span style={{ fontWeight: 600 }}>{p.name}:</span> {p.name.includes("Volume") || p.name.includes("Transactions") || p.name.includes("Qty") ? p.value.toLocaleString() : `USD ${Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif', color: "#0e2318", padding: "30px 20px" }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: "inline-flex", alignItems: "center", gap: "7px",
          background: "#0e2318", color: "#c9a96e",
          border: "none", borderRadius: "8px",
          padding: "8px 16px", fontWeight: 700, fontSize: "13px",
          cursor: "pointer", marginBottom: "20px", letterSpacing: "0.3px"
        }}
      >
        <FiArrowLeft size={14} /> Back to Dashboard
      </button>

      {/* Logistics Header */}
      <div style={{
        background: "linear-gradient(135deg, #0e2318 0%, #153524 100%)",
        color: "#ffffff",
        borderRadius: "12px",
        padding: "30px",
        boxShadow: "0 10px 30px rgba(14, 35, 24, 0.08)",
        border: "1px solid #c9a96e",
        marginBottom: "30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#c9a96e", textTransform: "uppercase", letterSpacing: "1px" }}>Logistics Intelligence Command Center</span>
          <h2 style={{ fontSize: "28px", fontWeight: 800, fontFamily: '"Playfair Display", serif', marginTop: "6px" }}>{portName}</h2>
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", marginTop: "4px" }}>Port Cargo Hub &amp; Shipping Gateway</p>
        </div>
        <div style={{ fontSize: "13px", color: "#e9ebea", borderLeft: "1px solid rgba(255, 255, 255, 0.15)", paddingLeft: "30px" }}>
          <div><strong>Type:</strong> Global Corridor Hub</div>
          <div style={{ marginTop: "6px" }}><strong>Transactions:</strong> {data.stats.total_transactions} shipments handled</div>
        </div>
      </div>

      {/* KPI summaries (Dark Green Command cards) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px",
        marginBottom: "40px"
      }}>
        {kpis.map((kpi, idx) => (
          <AnalyticsCard 
            key={idx} 
            title={kpi.title} 
            value={kpi.value} 
            subtext={kpi.subtext} 
            icon={kpi.icon} 
            isDark={kpi.isDark}
            color={kpi.color}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* Interactive Logistics Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
        {/* Route Profitability Bar Chart */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Route Profitability analysis</h4>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data.routes.slice(0, 5).map(r => ({ ...r, route_name: `${r.loading_port.split(' ').slice(-1)} → ${r.destination_port.split(' ').slice(-1)}` }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
                <XAxis dataKey="route_name" stroke="#888" fontSize={10} tickLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v.toLocaleString()}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar name="Net Profit" dataKey="profit" fill="#0e2318" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Horizontal Chart */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Top Products Shipped (Volume)</h4>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data.products.slice(0, 5)} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ede9df" />
                <XAxis type="number" stroke="#888" fontSize={11} />
                <YAxis dataKey="product_name" type="category" stroke="#888" fontSize={11} width={80} />
                <Tooltip content={<ChartTooltip />} />
                <Bar name="Volume (MT)" dataKey="quantity" fill="#c9a96e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Buyers list & Route Profitability Matrix details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "35px" }}>
        {/* Top Buyers list */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "20px", textTransform: "uppercase" }}>Top Buyers Using Port</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {data.buyers.slice(0, 5).map((b, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#fafafa",
                borderLeft: "4px solid #0e2318",
                borderRadius: "6px",
                border: "1px solid #ede9df"
              }}>
                <div>
                  <strong 
                    style={{ color: "#0e2318", cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => onDrilldown && onDrilldown("buyer", b.buyer_id || b.id)}
                  >
                    {b.buyer_name}
                  </strong>
                  <div style={{ fontSize: "11px", color: "#666" }}>{b.company_name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "#28a745" }}>USD {Number(b.profit).toLocaleString()}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>{b.transactions} transactions</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Route Profitability Details matrix */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Route Profitability Matrix</h4>
          <AnalyticsTable 
            headers={[
              { text: "Route" },
              { text: "Count", align: "center" },
              { text: "Revenue", align: "right" },
              { text: "Net Profit", align: "right" },
              { text: "Margin %", align: "right" }
            ]}
            data={data.routes.slice(0, 5)}
            renderRow={(r, idx) => {
              const marginPct = r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0;
              return (
                <tr key={idx} style={{ borderBottom: "1px solid #f8f6f0" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <span 
                      onClick={() => onDrilldown && onDrilldown("port", r.loading_port)}
                      style={{ fontWeight: 700, color: "#0e2318", cursor: "pointer", textDecoration: "underline" }}
                    >
                      {r.loading_port.split(' ').slice(-1)}
                    </span>
                    <FiArrowRight style={{ margin: "0 4px", color: "#aaa" }} />
                    <span 
                      onClick={() => onDrilldown && onDrilldown("port", r.destination_port)}
                      style={{ fontWeight: 700, color: "#0e2318", cursor: "pointer", textDecoration: "underline" }}
                    >
                      {r.destination_port.split(' ').slice(-1)}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>{r.transactions}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>USD {Number(r.revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "green" }}>USD {Number(r.profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: marginPct >= 0 ? "green" : "red" }}>{marginPct.toFixed(1)}%</td>
                </tr>
              );
            }}
          />
        </div>
      </div>

      {/* Recent Shipments Handled */}
      <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)", marginBottom: "40px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Recent Shipments Handled</h4>
        <AnalyticsTable 
          headers={[
            { text: "Tx No" },
            { text: "Date" },
            { text: "Product" },
            { text: "Quantity (MT)" },
            { text: "Selling Price" },
            { text: "Net Profit", align: "right" }
          ]}
          data={data.recent}
          renderRow={(tx, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #f8f6f0" }}>
              <td style={{ padding: "10px 12px", fontWeight: 700 }}>{tx.transaction_no}</td>
              <td style={{ padding: "10px 12px" }}>{new Date(tx.transaction_date).toLocaleDateString()}</td>
              <td style={{ padding: "10px 12px" }}>{tx.product_name || "—"}</td>
              <td style={{ padding: "10px 12px" }}>{Number(tx.quantity_mt).toLocaleString()}</td>
              <td style={{ padding: "10px 12px" }}>{tx.selling_currency} {Number(tx.selling_price).toLocaleString()}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: Number(tx.net_profit) >= 0 ? "green" : "red" }}>
                {tx.selling_currency} {Number(tx.net_profit).toLocaleString()}
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}
