import { useState, useEffect, useMemo } from "react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar 
} from "recharts";
import { 
  FiDollarSign, FiPackage, FiActivity, FiArrowLeft, FiFileText, FiUser, FiAnchor, FiTrendingUp 
} from "react-icons/fi";
import { AnalyticsCard, AnalyticsTable } from "./AccountsDashboard";

export default function ProductDashboard({ productId, onBack, onDrilldown }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/accounts/analytics/product/${productId}`, {
        headers: { "x-user-role": "admin" }
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Error fetching product dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchProductData();
  }, [productId]);

  const kpis = useMemo(() => {
    if (!data) return [];
    const s = data.stats;
    return [
      { title: "Total Tonnage Sold", value: `${Number(s.total_quantity).toLocaleString()} MT`, icon: FiPackage, isDark: true, trend: "Tonnage Traded" },
      { title: "Total Revenue Generated", value: `USD ${Number(s.total_revenue).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: true, trend: "Total Revenue" },
      { title: "Total Net Profit", value: `USD ${Number(s.total_profit).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: true, color: "#28a745", trend: "Net Profit" },
      { title: "Average Margin / MT", value: `USD ${Number(s.avg_margin).toFixed(2)}`, icon: FiActivity, isDark: true, color: "#c9a96e", trend: "MT Margin" },
      
      { title: "Revenue Contribution", value: `${Number(s.revenue_contribution_pct).toFixed(2)}%`, icon: FiActivity, isDark: false, trend: "Global Rev Share" },
      { title: "Profit Contribution", value: `${Number(s.profit_contribution_pct).toFixed(2)}%`, icon: FiActivity, isDark: false, color: "#28a745", trend: "Global Profit Share" },
      { title: "Total Transactions", value: `${s.total_transactions} deals`, icon: FiFileText, isDark: false, trend: "Deal Volume" }
    ];
  }, [data]);

  if (loading && !data) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#6c757d" }}>Loading product intelligence profile...</div>;
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
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#c9a96e", textTransform: "uppercase", letterSpacing: "1px" }}>Product Performance Cockpit</span>
          <h2 style={{ fontSize: "28px", fontWeight: 800, fontFamily: '"Playfair Display", serif', marginTop: "6px" }}>{details.name}</h2>
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", marginTop: "4px" }}>Product Code: {details.code || "—"} | Category: {details.category || "—"}</p>
        </div>
        <div style={{ fontSize: "13px", color: "#e9ebea", borderLeft: "1px solid rgba(255, 255, 255, 0.15)", paddingLeft: "30px" }}>
          <div><strong>Units:</strong> Metric Tons (MT)</div>
          <div style={{ marginTop: "6px" }}><strong>Status:</strong> {details.is_active ? "Active Catalog" : "Inactive"}</div>
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
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
        marginBottom: "45px"
      }}>
        {kpis.slice(4, 7).map((kpi, idx) => (
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

      {/* Monthly Sales & Profit Trend */}
      <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)", marginBottom: "30px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Monthly Sales &amp; Profit Trends</h4>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={data.trends}>
              <defs>
                <linearGradient id="productQtyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0e2318" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0e2318" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="productProfitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#28a745" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
              <XAxis dataKey="profit_month" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Area type="monotone" name="Quantity Sold (MT)" dataKey="quantity" stroke="#0e2318" strokeWidth={2} fillOpacity={1} fill="url(#productQtyGrad)" />
              <Area type="monotone" name="Net Profit (USD)" dataKey="profit" stroke="#28a745" strokeWidth={2} fillOpacity={1} fill="url(#productProfitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Buyers & Routes visual charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "40px" }}>
        {/* Top Buyers list */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "20px", textTransform: "uppercase" }}>Top Buyers of Product</h4>
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

        {/* Top Routes Horizontal Chart */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Top Trade Routes for Product</h4>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.routes.slice(0, 5).map(r => ({ ...r, route_name: `${r.loading_port} → ${r.destination_port}` }))} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ede9df" />
                <XAxis type="number" stroke="#888" fontSize={11} tickFormatter={v => `$${v.toLocaleString()}`} />
                <YAxis dataKey="route_name" type="category" stroke="#888" fontSize={11} width={120} />
                <Tooltip content={<ChartTooltip />} />
                <Bar name="Net Profit" dataKey="profit" fill="#c9a96e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Shipments Log */}
      <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)", marginBottom: "40px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Recent Shipments Log</h4>
        <AnalyticsTable 
          headers={[
            { text: "Tx No" },
            { text: "Date" },
            { text: "Quantity (MT)" },
            { text: "Selling Price" },
            { text: "Commission", align: "right" },
            { text: "Net Profit", align: "right" }
          ]}
          data={data.recent}
          renderRow={(tx, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #f8f6f0" }}>
              <td style={{ padding: "10px 12px", fontWeight: 700 }}>{tx.transaction_no}</td>
              <td style={{ padding: "10px 12px" }}>{new Date(tx.transaction_date).toLocaleDateString()}</td>
              <td style={{ padding: "10px 12px" }}>{Number(tx.quantity_mt).toLocaleString()}</td>
              <td style={{ padding: "10px 12px" }}>{tx.selling_currency} {Number(tx.selling_price).toLocaleString()}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{tx.selling_currency} {Number(tx.commission_total).toLocaleString()}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: Number(tx.net_profit) >= 0 ? "green" : "red" }}>
                {tx.selling_currency} {Number(tx.net_profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}
