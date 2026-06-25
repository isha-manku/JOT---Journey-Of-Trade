import { useEffect, useState, useMemo } from "react";
import { 
  FiDollarSign, FiPlus, FiArrowLeft, FiSearch, FiCalendar, 
  FiFilter, FiCheckCircle, FiClock, FiXCircle, FiEdit2, FiTrash2, FiAlertTriangle,
  FiTrendingUp
} from "react-icons/fi";
import AccountsDashboard from "./AccountsDashboard";
import BuyerDashboard from "./BuyerDashboard";
import SellerDashboard from "./SellerDashboard";
import ProductDashboard from "./ProductDashboard";
import CompanyDashboard from "./CompanyDashboard";
import PortDashboard from "./PortDashboard";

export default function Accounts() {
  const role = localStorage.getItem("role") || "manager";
  const username = localStorage.getItem("username") || "User";

  // Navigation state: 'landing', 'update', 'view', 'dashboard', 'detail'
  const [view, setView] = useState("landing");
  const [detailType, setDetailType] = useState(null); // 'buyer', 'seller', 'product', 'company', 'port'
  const [detailId, setDetailId] = useState(null);
  const [navHistory, setNavHistory] = useState([]);

  const pushView = (newView, type = null, id = null) => {
    setNavHistory(prev => [...prev, { view, detailType, detailId }]);
    setView(newView);
    setDetailType(type);
    setDetailId(id);
  };

  const popView = () => {
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory(prevHistory => prevHistory.slice(0, -1));
      setView(prev.view);
      setDetailType(prev.detailType);
      setDetailId(prev.detailId);
    } else {
      setView("dashboard");
      setDetailType(null);
      setDetailId(null);
    }
  };
  
  // Data lists
  const [transactions, setTransactions] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);

  // Loading and Error states
  const [loading, setLoading] = useState(false);
  const [productsEmpty, setProductsEmpty] = useState(false);

  // Modals state
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ code: "", name: "", symbol: "" });
  const [currencyError, setCurrencyError] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPaymentMode, setNewPaymentMode] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Edit / Review transaction state
  const [editingTxId, setEditingTxId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    transaction_date: new Date().toISOString().split("T")[0],
    buyer_id: "",
    seller_id: "",
    product_id: "",
    supplier_company_id: "",
    loading_port: "",
    destination_port: "",
    quantity_mt: "",
    selling_price: "",
    selling_currency: "USD",
    payment_mode: "",
    ci_no: "",
    spa_no: "",
    
    // Admin Fields
    cost_price: "",
    cost_currency: "USD",
    impfa_no: "",
    status: "Pending Financial Review",
    mandates: [] // [{ name: "", phone: "", amount: "" }]
  });

  // Filter & Search State
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterPaymentMode, setFilterPaymentMode] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Fetch reference lists
  const fetchReferenceData = async () => {
    try {
      const [resBuyers, resSellers, resCompanies, resProducts, resCurrencies, resPaymentModes] = await Promise.all([
        fetch("http://localhost:5000/buyers").then(r => r.json()).catch(() => []),
        fetch("http://localhost:5000/sellers").then(r => r.json()).catch(() => []),
        fetch("http://localhost:5000/companies").then(r => r.json()).catch(() => []),
        fetch("http://localhost:5000/products").then(r => r.json()).catch(() => []),
        fetch("http://localhost:5000/currencies").then(r => r.json()).catch(() => []),
        fetch("http://localhost:5000/payment-modes").then(r => r.json()).catch(() => [])
      ]);

      setBuyers(Array.isArray(resBuyers) ? resBuyers : []);
      setSellers(Array.isArray(resSellers) ? resSellers : []);
      setCompanies(Array.isArray(resCompanies) ? resCompanies : []);
      setCurrencies(Array.isArray(resCurrencies) ? resCurrencies : []);
      setPaymentModes(Array.isArray(resPaymentModes) ? resPaymentModes : []);

      const validProducts = Array.isArray(resProducts) ? resProducts : [];
      setProducts(validProducts);
      setProductsEmpty(validProducts.length === 0);
    } catch (e) {
      console.error("Error loading reference lists", e);
    }
  };

  // Fetch transactions (Admin only)
  const fetchTransactions = async () => {
    if (role !== "admin") return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/accounts", {
        headers: { "x-user-role": "admin" }
      });
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading transactions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferenceData();
    if (role === "admin") {
      fetchTransactions();
    }
  }, []);

  // Live Auto-Calculations
  const shipmentValue = useMemo(() => {
    const qty = Number(form.quantity_mt) || 0;
    const price = Number(form.selling_price) || 0;
    return (qty * price).toFixed(2);
  }, [form.quantity_mt, form.selling_price]);

  const margin = useMemo(() => {
    if (role !== "admin" || !form.cost_price) return "0.00";
    const sell = Number(form.selling_price) || 0;
    const cost = Number(form.cost_price) || 0;
    return (sell - cost).toFixed(2);
  }, [form.selling_price, form.cost_price]);

  const totalCommission = useMemo(() => {
    if (role !== "admin") return "0.00";
    let sum = 0;
    form.mandates.forEach(m => {
      sum += Number(m.amount) || 0;
    });
    return sum.toFixed(2);
  }, [form.mandates]);

  const netProfit = useMemo(() => {
    if (role !== "admin") return "0.00";
    const qty = Number(form.quantity_mt) || 0;
    const marg = Number(margin) || 0;
    const comm = Number(totalCommission) || 0;
    return ((marg * qty) - comm).toFixed(2);
  }, [margin, form.quantity_mt, totalCommission]);

  // Handle mandate changes (Admin only)
  const handleMandateChange = (index, field, value) => {
    const updated = [...form.mandates];
    updated[index][field] = value;
    setForm({ ...form, mandates: updated });
  };

  const addMandateRow = () => {
    setForm({
      ...form,
      mandates: [...form.mandates, { name: "", phone: "", amount: "" }]
    });
  };

  const removeMandateRow = (index) => {
    const updated = form.mandates.filter((_, i) => i !== index);
    setForm({ ...form, mandates: updated });
  };

  // Add Currency API
  const handleAddCurrency = async () => {
    setCurrencyError("");
    if (!newCurrency.code.trim() || !newCurrency.name.trim() || !newCurrency.symbol.trim()) {
      setCurrencyError("⚠️ Please fill all currency fields.");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCurrency)
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCurrencyError(data.error || "Failed to add currency.");
      } else {
        await fetchReferenceData();
        setShowCurrencyModal(false);
        setNewCurrency({ code: "", name: "", symbol: "" });
      }
    } catch (e) {
      setCurrencyError("Server error adding currency.");
    }
  };

  // Add Payment Mode API
  const handleAddPaymentMode = async () => {
    setPaymentError("");
    if (!newPaymentMode.trim()) {
      setPaymentError("⚠️ Payment mode name is required.");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/payment-modes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPaymentMode })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPaymentError(data.error || "Failed to add payment mode.");
      } else {
        await fetchReferenceData();
        setShowPaymentModal(false);
        setNewPaymentMode("");
      }
    } catch (e) {
      setPaymentError("Server error adding payment mode.");
    }
  };

  // Form Submit (Create/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (productsEmpty) {
      alert("❌ Cannot save transaction. Please add products to CRM first.");
      return;
    }

    if (
      !form.buyer_id ||
      !form.seller_id ||
      !form.product_id ||
      !form.supplier_company_id ||
      !form.loading_port.trim() ||
      !form.destination_port.trim() ||
      !form.quantity_mt ||
      !form.selling_price ||
      !form.payment_mode ||
      !form.ci_no.trim() ||
      !form.spa_no.trim()
    ) {
      alert("⚠️ Please fill all required logistics and transaction fields.");
      return;
    }

    const payload = {
      ...form,
      shipment_value: Number(shipmentValue),
      margin: role === "admin" ? Number(margin) : null,
      commission_total: role === "admin" ? Number(totalCommission) : null,
      net_profit: role === "admin" ? Number(netProfit) : null,
    };

    const url = editingTxId 
      ? `http://localhost:5000/accounts/${editingTxId}` 
      : "http://localhost:5000/accounts";
    const method = editingTxId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-role": role,
          "x-username": username
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Error saving transaction: " + (data.error || "Unknown error"));
      } else {
        alert(editingTxId ? "✅ Review Completed Successfully!" : `✅ Transaction Saved! Reference: ${data.transaction_no}`);
        setForm({
          transaction_date: new Date().toISOString().split("T")[0],
          buyer_id: "",
          seller_id: "",
          product_id: "",
          supplier_company_id: "",
          loading_port: "",
          destination_port: "",
          quantity_mt: "",
          selling_price: "",
          selling_currency: "USD",
          payment_mode: "",
          ci_no: "",
          spa_no: "",
          cost_price: "",
          cost_currency: "USD",
          impfa_no: "",
          status: "Pending Financial Review",
          mandates: []
        });
        setEditingTxId(null);
        if (role === "admin") {
          await fetchTransactions();
          setView("view");
        } else {
          setView("landing");
        }
      }
    } catch (e) {
      alert("Network error saving transaction.");
    }
  };

  // Open Edit / Review Form (Admin Only)
  const handleEditClick = async (tx) => {
    setEditingTxId(tx.id);
    setForm({
      transaction_date: tx.transaction_date.split("T")[0],
      buyer_id: tx.buyer_id || "",
      seller_id: tx.seller_id || "",
      product_id: tx.product_id || "",
      supplier_company_id: tx.supplier_company_id || "",
      loading_port: tx.loading_port || "",
      destination_port: tx.destination_port || "",
      quantity_mt: tx.quantity_mt || "",
      selling_price: tx.selling_price || "",
      selling_currency: tx.selling_currency || "USD",
      payment_mode: tx.payment_mode || "",
      ci_no: tx.ci_no || "",
      spa_no: tx.spa_no || "",
      cost_price: tx.cost_price || "",
      cost_currency: tx.cost_currency || "USD",
      impfa_no: tx.impfa_no || "",
      status: tx.status || "Completed",
      mandates: tx.mandates || []
    });
    setView("update");
  };

  // Soft Delete / Cancel transaction (Admin Only)
  const handleCancelClick = async (txId) => {
    if (!window.confirm("Are you sure you want to cancel this financial transaction? This action is soft-delete only and remains auditable.")) return;
    try {
      const res = await fetch(`http://localhost:5000/accounts/${txId}/cancel`, {
        method: "POST",
        headers: { "x-user-role": "admin" }
      });
      if (res.ok) {
        alert("✅ Transaction Cancelled Successfully.");
        await fetchTransactions();
      } else {
        alert("Failed to cancel transaction.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReopen = async () => {
    if (!window.confirm("Are you sure you want to reopen this Completed transaction? This will unlock the transaction and reset its status to Pending Financial Review.")) return;
    try {
      const res = await fetch(`http://localhost:5000/accounts/${editingTxId}/reopen`, {
        method: "POST",
        headers: { 
          "x-user-role": role,
          "x-username": username
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Transaction Reopened Successfully. The form is now unlocked.");
        setForm({ ...form, status: "Pending Financial Review" });
      } else {
        alert("Failed to reopen transaction: " + (data.error || ""));
      }
    } catch (e) {
      alert("Network error reopening transaction.");
    }
  };

  // Filtered and Searched Transactions List (Admin Only)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = 
        (tx.buyer_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (tx.buyer_company_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (tx.seller_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (tx.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (tx.supplier_company_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (tx.transaction_no || "").toLowerCase().includes(search.toLowerCase());

      const matchCompany = !filterCompany || tx.supplier_company_id === Number(filterCompany);
      const matchMode = !filterPaymentMode || tx.payment_mode === filterPaymentMode;

      let matchDate = true;
      if (filterStartDate) {
        matchDate = matchDate && new Date(tx.transaction_date) >= new Date(filterStartDate);
      }
      if (filterEndDate) {
        matchDate = matchDate && new Date(tx.transaction_date) <= new Date(filterEndDate);
      }

      return matchSearch && matchCompany && matchMode && matchDate;
    });
  }, [transactions, search, filterCompany, filterPaymentMode, filterStartDate, filterEndDate]);

  // Styles setup to enforce dark green & gold aesthetic
  const styles = {
    landingContainer: {
      padding: "40px 20px",
      maxWidth: "1000px",
      margin: "0 auto",
      fontFamily: '"DM Sans", sans-serif'
    },
    title: {
      color: "#0e2318",
      fontSize: "32px",
      fontWeight: 800,
      fontFamily: '"Playfair Display", serif',
      marginBottom: "8px"
    },
    subtitle: {
      color: "#6c757d",
      fontSize: "14px",
      marginBottom: "40px"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "30px",
      marginTop: "20px"
    },
    card: {
      background: "#ffffff",
      borderTop: "6px solid #c9a96e",
      borderRadius: "16px",
      padding: "32px",
      boxShadow: "0 10px 30px rgba(14, 35, 24, 0.04)",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      transition: "all 0.3s ease",
      cursor: "pointer"
    },
    cardHover: {
      transform: "translateY(-5px)",
      boxShadow: "0 15px 35px rgba(14, 35, 24, 0.08)"
    },
    cardTitle: {
      color: "#0e2318",
      fontSize: "20px",
      fontWeight: 700,
      fontFamily: '"Playfair Display", serif',
      marginBottom: "12px",
      display: "flex",
      alignItems: "center",
      gap: "10px"
    },
    cardDesc: {
      color: "#6c757d",
      fontSize: "13px",
      lineHeight: "1.6",
      marginBottom: "24px"
    },
    cardBtn: {
      background: "#0e2318",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      padding: "10px 20px",
      fontWeight: 700,
      fontSize: "13px",
      cursor: "pointer",
      alignSelf: "stretch",
      textAlign: "center",
      transition: "background 0.2s",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    formContainer: {
      maxWidth: "1100px",
      margin: "0 auto",
      padding: "30px 20px",
      fontFamily: '"DM Sans", sans-serif'
    },
    backLink: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      color: "#0e2318",
      fontWeight: 700,
      fontSize: "14px",
      textDecoration: "none",
      cursor: "pointer",
      marginBottom: "24px"
    },
    sectionTitle: {
      fontSize: "15px",
      fontWeight: 700,
      color: "#c9a96e",
      textTransform: "uppercase",
      letterSpacing: "1px",
      borderBottom: "1px solid #ede9df",
      paddingBottom: "8px",
      marginTop: "30px",
      marginBottom: "20px"
    },
    warningBlock: {
      background: "rgba(255, 193, 7, 0.08)",
      borderLeft: "4px solid #ffc107",
      color: "#856404",
      padding: "16px 20px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      fontSize: "14px",
      marginBottom: "24px"
    },
    formBox: {
      background: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 10px 30px rgba(14, 35, 24, 0.03)",
      padding: "35px",
      border: "1px solid rgba(14, 35, 24, 0.05)"
    },
    grid2Col: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px"
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    },
    label: {
      fontSize: "12px",
      fontWeight: 700,
      color: "#0e2318",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    input: {
      padding: "12px 14px",
      borderRadius: "8px",
      border: "1px solid #ede9df",
      fontSize: "14px",
      outline: "none",
      transition: "border-color 0.2s",
      background: "#fafafa"
    },
    inputReadonly: {
      background: "#f0ede6",
      border: "1px solid #ede9df",
      color: "#495057",
      fontWeight: 600
    },
    select: {
      padding: "12px 14px",
      borderRadius: "8px",
      border: "1px solid #ede9df",
      fontSize: "14px",
      outline: "none",
      background: "#fafafa"
    },
    inputAddGroup: {
      display: "flex",
      gap: "10px",
      alignItems: "stretch"
    },
    iconBtn: {
      background: "#0e2318",
      color: "#c9a96e",
      border: "none",
      width: "44px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: "18px"
    },
    mandateTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "10px"
    },
    mandateTh: {
      textAlign: "left",
      fontSize: "12px",
      fontWeight: 700,
      color: "#0e2318",
      textTransform: "uppercase",
      padding: "8px",
      borderBottom: "1px solid #ede9df"
    },
    mandateTd: {
      padding: "8px",
      borderBottom: "1px solid #f8f6f0"
    },
    addMandateBtn: {
      background: "transparent",
      color: "#c9a96e",
      border: "1px dashed #c9a96e",
      padding: "8px 16px",
      borderRadius: "8px",
      fontWeight: 700,
      fontSize: "13px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      marginTop: "12px"
    },
    saveBtn: {
      background: "#0e2318",
      color: "#ffffff",
      border: "none",
      padding: "14px 30px",
      borderRadius: "8px",
      fontSize: "15px",
      fontWeight: 700,
      cursor: "pointer",
      width: "100%",
      marginTop: "30px",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(14, 35, 24, 0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    },
    modalBox: {
      background: "#ffffff",
      borderRadius: "16px",
      padding: "30px",
      width: "400px",
      boxShadow: "0 15px 40px rgba(0, 0, 0, 0.15)",
      borderTop: "6px solid #c9a96e"
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px"
    },
    modalTitle: {
      fontSize: "18px",
      fontWeight: 700,
      color: "#0e2318",
      fontFamily: '"Playfair Display", serif'
    },
    modalClose: {
      background: "none",
      border: "none",
      fontSize: "18px",
      cursor: "pointer",
      color: "#6c757d"
    },
    // Grid Page Styles
    gridHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px"
    },
    filterBar: {
      background: "#ffffff",
      borderRadius: "12px",
      padding: "18px",
      boxShadow: "0 5px 20px rgba(14, 35, 24, 0.02)",
      border: "1px solid rgba(14, 35, 24, 0.05)",
      marginBottom: "24px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "16px",
      alignItems: "center"
    },
    tableWrap: {
      background: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 10px 30px rgba(14, 35, 24, 0.03)",
      border: "1px solid rgba(14, 35, 24, 0.05)",
      overflowX: "auto",
      marginBottom: "30px"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "13px"
    },
    th: {
      background: "#f8f6f0",
      color: "#0e2318",
      fontWeight: 700,
      textTransform: "uppercase",
      fontSize: "11px",
      letterSpacing: "0.5px",
      padding: "16px 12px",
      textAlign: "left",
      borderBottom: "2px solid #ede9df"
    },
    td: {
      padding: "14px 12px",
      borderBottom: "1px solid #f8f6f0",
      color: "#333"
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: 700,
      textTransform: "uppercase"
    }
  };

  // Render Badge based on status
  const renderStatusBadge = (status) => {
    let color = "#6c757d";
    let bg = "rgba(108, 117, 125, 0.1)";
    let Icon = FiClock;

    if (status === "Completed") {
      color = "#28a745";
      bg = "rgba(40, 167, 69, 0.1)";
      Icon = FiCheckCircle;
    } else if (status === "Pending Financial Review") {
      color = "#fd7e14";
      bg = "rgba(253, 126, 20, 0.1)";
      Icon = FiClock;
    } else if (status === "Cancelled") {
      color = "#dc3545";
      bg = "rgba(220, 53, 69, 0.1)";
      Icon = FiXCircle;
    }

    return (
      <span style={{ ...styles.badge, color, backgroundColor: bg }}>
        <Icon size={12} />
        {status === "Pending Financial Review" ? "Pending Review" : status}
      </span>
    );
  };

  // ===========================================================================
  //  1. LANDING VIEW
  // ===========================================================================
  if (view === "landing") {
    const landingCards = [
      role === "admin" ? {
        id: "view",
        icon: <FiDollarSign size={22} />,
        label: "Financial Ledger",
        tag: "ADMIN",
        tagColor: "#c9a96e",
        desc: "Access the complete financial transaction ledger. Review net profit margins, mandate commissions, IMPFA records, and full audit trails.",
        btn: "Open Ledger",
        onClick: () => setView("view"),
        accentColor: "#c9a96e"
      } : null,
      {
        id: "update",
        icon: <FiPlus size={22} />,
        label: "New Account Entry",
        tag: role === "admin" ? "ADMIN + MANAGER" : "MANAGER",
        tagColor: "#5ba85e",
        desc: role === "admin"
          ? "Enter new shipment ledger transactions with margins, or audit pending drafts submitted by managers."
          : "Record raw transaction data including loading ports, buyers, selling prices, and submit for admin review.",
        btn: "Add Account Entry",
        onClick: () => {
          setEditingTxId(null);
          setForm({
            transaction_date: new Date().toISOString().split("T")[0],
            buyer_id: "", seller_id: "", product_id: "", supplier_company_id: "",
            loading_port: "", destination_port: "",
            quantity_mt: "", selling_price: "", selling_currency: "USD",
            payment_mode: "", ci_no: "", spa_no: "",
            cost_price: "", cost_currency: "USD", impfa_no: "",
            status: "Pending Financial Review", mandates: []
          });
          setView("update");
        },
        accentColor: "#5ba85e"
      },
      role === "admin" ? {
        id: "dashboard",
        icon: <FiTrendingUp size={22} />,
        label: "BI Intelligence Dashboard",
        tag: "ADMIN",
        tagColor: "#c9a96e",
        desc: "Explore aggregated metrics, route analytics, company–product matrix, and profitability rankings in a commodity intelligence platform.",
        btn: "Open Dashboard",
        onClick: () => { setView("dashboard"); setNavHistory([]); },
        accentColor: "#c9a96e"
      } : null
    ].filter(Boolean);

    return (
      <div style={{ padding: "40px 28px", maxWidth: "1100px", margin: "0 auto", fontFamily: '"DM Sans", sans-serif' }}>
        {/* Page Header */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
            <div style={{
              width: "46px", height: "46px", borderRadius: "12px",
              background: "linear-gradient(135deg, #0e2318 0%, #1a3d2b 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#c9a96e", flexShrink: 0,
              boxShadow: "0 4px 14px rgba(14,35,24,0.18)"
            }}>
              <FiDollarSign size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#0e2318", fontFamily: '"Playfair Display", serif', lineHeight: 1.2 }}>
                Accounts Management
              </h1>
              <p style={{ margin: 0, fontSize: "13px", color: "#6c757d", marginTop: "4px" }}>
                Shipment ledgers · Commission mandates · Profit tracking · Financial audit workflows
              </p>
            </div>
          </div>
          {/* Divider */}
          <div style={{ height: "2px", background: "linear-gradient(90deg, #0e2318 0%, #c9a96e 60%, transparent 100%)", borderRadius: "2px", marginTop: "16px", opacity: 0.15 }} />
        </div>

        {/* Module Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "28px" }}>
          {landingCards.map(card => (
            <div
              key={card.id}
              onClick={card.onClick}
              style={{
                background: "#ffffff",
                borderRadius: "18px",
                padding: "32px",
                boxShadow: "0 8px 32px rgba(14,35,24,0.06), 0 1px 4px rgba(14,35,24,0.04)",
                border: "1px solid rgba(14,35,24,0.06)",
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                cursor: "pointer", transition: "all 0.28s cubic-bezier(0.4,0,0.2,1)",
                position: "relative", overflow: "hidden"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 16px 40px rgba(14,35,24,0.12), 0 2px 8px rgba(14,35,24,0.06)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(14,35,24,0.06), 0 1px 4px rgba(14,35,24,0.04)";
              }}
            >
              {/* Top accent bar */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(90deg, #0e2318, ${card.accentColor})` }} />
              
              {/* Icon + Tag row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "20px" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #0e2318 0%, #1a3d2b 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: card.accentColor, boxShadow: "0 4px 12px rgba(14,35,24,0.15)"
                }}>
                  {card.icon}
                </div>
                <span style={{
                  fontSize: "10px", fontWeight: 700, letterSpacing: "1px",
                  padding: "4px 10px", borderRadius: "20px", textTransform: "uppercase",
                  background: `${card.tagColor}18`, color: card.tagColor,
                  border: `1px solid ${card.tagColor}40`
                }}>{card.tag}</span>
              </div>

              {/* Title */}
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0e2318", fontFamily: '"Playfair Display", serif', marginBottom: "10px" }}>
                {card.label}
              </div>

              {/* Description */}
              <p style={{ color: "#6c757d", fontSize: "13px", lineHeight: "1.65", marginBottom: "28px", flex: 1 }}>
                {card.desc}
              </p>

              {/* Button */}
              <button
                style={{
                  background: "linear-gradient(135deg, #0e2318 0%, #1a3d2b 100%)",
                  color: card.accentColor, border: "none",
                  borderRadius: "10px", padding: "11px 22px",
                  fontWeight: 700, fontSize: "13px", cursor: "pointer",
                  alignSelf: "stretch", textAlign: "center",
                  textTransform: "uppercase", letterSpacing: "0.8px",
                  transition: "opacity 0.2s"
                }}
              >
                {card.btn}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ===========================================================================
  //  2. UPDATE / REVIEW ENTRY FORM
  // ===========================================================================
  if (view === "update") {
    const isLocked = form.status === "Completed";

    return (
      <div style={styles.formContainer}>
        <button
          onClick={() => setView("landing")}
          style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            background: "#0e2318", color: "#c9a96e",
            border: "none", borderRadius: "8px",
            padding: "8px 16px", fontWeight: 700, fontSize: "13px",
            cursor: "pointer", marginBottom: "24px",
            letterSpacing: "0.3px", transition: "opacity 0.2s"
          }}
        >
          <FiArrowLeft size={14} /> Back to Accounts
        </button>

        <h1 style={styles.title}>
          {editingTxId 
            ? `Financial Audit: ${form.ci_no}` 
            : "New Account Entry"}
        </h1>
        <p style={styles.subtitle}>
          {editingTxId 
            ? "Verify manager transaction parameters, fill cost structures, commissions, and mark Completed."
            : "Fill in logistics and transaction parameters. Admin validation will complete margins and profit calculations."}
        </p>

        {isLocked && (
          <div style={{ ...styles.warningBlock, background: "rgba(40, 167, 69, 0.08)", borderLeft: "4px solid #28a745", color: "#155724", marginBottom: "20px" }}>
            <FiCheckCircle size={20} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span><strong>This transaction is COMPLETED and locked.</strong> Modifications are disabled.</span>
              {role === "admin" && (
                <button 
                  type="button" 
                  onClick={handleReopen} 
                  style={{ ...styles.cardBtn, width: "auto", alignSelf: "center", marginLeft: "10px", padding: "6px 12px", background: "#c9a96e", color: "#0e2318" }}
                >
                  Reopen Transaction
                </button>
              )}
            </div>
          </div>
        )}

        {productsEmpty && (
          <div style={styles.warningBlock}>
            <FiAlertTriangle size={20} />
            <div>
              <strong>No products configured!</strong> Please create products in the CRM Products catalog before recording account transactions.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.formBox}>
          {/* Section: Logistics */}
          <div style={styles.sectionTitle}>Logistics</div>
          <div style={{ ...styles.grid2Col, marginBottom: "20px" }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Supplier Company (Our Company) *</label>
              <select 
                style={styles.select}
                value={form.supplier_company_id}
                onChange={e => setForm({ ...form, supplier_company_id: e.target.value })}
                required
                disabled={isLocked}
              >
                <option value="">-- Choose Company --</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Transaction Date *</label>
              <input 
                type="date"
                style={styles.input}
                value={form.transaction_date}
                onChange={e => setForm({ ...form, transaction_date: e.target.value })}
                required
                disabled={isLocked}
              />
            </div>
          </div>

          <div style={{ ...styles.grid2Col, marginBottom: "20px" }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Loading Port *</label>
              <input 
                placeholder="Loading Port Name"
                style={styles.input}
                value={form.loading_port}
                onChange={e => setForm({ ...form, loading_port: e.target.value })}
                required
                disabled={isLocked}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Destination Port *</label>
              <input 
                placeholder="Destination Port Name"
                style={styles.input}
                value={form.destination_port}
                onChange={e => setForm({ ...form, destination_port: e.target.value })}
                required
                disabled={isLocked}
              />
            </div>
          </div>

          {/* Section: Transaction Details */}
          <div style={styles.sectionTitle}>Transaction Parameters</div>
          <div style={{ ...styles.grid2Col, marginBottom: "20px" }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Buyer Name *</label>
              <select 
                style={styles.select}
                value={form.buyer_id}
                onChange={e => setForm({ ...form, buyer_id: e.target.value })}
                required
                disabled={isLocked}
              >
                <option value="">-- Choose Buyer --</option>
                {buyers.map(b => <option key={b.id} value={b.id}>{b.buyer_name} ({b.company_name})</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Seller Name *</label>
              <select 
                style={styles.select}
                value={form.seller_id}
                onChange={e => setForm({ ...form, seller_id: e.target.value })}
                required
                disabled={isLocked}
              >
                <option value="">-- Choose Seller --</option>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ ...styles.grid2Col, marginBottom: "20px" }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Product *</label>
              <select 
                style={styles.select}
                value={form.product_id}
                onChange={e => setForm({ ...form, product_id: e.target.value })}
                required
                disabled={isLocked}
              >
                <option value="">-- Choose Product --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Quantity (MT) *</label>
              <input 
                type="number"
                step="0.0001"
                placeholder="Quantity in Metric Tons"
                style={styles.input}
                value={form.quantity_mt}
                onChange={e => setForm({ ...form, quantity_mt: e.target.value })}
                required
                disabled={isLocked}
              />
            </div>
          </div>

          <div style={{ ...styles.grid2Col, marginBottom: "20px" }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Selling Price (per MT) *</label>
              <div style={styles.inputAddGroup}>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="Price per MT"
                  style={{ ...styles.input, flex: 1 }}
                  value={form.selling_price}
                  onChange={e => setForm({ ...form, selling_price: e.target.value })}
                  required
                  disabled={isLocked}
                />
                <select 
                  style={styles.select}
                  value={form.selling_currency}
                  onChange={e => setForm({ ...form, selling_currency: e.target.value })}
                  required
                  disabled={isLocked}
                >
                  {currencies.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
                </select>
                <button type="button" style={styles.iconBtn} onClick={() => setShowCurrencyModal(true)} title="Add Currency" disabled={isLocked}>+</button>
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Total Shipment Value (Auto Calculated)</label>
              <input 
                type="text"
                style={{ ...styles.input, ...styles.inputReadonly }}
                value={`${form.selling_currency} ${shipmentValue}`}
                readOnly
              />
            </div>
          </div>

          <div style={{ ...styles.grid2Col, marginBottom: "20px" }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>CI Number *</label>
              <input 
                placeholder="Commercial Invoice No"
                style={styles.input}
                value={form.ci_no}
                onChange={e => setForm({ ...form, ci_no: e.target.value })}
                required
                disabled={isLocked}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>SPA Number *</label>
              <input 
                placeholder="SPA Number"
                style={styles.input}
                value={form.spa_no}
                onChange={e => setForm({ ...form, spa_no: e.target.value })}
                required
                disabled={isLocked}
              />
            </div>
          </div>

          <div style={{ ...styles.grid2Col, marginBottom: "20px" }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Payment Mode *</label>
              <div style={styles.inputAddGroup}>
                <select 
                  style={{ ...styles.select, flex: 1 }}
                  value={form.payment_mode}
                  onChange={e => setForm({ ...form, payment_mode: e.target.value })}
                  required
                  disabled={isLocked}
                >
                  <option value="">-- Choose Mode --</option>
                  {paymentModes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
                <button type="button" style={styles.iconBtn} onClick={() => setShowPaymentModal(true)} title="Add Payment Mode" disabled={isLocked}>+</button>
              </div>
            </div>
            <div style={styles.formGroup}>
              {/* Dummy spacing */}
            </div>
          </div>

          {/* Section: Admin Audit Only */}
          {role === "admin" && (
            <div style={{ background: "#fdfdfa", border: "1px solid #ede9df", padding: "24px", borderRadius: "12px", marginTop: "40px" }}>
              <div style={{ ...styles.sectionTitle, marginTop: 0 }}>Financial Review (Admin Only)</div>
              
              <div style={{ ...styles.grid2Col, marginBottom: "20px" }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Cost Price (per MT) *</label>
                  <div style={styles.inputAddGroup}>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="Cost Price per MT"
                      style={{ ...styles.input, flex: 1 }}
                      value={form.cost_price}
                      onChange={e => setForm({ ...form, cost_price: e.target.value })}
                      required
                      disabled={isLocked}
                    />
                    <select 
                      style={styles.select}
                      value={form.cost_currency}
                      onChange={e => setForm({ ...form, cost_currency: e.target.value })}
                      required
                      disabled={isLocked}
                    >
                      {currencies.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
                    </select>
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Margin per MT (Auto Calculated)</label>
                  <input 
                    type="text"
                    style={{ ...styles.input, ...styles.inputReadonly }}
                    value={`${form.selling_currency} ${margin}`}
                    readOnly
                  />
                </div>
              </div>

              <div style={{ ...styles.grid2Col, marginBottom: "20px" }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>IMPFA Number *</label>
                  <input 
                    placeholder="IMPFA Number"
                    style={styles.input}
                    value={form.impfa_no}
                    onChange={e => setForm({ ...form, impfa_no: e.target.value })}
                    required
                    disabled={isLocked}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Review Status</label>
                  <select 
                    style={styles.select}
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    required
                    disabled={isLocked}
                  >
                    <option value="Pending Financial Review">Pending Financial Review</option>
                    <option value="Completed">Completed</option>
                    <option value="Draft">Draft</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Commission Mandates */}
              <div style={{ marginTop: "24px" }}>
                <label style={{ ...styles.label, display: "block", marginBottom: "8px" }}>Commission Mandates</label>
                
                <table style={styles.mandateTable}>
                  <thead>
                    <tr>
                      <th style={styles.mandateTh}>Name</th>
                      <th style={styles.mandateTh}>Phone</th>
                      <th style={styles.mandateTh}>Amount ({form.selling_currency})</th>
                      <th style={{ ...styles.mandateTh, width: "50px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.mandates.map((m, idx) => (
                      <tr key={idx}>
                        <td style={styles.mandateTd}>
                          <input 
                            placeholder="Mandate Name"
                            style={{ ...styles.input, width: "100%", padding: "8px" }}
                            value={m.name}
                            onChange={e => handleMandateChange(idx, "name", e.target.value)}
                            required
                            disabled={isLocked}
                          />
                        </td>
                        <td style={styles.mandateTd}>
                          <input 
                            placeholder="Phone Number"
                            style={{ ...styles.input, width: "100%", padding: "8px" }}
                            value={m.phone}
                            onChange={e => handleMandateChange(idx, "phone", e.target.value)}
                            required
                            disabled={isLocked}
                          />
                        </td>
                        <td style={styles.mandateTd}>
                          <input 
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            style={{ ...styles.input, width: "100%", padding: "8px" }}
                            value={m.amount}
                            onChange={e => handleMandateChange(idx, "amount", e.target.value)}
                            required
                            disabled={isLocked}
                          />
                        </td>
                        <td style={{ ...styles.mandateTd, textAlign: "center" }}>
                          <button 
                            type="button" 
                            style={{ background: "none", border: "none", color: "red", cursor: "pointer", fontSize: "16px" }}
                            onClick={() => removeMandateRow(idx)}
                            disabled={isLocked}
                          >
                            ✖
                          </button>
                        </td>
                      </tr>
                    ))}
                    {form.mandates.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ ...styles.mandateTd, textAlign: "center", color: "#aaa", fontSize: "12px", padding: "15px" }}>
                          No mandates added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <button type="button" style={styles.addMandateBtn} onClick={addMandateRow} disabled={isLocked}>
                  + Add Mandate
                </button>
              </div>

              {/* Aggregated Totals */}
              <div style={{ ...styles.grid2Col, marginTop: "30px", borderTop: "1px solid #ede9df", paddingTop: "20px" }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Total Commission</label>
                  <input 
                    type="text"
                    style={{ ...styles.input, ...styles.inputReadonly }}
                    value={`${form.selling_currency} ${totalCommission}`}
                    readOnly
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Net Profit (Auto Calculated)</label>
                  <input 
                    type="text"
                    style={{ ...styles.input, ...styles.inputReadonly, color: Number(netProfit) >= 0 ? "green" : "red" }}
                    value={`${form.selling_currency} ${netProfit}`}
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {isLocked ? (
            role === "admin" ? (
              <button 
                type="button" 
                onClick={handleReopen} 
                style={{ ...styles.saveBtn, background: "#c9a96e", color: "#0e2318" }}
              >
                Reopen Transaction (Unlock Form)
              </button>
            ) : (
              <button 
                type="button" 
                style={{ ...styles.saveBtn, background: "#888", color: "#ccc", cursor: "not-allowed" }}
                disabled
              >
                Transaction Locked (Completed)
              </button>
            )
          ) : (
            <button 
              type="submit" 
              style={styles.saveBtn}
              disabled={productsEmpty}
            >
              {editingTxId ? "Submit Financial Audit" : "Save Account Entry"}
            </button>
          )}
        </form>

        {/* Currency Modal */}
        {showCurrencyModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
              <div style={styles.modalHeader}>
                <div style={styles.modalTitle}>+ Add Currency</div>
                <button style={styles.modalClose} onClick={() => setShowCurrencyModal(false)}>✖</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Currency Code (e.g. USD)</label>
                  <input 
                    placeholder="Code"
                    style={styles.input}
                    value={newCurrency.code}
                    onChange={e => setNewCurrency({ ...newCurrency, code: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Currency Name (e.g. Dollar)</label>
                  <input 
                    placeholder="Name"
                    style={styles.input}
                    value={newCurrency.name}
                    onChange={e => setNewCurrency({ ...newCurrency, name: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Symbol (e.g. $)</label>
                  <input 
                    placeholder="Symbol"
                    style={styles.input}
                    value={newCurrency.symbol}
                    onChange={e => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                  />
                </div>
                {currencyError && <span style={{ color: "red", fontSize: "12px" }}>{currencyError}</span>}
                <button style={{ ...styles.cardBtn, marginTop: "10px" }} onClick={handleAddCurrency}>Add Currency</button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Mode Modal */}
        {showPaymentModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
              <div style={styles.modalHeader}>
                <div style={styles.modalTitle}>+ Add Payment Mode</div>
                <button style={styles.modalClose} onClick={() => setShowPaymentModal(false)}>✖</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Payment Mode Name (e.g. SBLC MT760)</label>
                  <input 
                    placeholder="Name"
                    style={styles.input}
                    value={newPaymentMode}
                    onChange={e => setNewPaymentMode(e.target.value)}
                  />
                </div>
                {paymentError && <span style={{ color: "red", fontSize: "12px" }}>{paymentError}</span>}
                <button style={{ ...styles.cardBtn, marginTop: "10px" }} onClick={handleAddPaymentMode}>Add Mode</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  //  3. GRID TABLE VIEW (Admin Only)
  // ===========================================================================
  if (view === "view" && role === "admin") {
    return (
      <div style={{ padding: "30px 20px", fontFamily: '"DM Sans", sans-serif' }}>
        <button
          onClick={() => setView("landing")}
          style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            background: "#0e2318", color: "#c9a96e",
            border: "none", borderRadius: "8px",
            padding: "8px 16px", fontWeight: 700, fontSize: "13px",
            cursor: "pointer", marginBottom: "24px",
            letterSpacing: "0.3px"
          }}
        >
          <FiArrowLeft size={14} /> Back to Accounts
        </button>

        <div style={styles.gridHeader}>
          <div>
            <h1 style={styles.title}>Financial Ledger</h1>
            <p style={styles.subtitle}>{filteredTransactions.length} transaction records found.</p>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filterBar}>
          <div style={styles.formGroup}>
            <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 5 }}>
              <FiSearch /> Search
            </label>
            <input 
              placeholder="Search buyer, seller, product..."
              style={{ ...styles.input, padding: "8px 10px" }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 5 }}>
              <FiFilter /> Company
            </label>
            <select 
              style={{ ...styles.select, padding: "8px 10px" }}
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
            >
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 5 }}>
              <FiFilter /> Payment
            </label>
            <select 
              style={{ ...styles.select, padding: "8px 10px" }}
              value={filterPaymentMode}
              onChange={e => setFilterPaymentMode(e.target.value)}
            >
              <option value="">All Modes</option>
              {paymentModes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 5 }}>
              <FiCalendar /> Start Date
            </label>
            <input 
              type="date"
              style={{ ...styles.input, padding: "8px 10px" }}
              value={filterStartDate}
              onChange={e => setFilterStartDate(e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 5 }}>
              <FiCalendar /> End Date
            </label>
            <input 
              type="date"
              style={{ ...styles.input, padding: "8px 10px" }}
              value={filterEndDate}
              onChange={e => setFilterEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div style={styles.tableWrap}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>Loading financial data...</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Tx No</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Buyer</th>
                  <th style={styles.th}>Seller</th>
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>Supplier Company</th>
                  <th style={styles.th}>Qty (MT)</th>
                  <th style={styles.th}>Selling Price</th>
                  <th style={styles.th}>Cost Price</th>
                  <th style={styles.th}>Margin</th>
                  <th style={styles.th}>Commission</th>
                  <th style={styles.th}>Net Profit</th>
                  <th style={styles.th}>Payment Mode</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#0e2318" }}>{tx.transaction_no}</td>
                    <td style={styles.td}>{renderStatusBadge(tx.status)}</td>
                    <td style={styles.td}>{new Date(tx.transaction_date).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <strong>{tx.buyer_name || "—"}</strong>
                      <div style={{ fontSize: "11px", color: "#888" }}>{tx.buyer_company_name}</div>
                    </td>
                    <td style={styles.td}>{tx.seller_name || "—"}</td>
                    <td style={styles.td}>{tx.product_name || "—"}</td>
                    <td style={styles.td}>{tx.supplier_company_name || "—"}</td>
                    <td style={styles.td}>{Number(tx.quantity_mt).toLocaleString()}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{tx.selling_currency} {Number(tx.selling_price).toFixed(2)}</td>
                    <td style={styles.td}>{tx.cost_price ? `${tx.cost_currency} ${Number(tx.cost_price).toFixed(2)}` : "—"}</td>
                    <td style={styles.td}>{tx.margin ? `${tx.selling_currency} ${Number(tx.margin).toFixed(2)}` : "—"}</td>
                    <td style={styles.td}>{tx.commission_total ? `${tx.selling_currency} ${Number(tx.commission_total).toFixed(2)}` : "—"}</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: Number(tx.net_profit) >= 0 ? "green" : "red" }}>
                      {tx.net_profit ? `${tx.selling_currency} ${Number(tx.net_profit).toFixed(2)}` : "—"}
                    </td>
                    <td style={styles.td}>{tx.payment_mode}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button 
                          style={{ background: "none", border: "none", color: "#c9a96e", cursor: "pointer" }}
                          onClick={() => handleEditClick(tx)}
                          title="Review / Edit"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        {tx.status !== "Cancelled" && (
                          <button 
                            style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer" }}
                            onClick={() => handleCancelClick(tx.id)}
                            title="Cancel Transaction"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={15} style={{ ...styles.td, textAlign: "center", color: "#aaa", padding: "40px" }}>
                      No financial records match filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ===========================================================================
  //  4. BUSINESS INTELLIGENCE DASHBOARD VIEW
  // ===========================================================================
  if (view === "dashboard" && role === "admin") {
    return (
      <div style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <AccountsDashboard 
          username={username}
          onDrilldown={(type, id) => pushView("detail", type, id)}
          onBack={() => setView("landing")}
        />
      </div>
    );
  }

  // ===========================================================================
  //  5. DETAIL DRILLDOWN VIEW
  // ===========================================================================
  if (view === "detail" && role === "admin") {
    return (
      <div style={{ fontFamily: '"DM Sans", sans-serif' }}>
        {detailType === "buyer" && (
          <BuyerDashboard 
            buyerId={detailId} 
            onBack={popView} 
            onDrilldown={(type, id) => pushView("detail", type, id)}
          />
        )}
        {detailType === "seller" && (
          <SellerDashboard 
            sellerId={detailId} 
            onBack={popView} 
            onDrilldown={(type, id) => pushView("detail", type, id)}
          />
        )}
        {detailType === "product" && (
          <ProductDashboard 
            productId={detailId} 
            onBack={popView} 
            onDrilldown={(type, id) => pushView("detail", type, id)}
          />
        )}
        {detailType === "company" && (
          <CompanyDashboard 
            companyId={detailId} 
            onBack={popView} 
            onDrilldown={(type, id) => pushView("detail", type, id)}
          />
        )}
        {detailType === "port" && (
          <PortDashboard 
            portName={detailId} 
            onBack={popView} 
            onDrilldown={(type, id) => pushView("detail", type, id)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", color: "red" }}>
      <h2>Access Denied</h2>
      <p>Only Admins and Managers have access to the Accounts module.</p>
    </div>
  );
}
