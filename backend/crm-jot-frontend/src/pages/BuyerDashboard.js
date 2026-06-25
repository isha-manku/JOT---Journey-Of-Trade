import { useState, useEffect, useMemo } from "react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from "recharts";
import { 
  FiDollarSign, FiCalendar, FiMapPin, FiAnchor, FiBriefcase, FiUser, 
  FiPackage, FiActivity, FiArrowRight, FiFileText, FiRefreshCw, FiArrowLeft 
} from "react-icons/fi";
import { AnalyticsCard, AnalyticsTable } from "./AccountsDashboard";

export default function BuyerDashboard({ buyerId, onBack, onDrilldown }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBuyerData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/accounts/analytics/buyer/${buyerId}`, {
        headers: { "x-user-role": "admin" }
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Error fetching buyer dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (buyerId) fetchBuyerData();
  }, [buyerId]);

  const kpis = useMemo(() => {
    if (!data) return [];
    const s = data.stats;
    return [
      { title: "Total Shipment Value", value: `USD ${Number(s.total_shipment_value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: true, trend: "Purchasing Power" },
      { title: "Total Net Profit Generated", value: `USD ${Number(s.total_net_profit).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: true, color: "#28a745", trend: "Net Profit Share" },
      { title: "Average Margin / MT", value: `USD ${Number(s.avg_margin).toFixed(2)}`, icon: FiActivity, isDark: true, color: "#c9a96e", trend: "Profit Margin" },
      { title: "Average Transaction Value", value: `USD ${Number(s.avg_tx_value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: true, trend: "Avg Ticket" },
      
      { title: "Largest Transaction", value: `USD ${Number(s.max_tx_value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: false, trend: "Peak Value" },
      { title: "Total Transactions", value: `${s.total_transactions} shipments`, icon: FiFileText, isDark: false, trend: "Order Count" },
      { title: "Most Purchased Product", value: s.most_purchased ? s.most_purchased.name : "—", subtext: s.most_purchased ? `${Number(s.most_purchased.quantity).toLocaleString()} MT` : "No data", icon: FiPackage, isDark: false, trend: "Fav Product" },
      { title: "Preferred Route", value: s.preferred_route ? `${s.preferred_route.loading_port} → ${s.preferred_route.destination_port}` : "—", subtext: s.preferred_route ? `${s.preferred_route.count} shipments` : "No data", icon: FiAnchor, isDark: false, trend: "Main Logistics" }
    ];
  }, [data]);

  if (loading && !data) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#6c757d" }}>Loading customer intelligence profile...</div>;
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
      {/* Back button and profile header */}
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
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#c9a96e", textTransform: "uppercase", letterSpacing: "1px" }}>Customer Intelligence Profile</span>
          <h2 style={{ fontSize: "28px", fontWeight: 800, fontFamily: '"Playfair Display", serif', marginTop: "6px" }}>{details.buyer_name}</h2>
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", marginTop: "4px" }}>{details.company_name} — {details.country}</p>
        </div>
        <div style={{ fontSize: "13px", color: "#e9ebea", borderLeft: "1px solid rgba(255, 255, 255, 0.15)", paddingLeft: "30px" }}>
          <div><strong>Email:</strong> {details.email || "—"}</div>
          <div style={{ marginTop: "6px" }}><strong>Phone:</strong> {details.phone || "—"}</div>
          <div style={{ marginTop: "6px" }}><strong>Address:</strong> {details.address || "—"}</div>
        </div>
      </div>

      {/* KPI summaries (Trading Cockpit style) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px",
        marginBottom: "30px"
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

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px",
        marginBottom: "40px"
      }}>
        {kpis.slice(4, 8).map((kpi, idx) => (
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

      {/* Route and Trend analytics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
        {/* Monthly profit contribution trend */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Monthly Profit Contribution</h4>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="buyerProfitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#28a745" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
                <XAxis dataKey="profit_month" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} tickFormatter={v => `$${v.toLocaleString()}`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" name="Net Profit" dataKey="profit" stroke="#28a745" strokeWidth={3} fillOpacity={1} fill="url(#buyerProfitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment mode chart */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Payment Mode Breakdown</h4>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.paymentModes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="payment_mode"
                >
                  {data.paymentModes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#0e2318", "#c9a96e", "#28a745", "#fd7e14", "#888"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [value, props.payload.payment_mode]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Route intelligence charts (replacing tables) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "40px" }}>
        {/* Loading Ports Route Intelligence Horizontal Bar Chart */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Top Loading Ports</h4>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.loadingPorts} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ede9df" />
                <XAxis type="number" stroke="#888" fontSize={11} tickFormatter={v => `$${v.toLocaleString()}`} />
                <YAxis dataKey="port" type="category" stroke="#888" fontSize={11} width={80} />
                <Tooltip content={<ChartTooltip />} />
                <Bar name="Net Profit" dataKey="profit" fill="#0e2318" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Destination Ports Route Intelligence Horizontal Bar Chart */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Top Destination Ports</h4>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.destinationPorts} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ede9df" />
                <XAxis type="number" stroke="#888" fontSize={11} tickFormatter={v => `$${v.toLocaleString()}`} />
                <YAxis dataKey="port" type="category" stroke="#888" fontSize={11} width={80} />
                <Tooltip content={<ChartTooltip />} />
                <Bar name="Net Profit" dataKey="profit" fill="#c9a96e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Products & Suppliers Leaderboard rows */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "40px" }}>
        {/* Products Purchased Ranking */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "20px", textTransform: "uppercase" }}>Products Purchased</h4>
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
                  <div style={{ fontSize: "11px", color: "#666" }}>{Number(p.quantity).toLocaleString()} MT purchased</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "#0e2318" }}>USD {Number(p.profit).toLocaleString()}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>Revenue: USD {Number(p.revenue).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suppliers Used Ranking */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "20px", textTransform: "uppercase" }}>Supplier Companies Used</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {data.companies.slice(0, 5).map((c, i) => (
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
                    onClick={() => onDrilldown && onDrilldown("company", c.company_id || c.id)}
                  >
                    {c.company_name}
                  </strong>
                  <div style={{ fontSize: "11px", color: "#666" }}>{c.transactions} shipments</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "green" }}>USD {Number(c.profit).toLocaleString()}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>Revenue: USD {Number(c.revenue).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions timeline */}
      <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)", marginBottom: "40px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Recent Transactions History</h4>
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
