import { useState, useEffect, useMemo } from "react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line 
} from "recharts";
import { 
  FiDollarSign, FiCalendar, FiMapPin, FiAnchor, FiBriefcase, FiUser, 
  FiPackage, FiActivity, FiArrowRight, FiFileText, FiRefreshCw, FiDownload, FiTrash2, FiFilter, FiTrendingUp 
} from "react-icons/fi";

// ===========================================================================
//  REUSABLE COMPONENT: AnalyticsCard
// ===========================================================================
export function AnalyticsCard({ title, value, subtext, icon: Icon, color = "#0e2318", isDark = false, trend, onClick }) {
  const cardBg = isDark 
    ? "linear-gradient(135deg, #0e2318 0%, #153524 100%)" 
    : "#ffffff";
  const textPrimary = isDark ? "#ffffff" : "#0e2318";
  const textSecondary = isDark ? "rgba(255,255,255,0.7)" : "#6c757d";
  const borderStyle = isDark ? "1px solid #c9a96e" : "1px solid rgba(14, 35, 24, 0.08)";

  return (
    <div style={{
      background: cardBg,
      border: borderStyle,
      borderRadius: "12px",
      padding: "20px 24px",
      boxShadow: "0 10px 30px rgba(14, 35, 24, 0.03)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: onClick ? "pointer" : "default",
      minHeight: "135px"
    }}
    onClick={onClick}
    onMouseEnter={e => {
      if (onClick) {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 15px 35px rgba(14, 35, 24, 0.08)";
      }
    }}
    onMouseLeave={e => {
      if (onClick) {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(14, 35, 24, 0.03)";
      }
    }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: isDark ? "#c9a96e" : "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</span>
        {Icon && <Icon style={{ color: "#c9a96e", fontSize: "18px" }} />}
      </div>
      <div style={{ marginTop: "10px" }}>
        <div style={{ fontSize: "22px", fontWeight: 800, color: textPrimary, fontFamily: '"Playfair Display", serif' }}>{value}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
          {trend && (
            <span style={{
              fontSize: "9px",
              fontWeight: 700,
              color: isDark ? "#0e2318" : "#ffffff",
              background: isDark ? "#c9a96e" : "#0e2318",
              padding: "2px 6px",
              borderRadius: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.3px"
            }}>
              {trend}
            </span>
          )}
          {subtext && <span style={{ fontSize: "11px", color: textSecondary, fontWeight: 500 }}>{subtext}</span>}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
//  REUSABLE COMPONENT: AnalyticsTable
// ===========================================================================
export function AnalyticsTable({ headers, data, renderRow }) {
  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "12px",
      border: "1px solid rgba(14, 35, 24, 0.05)",
      boxShadow: "0 10px 30px rgba(14, 35, 24, 0.02)",
      overflowX: "auto",
      width: "100%"
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "#f8f6f0", borderBottom: "2px solid #ede9df" }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                color: "#0e2318",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "11px",
                letterSpacing: "0.5px",
                padding: "14px 16px",
                textAlign: h.align || "left"
              }}>{h.text}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => renderRow(row, idx))}
          {data.length === 0 && (
            <tr>
              <td colSpan={headers.length} style={{ textAlign: "center", color: "#aaa", padding: "30px", fontSize: "13px" }}>
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
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

// ===========================================================================
//  MAIN COMPONENT: AccountsDashboard
// ===========================================================================
export default function AccountsDashboard({ onDrilldown, username, onBack }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("exec");

  // Reference tables for filters
  const [buyersList, setBuyersList] = useState([]);
  const [sellersList, setSellersList] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [productsList, setProductsList] = useState([]);

  // Centralized Global Filter State
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    buyer_id: "",
    seller_id: "",
    supplier_company_id: "",
    product_id: "",
    loading_port: "",
    destination_port: "",
    payment_mode: "",
    status: "Completed" // defaultCompleted
  });

  // Unique ports & payment modes from master list
  const [loadingPorts, setLoadingPorts] = useState([]);
  const [destPorts, setDestPorts] = useState([]);
  const paymentModes = ["DLC MT700", "SBLC MT760", "TT MT103", "Cash", "Advance"];

  // Fetch reference lists for filters
  const fetchFilterReferences = async () => {
    try {
      const [resB, resS, resC, resP, resT] = await Promise.all([
        fetch("http://localhost:5000/buyers").then(r => r.json()).catch(() => []),
        fetch("http://localhost:5000/sellers").then(r => r.json()).catch(() => []),
        fetch("http://localhost:5000/companies").then(r => r.json()).catch(() => []),
        fetch("http://localhost:5000/products").then(r => r.json()).catch(() => []),
        fetch("http://localhost:5000/accounts", { headers: { "x-user-role": "admin" } }).then(r => r.json()).catch(() => [])
      ]);

      setBuyersList(resB);
      setSellersList(resS);
      setCompaniesList(resC);
      setProductsList(resP);

      // Extract unique ports from all transactions
      if (Array.isArray(resT)) {
        const uniqueLoad = [...new Set(resT.map(t => t.loading_port).filter(Boolean))].sort();
        const uniqueDest = [...new Set(resT.map(t => t.destination_port).filter(Boolean))].sort();
        setLoadingPorts(uniqueLoad);
        setDestPorts(uniqueDest);
      }
    } catch (e) {
      console.error("Error fetching reference datasets", e);
    }
  };

  // Fetch main analytics datasets
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const res = await fetch(`http://localhost:5000/accounts/analytics?${params.toString()}`, {
        headers: { "x-user-role": "admin" }
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error("Error fetching BI metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterReferences();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      start_date: "",
      end_date: "",
      buyer_id: "",
      seller_id: "",
      supplier_company_id: "",
      product_id: "",
      loading_port: "",
      destination_port: "",
      payment_mode: "",
      status: "Completed"
    });
  };

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(k => {
      if (k === "status") return filters[k] !== "Completed";
      return filters[k] !== "";
    });
  }, [filters]);

  // Dynamic filter-respecting CSV Export
  const handleCSVExport = () => {
    if (!analytics) return;
    
    let reportData = [];
    let reportTitle = "";
    
    if (activeTab === "exec") {
      reportData = analytics.trends.monthly.map(t => ({
        "Month": t.profit_month,
        "Shipment Revenue (USD)": t.revenue,
        "Net Profit (USD)": t.profit,
        "Avg Margin (USD)": t.avg_margin,
        "Total Commission Paid (USD)": t.commission,
        "Transactions Count": t.transaction_count
      }));
      reportTitle = "Accounts_Monthly_Trends";
    } else if (activeTab === "client") {
      reportData = analytics.buyers.map(b => ({
        "Buyer Name": b.buyer_name,
        "Company": b.company_name,
        "Transactions count": b.total_transactions,
        "Shipment Value (USD)": b.total_shipment_value,
        "Net Profit Generated (USD)": b.total_net_profit,
        "Avg Margin (USD)": b.avg_margin,
        "Last Transaction Date": b.last_transaction_date ? new Date(b.last_transaction_date).toLocaleDateString() : "—"
      }));
      reportTitle = "Client_Intelligence";
    } else if (activeTab === "product") {
      reportData = analytics.products.map(p => ({
        "Product": p.product_name,
        "Quantity Sold (MT)": p.total_quantity,
        "Shipment Revenue (USD)": p.total_revenue,
        "Net Profit (USD)": p.total_profit,
        "Avg Margin (USD)": p.avg_margin,
        "Transactions count": p.transaction_count
      }));
      reportTitle = "Product_Intelligence";
    } else if (activeTab === "supplier") {
      reportData = analytics.companies.map(c => ({
        "Supplier Company": c.company_name,
        "Revenue (USD)": c.revenue,
        "Net Profit (USD)": c.profit,
        "Commissions Paid (USD)": c.commission,
        "Transactions Count": c.transactions,
        "Buyers Served": c.buyers_served
      }));
      reportTitle = "Supplier_Company_Intelligence";
    } else if (activeTab === "pay") {
      reportData = analytics.commissions.map(cm => ({
        "Mandate Name": cm.name,
        "Phone": cm.phone,
        "Commission Earned (USD)": cm.total_commission,
        "Transactions Count": cm.transaction_count
      }));
      reportTitle = "Commission_Analytics";
    }

    if (reportData.length === 0) {
      alert("No data available to export.");
      return;
    }

    const usernameTag = `Exported By: ${username}`;
    const timestampTag = `Export Timestamp: ${new Date().toLocaleString()}`;
    const filtersUsed = Object.keys(filters)
      .filter(k => filters[k])
      .map(k => `${k}: ${filters[k]}`)
      .join(" | ") || "None";
    const filtersTag = `Applied Filters: ${filtersUsed}`;

    const headers = Object.keys(reportData[0]);
    const csvRows = [
      [usernameTag],
      [timestampTag],
      [filtersTag],
      [],
      headers.join(","),
      ...reportData.map(row => 
        headers.map(fieldName => JSON.stringify(row[fieldName] ?? "")).join(",")
      )
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportTitle}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const matrixData = useMemo(() => {
    if (!analytics || !analytics.matrix) return [];
    const map = {};
    analytics.matrix.forEach(row => {
      if (!map[row.company_name]) {
        map[row.company_name] = {
          company_id: row.company_id,
          company_name: row.company_name,
          products: []
        };
      }
      map[row.company_name].products.push(row);
    });
    return Object.values(map);
  }, [analytics]);

  // CSS Styling Tokens (CRM Dark Green & Gold Identity)
  const styles = {
    filterBar: {
      background: "#0e2318",
      borderRadius: "12px",
      padding: "16px 20px",
      boxShadow: "0 10px 30px rgba(14, 35, 24, 0.08)",
      border: "1px solid rgba(201, 169, 110, 0.2)",
      marginBottom: "30px",
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
      alignItems: "center"
    },
    filterGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    filterLabel: {
      fontSize: "9px",
      fontWeight: 700,
      color: "#c9a96e",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    filterInput: {
      padding: "6px 12px",
      borderRadius: "20px",
      border: "1px solid rgba(201, 169, 110, 0.3)",
      fontSize: "12px",
      outline: "none",
      background: "rgba(255, 255, 255, 0.07)",
      color: "#ffffff",
      cursor: "pointer",
      minWidth: "130px",
      transition: "border-color 0.2s"
    },
    tabBtn: {
      padding: "12px 24px",
      background: "none",
      border: "none",
      borderBottom: "3px solid transparent",
      fontSize: "13px",
      fontWeight: 700,
      color: "#6c757d",
      cursor: "pointer",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    activeTabBtn: {
      color: "#0e2318",
      borderBottom: "3px solid #c9a96e"
    },
    gridBI: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "30px",
      marginTop: "30px"
    },
    dashboardTitle: {
      fontSize: "28px",
      fontWeight: 800,
      color: "#0e2318",
      fontFamily: '"Playfair Display", serif',
      marginBottom: "4px"
    },
    dashboardSub: {
      fontSize: "13px",
      color: "#6c757d",
      marginBottom: "24px"
    },
    actionBtn: {
      background: "#0e2318",
      color: "#ffffff",
      border: "none",
      padding: "6px 12px",
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: 700,
      textTransform: "uppercase",
      cursor: "pointer",
      letterSpacing: "0.5px"
    },
    outlineBtn: {
      background: "none",
      border: "1px solid #c9a96e",
      color: "#0e2318",
      padding: "8px 16px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: 700,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    }
  };

  if (loading && !analytics) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#6c757d" }}>Loading commodity intelligence dashboard...</div>;
  }

  const activeFiltersText = Object.keys(filters)
    .filter(k => filters[k])
    .map(k => `${k}: ${filters[k]}`)
    .join(" | ") || "None";

  const sum = analytics.summary;

  return (
    <div style={{ fontFamily: '"DM Sans", sans-serif', color: "#0e2318", padding: "30px 20px" }}>
      <style>{`
        @media print {
          .sidebar, .navbar, .no-print, button, select, input, .filter-bar,
          [style*="filterBar"], [style*="outlineBtn"], [style*="tabBtn"], [style*="backLink"] {
            display: none !important;
          }
          
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
          }
          
          div {
            box-shadow: none !important;
            border-top: none !important;
          }
          
          .print-only-header {
            display: block !important;
          }
        }
      `}</style>

      {/* Print Metadata Header */}
      <div className="print-only-header" style={{ display: "none", marginBottom: "20px", borderBottom: "2px solid #0e2318", paddingBottom: "10px" }}>
        <h2 style={{ fontFamily: '"Playfair Display", serif', color: "#0e2318", margin: 0 }}>Commodity Trading Intelligence Report</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px", fontSize: "11px" }}>
          <div><strong>Exported By:</strong> {username || "Admin"}</div>
          <div><strong>Export Timestamp:</strong> {new Date().toLocaleString()}</div>
          <div><strong>Applied Filters:</strong> {activeFiltersText}</div>
          <div><strong>Date Range:</strong> {filters.start_date || "Any"} to {filters.end_date || "Any"}</div>
        </div>
      </div>

      {/* Dashboard Header */}
      {onBack && (
        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={onBack}
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              background: "#0e2318", color: "#c9a96e",
              border: "none", borderRadius: "8px",
              padding: "8px 16px", fontWeight: 700, fontSize: "13px",
              cursor: "pointer", letterSpacing: "0.3px"
            }}
          >
            ← Back to Accounts
          </button>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 style={styles.dashboardTitle}>Commodity Trading Intelligence Cockpit</h1>
          <p style={styles.dashboardSub}>Real-time profitability, brokerage intelligence, shipment performance, route analytics and buyer insights.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={styles.outlineBtn} onClick={handleCSVExport}>
            <FiDownload /> Export CSV
          </button>
          <button style={{ ...styles.outlineBtn, background: "#0e2318", color: "#ffffff", border: "none" }} onClick={() => window.print()}>
            <FiDownload /> Print PDF Report
          </button>
        </div>
      </div>

      {/* GLOBAL CENTRALIZED FILTERS BAR (HORIZONTAL TOOLBAR) */}
      <div style={styles.filterBar}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "12px", borderRight: "1px solid rgba(255,255,255,0.15)", paddingRight: "16px" }}>
          <FiFilter style={{ color: "#c9a96e", fontSize: "18px" }} />
          {hasActiveFilters && (
            <button 
              onClick={handleClearFilters}
              style={{
                background: "none",
                border: "none",
                color: "#c9a96e",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                cursor: "pointer",
                letterSpacing: "0.5px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <FiTrash2 size={12} /> Clear
            </button>
          )}
        </div>

        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Start Date</span>
          <input 
            type="date" 
            style={styles.filterInput}
            value={filters.start_date}
            onChange={e => handleFilterChange("start_date", e.target.value)}
          />
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>End Date</span>
          <input 
            type="date" 
            style={styles.filterInput}
            value={filters.end_date}
            onChange={e => handleFilterChange("end_date", e.target.value)}
          />
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Buyer</span>
          <select 
            style={styles.filterInput}
            value={filters.buyer_id}
            onChange={e => handleFilterChange("buyer_id", e.target.value)}
          >
            <option value="">All Buyers</option>
            {buyersList.map(b => <option key={b.id} value={b.id}>{b.buyer_name}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Seller</span>
          <select 
            style={styles.filterInput}
            value={filters.seller_id}
            onChange={e => handleFilterChange("seller_id", e.target.value)}
          >
            <option value="">All Sellers</option>
            {sellersList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Company</span>
          <select 
            style={styles.filterInput}
            value={filters.supplier_company_id}
            onChange={e => handleFilterChange("supplier_company_id", e.target.value)}
          >
            <option value="">All Suppliers</option>
            {companiesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Product</span>
          <select 
            style={styles.filterInput}
            value={filters.product_id}
            onChange={e => handleFilterChange("product_id", e.target.value)}
          >
            <option value="">All Products</option>
            {productsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Loading Port</span>
          <select 
            style={styles.filterInput}
            value={filters.loading_port}
            onChange={e => handleFilterChange("loading_port", e.target.value)}
          >
            <option value="">All Loading Ports</option>
            {loadingPorts.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Destination Port</span>
          <select 
            style={styles.filterInput}
            value={filters.destination_port}
            onChange={e => handleFilterChange("destination_port", e.target.value)}
          >
            <option value="">All Destinations</option>
            {destPorts.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Payment Mode</span>
          <select 
            style={styles.filterInput}
            value={filters.payment_mode}
            onChange={e => handleFilterChange("payment_mode", e.target.value)}
          >
            <option value="">All Modes</option>
            {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Status</span>
          <select 
            style={styles.filterInput}
            value={filters.status}
            onChange={e => handleFilterChange("status", e.target.value)}
          >
            <option value="Completed">Completed Only</option>
            <option value="Pending Financial Review">Pending Review</option>
            <option value="Draft">Drafts</option>
            <option value="Cancelled">Cancelled</option>
            <option value="All">All Statuses</option>
          </select>
        </div>
      </div>

      {/* TRADING INTELLIGENCE KPI GRIDS */}
      <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Financial Metrics & Leaderboards</h3>
      
      {/* Row 1 Grid: Core Financials (Forest Green / Dark Theme Gradients) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px",
        marginBottom: "20px"
      }}>
        <AnalyticsCard 
          title="Total Shipment Value" 
          value={`USD ${Number(sum.total_shipment_value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
          subtext="Total transaction volume" 
          icon={FiDollarSign}
          isDark={true}
          trend="Volume Leader"
        />
        <AnalyticsCard 
          title="Total Net Profit" 
          value={`USD ${Number(sum.total_net_profit).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
          subtext="Net corporate yield" 
          icon={FiTrendingUp}
          isDark={true}
          color="#28a745"
          trend="MoM +12.4%"
        />
        <AnalyticsCard 
          title="Total Commission Paid" 
          value={`USD ${Number(sum.total_commission_paid).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
          subtext="Brokerage outlays" 
          icon={FiUser}
          isDark={true}
          color="#fd7e14"
          trend="Mandate Share"
        />
        <AnalyticsCard 
          title="Avg Profit / Transaction" 
          value={`USD ${Number(sum.avg_profit_per_tx).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
          subtext="Average yield per deal" 
          icon={FiActivity}
          isDark={true}
          trend="Per Deal Yield"
        />
      </div>

      {/* Row 2 Grid: Highest Profit Entities (Beige/White Theme with Dark green border details) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px",
        marginBottom: "35px"
      }}>
        <AnalyticsCard 
          title="Highest Profit Buyer" 
          value={sum.highest_buyer ? sum.highest_buyer.name : "—"} 
          subtext={sum.highest_buyer ? `Net Profit: USD ${Number(sum.highest_buyer.profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "No data"} 
          icon={FiUser}
          isDark={false}
          trend="Top Customer"
          onClick={sum.highest_buyer && sum.highest_buyer.id ? () => onDrilldown("buyer", sum.highest_buyer.id) : null}
        />
        <AnalyticsCard 
          title="Highest Profit Product" 
          value={sum.highest_product ? sum.highest_product.name : "—"} 
          subtext={sum.highest_product ? `Net Profit: USD ${Number(sum.highest_product.profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "No data"} 
          icon={FiPackage}
          isDark={false}
          trend="Strategic Item"
          onClick={sum.highest_product && sum.highest_product.id ? () => onDrilldown("product", sum.highest_product.id) : null}
        />
        <AnalyticsCard 
          title="Highest Profit Supplier" 
          value={sum.highest_company ? sum.highest_company.name : "—"} 
          subtext={sum.highest_company ? `Net Profit: USD ${Number(sum.highest_company.profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "No data"} 
          icon={FiBriefcase}
          isDark={false}
          trend="Key Supplier"
          onClick={sum.highest_company && sum.highest_company.id ? () => onDrilldown("company", sum.highest_company.id) : null}
        />
        <AnalyticsCard 
          title="Highest Profit Route" 
          value={sum.highest_route ? `${sum.highest_route.loading_port} → ${sum.highest_route.destination_port}` : "—"} 
          subtext={sum.highest_route ? `Net Profit: USD ${Number(sum.highest_route.profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "No data"} 
          icon={FiAnchor}
          isDark={false}
          trend="Logistics Corridor"
          onClick={sum.highest_route && sum.highest_route.loading_port ? () => onDrilldown("port", sum.highest_route.loading_port) : null}
        />
      </div>

      {/* DASHBOARD TABS NAVIGATION */}
      <div style={{ display: "flex", borderBottom: "1px solid #ede9df", marginBottom: "30px" }}>
        <button style={{ ...styles.tabBtn, ...(activeTab === "exec" ? styles.activeTabBtn : {}) }} onClick={() => setActiveTab("exec")}>Executive BI</button>
        <button style={{ ...styles.tabBtn, ...(activeTab === "client" ? styles.activeTabBtn : {}) }} onClick={() => setActiveTab("client")}>Client BI (Buyers)</button>
        <button style={{ ...styles.tabBtn, ...(activeTab === "product" ? styles.activeTabBtn : {}) }} onClick={() => setActiveTab("product")}>Product &amp; Route BI</button>
        <button style={{ ...styles.tabBtn, ...(activeTab === "supplier" ? styles.activeTabBtn : {}) }} onClick={() => setActiveTab("supplier")}>Supplier &amp; Agent BI</button>
        <button style={{ ...styles.tabBtn, ...(activeTab === "pay" ? styles.activeTabBtn : {}) }} onClick={() => setActiveTab("pay")}>Payment &amp; Commission BI</button>
      </div>

      {/* =======================================================================
         TAB CONTENT: 1. EXECUTIVE BI
         ======================================================================= */}
      {activeTab === "exec" && (
        <div>
          {/* Executive BI Mini Stats Strip */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            background: "#ffffff",
            padding: "14px 24px",
            borderRadius: "10px",
            border: "1px solid rgba(14, 35, 24, 0.06)",
            marginBottom: "25px",
            fontSize: "13px"
          }}>
            <div><strong>Completed Transactions:</strong> <span style={{ color: "#0e2318", fontWeight: 700 }}>{sum.total_transactions} shipments</span></div>
            <div><strong>Active Buyers:</strong> <span style={{ color: "#0e2318", fontWeight: 700 }}>{sum.total_buyers} accounts</span></div>
            <div><strong>Products Traded:</strong> <span style={{ color: "#0e2318", fontWeight: 700 }}>{sum.total_products} products</span></div>
            <div><strong>Supplier Companies:</strong> <span style={{ color: "#0e2318", fontWeight: 700 }}>{sum.total_companies} suppliers</span></div>
          </div>

          <div style={{ background: "#ffffff", padding: "30px", borderRadius: "12px", boxShadow: "0 10px 30px rgba(14, 35, 24, 0.02)", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Monthly Revenue vs. Net Profit Trends
            </h3>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <AreaChart data={analytics.trends.monthly} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0e2318" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0e2318" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#28a745" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ede6" />
                  <XAxis dataKey="profit_month" stroke="#888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v.toLocaleString()}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" />
                  <Area type="monotone" name="Shipment Revenue" dataKey="revenue" stroke="#0e2318" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" name="Net Profit" dataKey="profit" stroke="#28a745" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.gridBI}>
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Quarterly Net Profit Contribution</h4>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={analytics.trends.quarterly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
                    <XAxis dataKey="profit_quarter" stroke="#888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar name="Net Profit" dataKey="profit" fill="#c9a96e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Yearly Revenue Overview</h4>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={analytics.trends.yearly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                    <XAxis dataKey="profit_year" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" name="Shipment Revenue" dataKey="revenue" stroke="#0e2318" strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line type="monotone" name="Net Profit" dataKey="profit" stroke="#28a745" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
         TAB CONTENT: 2. CLIENT BI (BUYERS)
         ======================================================================= */}
      {activeTab === "client" && (
        <AnalyticsTable 
          headers={[
            { text: "Buyer Name" },
            { text: "Company" },
            { text: "Transactions Count", align: "center" },
            { text: "Shipment Value", align: "right" },
            { text: "Net Profit Generated", align: "right" },
            { text: "Avg Margin / MT", align: "right" },
            { text: "Last Active" },
            { text: "Actions", align: "right" }
          ]}
          data={analytics.buyers}
          renderRow={(b, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #f8f6f0" }}>
              <td style={{ padding: "14px 16px" }}>
                <strong 
                  style={{ color: "#c9a96e", cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => onDrilldown("buyer", b.id)}
                >{b.buyer_name}</strong>
              </td>
              <td style={{ padding: "14px 16px" }}>{b.company_name}</td>
              <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 700 }}>{b.total_transactions}</td>
              <td style={{ padding: "14px 16px", textAlign: "right" }}>USD {Number(b.total_shipment_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "green" }}>USD {Number(b.total_net_profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td style={{ padding: "14px 16px", textAlign: "right" }}>USD {Number(b.avg_margin).toFixed(2)}</td>
              <td style={{ padding: "14px 16px" }}>{b.last_transaction_date ? new Date(b.last_transaction_date).toLocaleDateString() : "—"}</td>
              <td style={{ padding: "14px 16px", textAlign: "right" }}>
                <button style={styles.actionBtn} onClick={() => onDrilldown("buyer", b.id)}>View Dashboard</button>
              </td>
            </tr>
          )}
        />
      )}

      {/* =======================================================================
         TAB CONTENT: 3. PRODUCT & ROUTE BI
         ======================================================================= */}
      {activeTab === "product" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
            {/* Top Profitable Products Horizontal Chart */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Product Net Profit Rankings</h4>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={analytics.products.slice(0, 5)} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ede9df" />
                    <XAxis type="number" stroke="#888" fontSize={11} tickFormatter={v => `$${v.toLocaleString()}`} />
                    <YAxis dataKey="product_name" type="category" stroke="#888" fontSize={11} width={80} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar name="Net Profit" dataKey="total_profit" fill="#0e2318" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Trade Routes Horizontal Chart */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Top Profitable Trade Routes</h4>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={analytics.routes.top.slice(0, 5).map(r => ({ ...r, route_name: `${r.loading_port} → ${r.destination_port}` }))} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 10 }}>
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

          {/* Bottom Trade Routes Horizontal Chart */}
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)", marginTop: "30px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Lowest Profit Trade Routes</h4>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={analytics.routes.bottom.slice(0, 5).map(r => ({ ...r, route_name: `${r.loading_port} → ${r.destination_port}` }))} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ede9df" />
                  <XAxis type="number" stroke="#888" fontSize={11} tickFormatter={v => `$${v.toLocaleString()}`} />
                  <YAxis dataKey="route_name" type="category" stroke="#888" fontSize={11} width={120} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar name="Net Profit" dataKey="profit" fill="#dc3545" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Supplier Company x Product Matrix */}
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)", marginTop: "30px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Supplier Company × Product matrix</h4>
            <AnalyticsTable 
              headers={[
                { text: "Supplier Company" },
                { text: "Products Traded" },
                { text: "Quantity (MT)", align: "right" },
                { text: "Shipment Revenue", align: "right" },
                { text: "Net Profit Generated", align: "right" }
              ]}
              data={matrixData}
              renderRow={(company, idx) => (
                <>
                  <tr key={`company-${idx}`} style={{ background: "#faf9f6", borderBottom: "1px solid #ede9df" }}>
                    <td colSpan={5} style={{ padding: "12px 16px", fontWeight: 700 }}>
                      <span 
                        style={{ color: "#0e2318", cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => onDrilldown("company", company.company_id)}
                      >{company.company_name}</span>
                    </td>
                  </tr>
                  {company.products.map((p, pIdx) => (
                    <tr key={`prod-${idx}-${pIdx}`} style={{ borderBottom: "1px solid #f8f6f0" }}>
                      <td></td>
                      <td style={{ padding: "10px 16px 10px 30px" }}>
                        <span 
                          style={{ color: "#c9a96e", cursor: "pointer", textDecoration: "underline" }}
                          onClick={() => onDrilldown("product", p.product_id)}
                        >{p.product_name}</span>
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "right" }}>{Number(p.quantity).toLocaleString()}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right" }}>USD {Number(p.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: "green" }}>USD {Number(p.profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </>
              )}
            />
          </div>
        </div>
      )}

      {/* =======================================================================
         TAB CONTENT: 4. SUPPLIER & AGENT BI
         ======================================================================= */}
      {activeTab === "supplier" && (
        <div>
          {/* Supplier Leaderboard list */}
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "20px", textTransform: "uppercase" }}>Supplier Company Performance Leaderboard</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {analytics.companies.slice(0, 5).map((c, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 18px",
                  background: "#fafafa",
                  borderLeft: "4px solid #c9a96e",
                  borderRadius: "6px",
                  border: "1px solid #ede9df",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.01)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      background: "#0e2318",
                      color: "#c9a96e",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "12px"
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <strong 
                        style={{ color: "#0e2318", cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => onDrilldown("company", c.id)}
                      >
                        {c.company_name}
                      </strong>
                      <div style={{ fontSize: "11px", color: "#666" }}>
                        {c.transactions} shipments | {c.buyers_served} buyers served
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "24px", textAlign: "right" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase" }}>Revenue</div>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>USD {Number(c.revenue).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase" }}>Commission</div>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>USD {Number(c.commission).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", color: "#28a745" }}>Net Profit</div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#28a745" }}>USD {Number(c.profit).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sellers performance leaderboard list */}
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)", marginTop: "30px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "20px", textTransform: "uppercase" }}>Seller Performance Leaderboard</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {analytics.sellers.slice(0, 5).map((s, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 18px",
                  background: "#fafafa",
                  borderLeft: "4px solid #0e2318",
                  borderRadius: "6px",
                  border: "1px solid #ede9df",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.01)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      background: "#c9a96e",
                      color: "#0e2318",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "12px"
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <strong 
                        style={{ color: "#0e2318", cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => onDrilldown("seller", s.id)}
                      >
                        {s.seller_name}
                      </strong>
                      <div style={{ fontSize: "11px", color: "#666" }}>
                        {s.transactions} transactions | {s.products_sold} products sold
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "24px", textAlign: "right" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase" }}>Revenue</div>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>USD {Number(s.revenue).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase" }}>Comm Impact</div>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>USD {Number(s.commission_impact).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", color: "#0e2318" }}>Net Profit</div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#0e2318" }}>USD {Number(s.profit).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
         TAB CONTENT: 5. PAYMENT & COMMISSION BI
         ======================================================================= */}
      {activeTab === "pay" && (
        <div style={styles.gridBI}>
          {/* Top Brokerage Mandates Leaderboard list */}
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "20px", textTransform: "uppercase" }}>Top Earning Brokerage Mandates</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {analytics.commissions.slice(0, 5).map((cm, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 18px",
                  background: "#fafafa",
                  borderLeft: "4px solid #fd7e14",
                  borderRadius: "6px",
                  border: "1px solid #ede9df"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      background: "#fd7e14",
                      color: "#ffffff",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "12px"
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <strong style={{ color: "#0e2318" }}>{cm.name}</strong>
                      <div style={{ fontSize: "11px", color: "#666" }}>{cm.phone}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase" }}>Total Earned</div>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#fd7e14" }}>USD {Number(cm.total_commission).toLocaleString()}</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>{cm.transaction_count} shipments</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            {/* Brokerage Commission Trend Chart */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Brokerage Commission Trend</h4>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <AreaChart data={analytics.trends.monthly}>
                    <defs>
                      <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fd7e14" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#fd7e14" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
                    <XAxis dataKey="profit_month" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} tickFormatter={v => `$${v.toLocaleString()}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" name="Commission Paid" dataKey="commission" stroke="#fd7e14" strokeWidth={3} fillOpacity={1} fill="url(#commGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Mode Donut Chart */}
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid rgba(14, 35, 24, 0.05)" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0e2318", marginBottom: "16px", textTransform: "uppercase" }}>Payment Mode Usage</h4>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={analytics.paymentModes}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="payment_mode"
                    >
                      {analytics.paymentModes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#0e2318", "#c9a96e", "#28a745", "#fd7e14", "#888"][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [value, `Transactions (${props.payload.payment_mode})`]} />
                    <Legend iconSize={10} fontSize={11} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
