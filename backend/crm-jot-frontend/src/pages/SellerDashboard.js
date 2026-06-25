import { useState, useEffect, useMemo } from "react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";
import { 
  FiDollarSign, FiCalendar, FiUser, FiPackage, FiActivity, FiArrowLeft, FiFileText, FiTrendingUp 
} from "react-icons/fi";
import { AnalyticsCard, AnalyticsTable } from "./AccountsDashboard";

export default function SellerDashboard({ sellerId, onBack, onDrilldown }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSellerData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/accounts/analytics/seller/${sellerId}`, {
        headers: { "x-user-role": "admin" }
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Error fetching seller dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sellerId) fetchSellerData();
  }, [sellerId]);

  const kpis = useMemo(() => {
    if (!data) return [];
    const s = data.stats;
    return [
      { title: "Total Shipment Revenue", value: `USD ${Number(s.total_shipment_value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: true, trend: "Agent Sales" },
      { title: "Total Profit Generated", value: `USD ${Number(s.total_net_profit).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: true, color: "#28a745", trend: "Agent Profit" },
      { title: "Average Margin / MT", value: `USD ${Number(s.avg_margin).toFixed(2)}`, icon: FiActivity, isDark: true, color: "#c9a96e", trend: "Agent Margin" },
      { title: "Average Transaction Value", value: `USD ${Number(s.avg_tx_value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: true, trend: "Avg Ticket" },
      { title: "Transactions Count", value: `${s.total_transactions} deals`, icon: FiFileText, isDark: false, trend: "Volume" },
      { title: "Brokerage Commission Impact", value: `USD ${Number(s.commission_impact).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: false, color: "#fd7e14", trend: "Brokerage Share" }
    ];
  }, [data]);

  if (loading && !data) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#6c757d" }}>Loading seller intelligence profile...</div>;
  }

  const details = data.details;

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
      {/* Back link */}
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

      {/* Profile Header */}
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
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#c9a96e", textTransform: "uppercase", letterSpacing: "1px" }}>Agent &amp; Seller Profile</span>
          <h2 style={{ fontSize: "28px", fontWeight: 800, fontFamily: '"Playfair Display", serif', marginTop: "6px" }}>{details.name}</h2>
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", marginTop: "4px" }}>Country: {details.country || "—"}</p>
        </div>
        <div style={{ fontSize: "13px", color: "#e9ebea", borderLeft: "1px solid rgba(255, 255, 255, 0.15)", paddingLeft: "30px" }}>
          <div><strong>Email:</strong> {details.email || "—"}</div>
          <div style={{ marginTop: "6px" }}><strong>Phone:</strong> {details.phone || "—"}</div>
        </div>
      </div>

      {/* KPI summaries Row 1 (Forest Green / Dark Theme Gradients) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px",
        marginBottom: "20px"
      }}>
        {kpis.slice(0, 4).map((kpi, idx) => (
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

      {/* KPI summaries Row 2 (White/Beige theme) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "20px",
        marginBottom: "40px"
      }}>
        {kpis.slice(4, 6).map((kpi, idx) => (
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

      {/* Trends chart */}
      <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)", marginBottom: "30px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Monthly Sales &amp; Profit Trend</h4>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={data.trends}>
              <defs>
                <linearGradient id="sellerRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0e2318" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0e2318" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="sellerProfitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#28a745" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
              <XAxis dataKey="profit_month" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} tickFormatter={v => `$${v.toLocaleString()}`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Area type="monotone" name="Revenue" dataKey="revenue" stroke="#0e2318" strokeWidth={2} fillOpacity={1} fill="url(#sellerRevGrad)" />
              <Area type="monotone" name="Profit" dataKey="profit" stroke="#28a745" strokeWidth={2} fillOpacity={1} fill="url(#sellerProfitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Buyers & Products Sold */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "40px" }}>
        {/* Buyers Served Ranking list */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "20px", textTransform: "uppercase" }}>Top Buyers Served</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {data.buyers.slice(0, 5).map((b, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#fafafa",
                borderLeft: "4px solid #c9a96e",
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
                  <div style={{ fontWeight: 700, color: "green" }}>USD {Number(b.profit).toLocaleString()}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>{b.transactions} transactions</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products Sold list */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "20px", textTransform: "uppercase" }}>Products Traded</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {data.products.slice(0, 5).map((p, i) => (
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
                    onClick={() => onDrilldown && onDrilldown("product", p.product_id || p.id)}
                  >
                    {p.product_name}
                  </strong>
                  <div style={{ fontSize: "11px", color: "#666" }}>{Number(p.quantity).toLocaleString()} MT sold</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>USD {Number(p.profit).toLocaleString()}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>Revenue: USD {Number(p.revenue).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions timeline */}
      <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)", marginBottom: "40px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Seller Recent Transactions</h4>
        <AnalyticsTable 
          headers={[
            { text: "Tx No" },
            { text: "Date" },
            { text: "Product" },
            { text: "Tonnage (MT)", align: "right" },
            { text: "Revenue", align: "right" },
            { text: "Status" }
          ]}
          data={data.recent}
          renderRow={(t, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #f8f6f0" }}>
              <td style={{ padding: "12px 14px", fontWeight: 700 }}>{t.transaction_no}</td>
              <td style={{ padding: "12px 14px" }}>{new Date(t.transaction_date).toLocaleDateString()}</td>
              <td style={{ padding: "12px 14px" }}>{t.product_name || "—"}</td>
              <td style={{ padding: "12px 14px", textAlign: "right" }}>{Number(t.quantity_mt).toLocaleString()}</td>
              <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600 }}>USD {Number(t.shipment_value).toLocaleString()}</td>
              <td style={{ padding: "12px 14px" }}>
                <span style={{
                  padding: "3px 8px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: t.status === "Completed" ? "green" : (t.status === "Cancelled" ? "red" : "orange"),
                  background: t.status === "Completed" ? "rgba(40,167,69,0.1)" : (t.status === "Cancelled" ? "rgba(220,53,69,0.1)" : "rgba(253,126,20,0.1)")
                }}>{t.status}</span>
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}
