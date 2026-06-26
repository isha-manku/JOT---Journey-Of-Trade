import { useState, useEffect, useMemo } from "react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";
import { 
  FiDollarSign, FiBriefcase, FiActivity, FiArrowLeft, FiArrowRight, FiFileText, FiUser, FiAnchor, FiTrendingUp 
} from "react-icons/fi";
import { AnalyticsCard, AnalyticsTable } from "./AccountsDashboard";

export default function CompanyDashboard({ companyId, onBack, onDrilldown }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/accounts/analytics/company/${companyId}`, {
        headers: { "x-user-role": "admin" }
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Error fetching company dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchCompanyData();
  }, [companyId]);

  const kpis = useMemo(() => {
    if (!data) return [];
    const s = data.stats;
    return [
      { title: "Revenue Generated", value: `USD ${Number(s.total_revenue).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: true, trend: "Supplier Sales" },
      { title: "Profit Generated", value: `USD ${Number(s.total_profit).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: true, color: "#28a745", trend: "Supplier Profit" },
      { title: "Commission Paid", value: `USD ${Number(s.total_commission).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: FiDollarSign, isDark: true, color: "#fd7e14", trend: "Brokerage Out" },
      { title: "Average Margin / MT", value: `USD ${Number(s.avg_margin).toFixed(2)}`, icon: FiActivity, isDark: true, color: "#c9a96e", trend: "Supplier Margin" },
      { title: "Total Transactions", value: `${s.total_transactions} deals`, icon: FiFileText, isDark: false, trend: "Deal Flow" }
    ];
  }, [data]);

  if (loading && !data) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#6c757d" }}>Loading company performance cockpit...</div>;
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
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#c9a96e", textTransform: "uppercase", letterSpacing: "1px" }}>Supplier Company Performance Cockpit</span>
          <h2 style={{ fontSize: "28px", fontWeight: 800, fontFamily: '"Playfair Display", serif', marginTop: "6px" }}>{details.name}</h2>
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", marginTop: "4px" }}>Country: {details.country || "—"}</p>
        </div>
        <div style={{ fontSize: "13px", color: "#e9ebea", borderLeft: "1px solid rgba(255, 255, 255, 0.15)", paddingLeft: "30px" }}>
          <div><strong>Address:</strong> {details.address || "—"}</div>
          <div style={{ marginTop: "6px" }}><strong>Status:</strong> Active Trading Supplier</div>
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
        gridTemplateColumns: "repeat(1, 1fr)",
        gap: "20px",
        marginBottom: "40px"
      }}>
        {kpis.slice(4, 5).map((kpi, idx) => (
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

      {/* Growth Trend */}
      <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)", marginBottom: "30px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Monthly Growth Trends</h4>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={data.trends}>
              <defs>
                <linearGradient id="companyRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0e2318" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0e2318" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="companyProfitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#28a745" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
              <XAxis dataKey="profit_month" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} tickFormatter={v => `$${v.toLocaleString()}`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Area type="monotone" name="Revenue (USD)" dataKey="revenue" stroke="#0e2318" strokeWidth={2} fillOpacity={1} fill="url(#companyRevGrad)" />
              <Area type="monotone" name="Net Profit (USD)" dataKey="profit" stroke="#28a745" strokeWidth={2} fillOpacity={1} fill="url(#companyProfitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Products Supplied & Top Buyers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
        {/* Products Supplied ranking */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "20px", textTransform: "uppercase" }}>Products Supplied</h4>
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
                  <div style={{ fontSize: "11px", color: "#666" }}>{Number(p.quantity).toLocaleString()} MT supplied</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "#0e2318" }}>USD {Number(p.profit).toLocaleString()}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>Revenue: USD {Number(p.revenue).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Buyers served ranking */}
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
      </div>

      {/* Grid: Top Sellers & Top Routes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
        {/* Top Sellers / Brokers */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "20px", textTransform: "uppercase" }}>Top Sellers (Sales Agents)</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {data.sellers.slice(0, 5).map((s, i) => (
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
                    onClick={() => onDrilldown && onDrilldown("seller", s.seller_id || s.id)}
                  >
                    {s.seller_name}
                  </strong>
                  <div style={{ fontSize: "11px", color: "#666" }}>{s.transactions} transactions</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>USD {Number(s.profit).toLocaleString()}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>Revenue: USD {Number(s.revenue).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Routes */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "20px", textTransform: "uppercase" }}>Top Logistical Routes</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {data.routes.slice(0, 5).map((r, i) => (
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
                  <span 
                    onClick={() => onDrilldown && onDrilldown("port", r.loading_port)}
                    style={{ fontWeight: 700, color: "#0e2318", cursor: "pointer", textDecoration: "underline" }}
                  >
                    {r.loading_port}
                  </span>
                  <FiArrowRight style={{ margin: "0 6px", fontSize: 11, color: "#888" }} />
                  <span 
                    onClick={() => onDrilldown && onDrilldown("port", r.destination_port)}
                    style={{ fontWeight: 700, color: "#0e2318", cursor: "pointer", textDecoration: "underline" }}
                  >
                    {r.destination_port}
                  </span>
                  <div style={{ fontSize: "11px", color: "#666" }}>{r.transactions} shipments</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "green" }}>USD {Number(r.profit).toLocaleString()}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>Revenue: USD {Number(r.revenue).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)", marginBottom: "40px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Recent Shipments History</h4>
        <AnalyticsTable 
          headers={[
            { text: "Tx No" },
            { text: "Date" },
            { text: "Product" },
            { text: "Quantity (MT)" },
            { text: "Revenue", align: "right" },
            { text: "Net Profit", align: "right" }
          ]}
          data={data.recent}
          renderRow={(tx, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #f8f6f0" }}>
              <td style={{ padding: "12px 14px", fontWeight: 700 }}>{tx.transaction_no}</td>
              <td style={{ padding: "12px 14px" }}>{new Date(tx.transaction_date).toLocaleDateString()}</td>
              <td style={{ padding: "12px 14px" }}>{tx.product_name}</td>
              <td style={{ padding: "12px 14px" }}>{Number(tx.quantity_mt).toLocaleString()}</td>
              <td style={{ padding: "12px 14px", textAlign: "right" }}>USD {Number(tx.shipment_value).toLocaleString()}</td>
              <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: Number(tx.net_profit) >= 0 ? "green" : "red" }}>
                USD {Number(tx.net_profit).toLocaleString()}
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}
