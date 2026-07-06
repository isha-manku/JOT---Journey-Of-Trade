import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation
} from "react-router-dom";

import { FiGrid, FiCalendar, FiMessageSquare, FiShoppingBag, FiUsers, FiDollarSign, FiBriefcase, FiFileText, FiBarChart2, FiPackage, FiMessageCircle, FiSettings, FiX, FiCheckCircle, FiLogOut } from "react-icons/fi";
import { useEffect, useState, useRef } from "react";

import Buyers         from "./pages/Buyers";
import BuyersRecycleBin from "./pages/BuyersRecycleBin";
import Sellers        from "./pages/Sellers";
import SellerRecycleBin from "./pages/SellerRecycleBin";
import Companies      from "./pages/Companies";
import GenerateDoc    from "./pages/GenerateDoc";
import Dashboard      from "./pages/Dashboard";
import Login          from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import BuyerDocs      from "./pages/BuyerDocs";
import SellerDocs     from "./pages/SellerDocs";
import Inquiries      from "./pages/Inquiries";
import InquiriesRecycleBin from "./pages/InquiriesRecycleBin";
import CalendarPage   from "./pages/CalendarPage";
import Analytics      from "./pages/Analytics";
import ProductAnalytics from "./pages/ProductAnalytics";
import Settings       from "./pages/Settings";
import Messages       from "./pages/Messages";

import SellerInquiries from "./pages/SellerInquiries";
import SellerInquiriesRecycleBin from "./pages/SellerInquiriesRecycleBin";
import Accounts        from "./pages/Accounts";
import "./App.css";


const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: FiGrid,          roles: ["admin","manager","member"] },
  { to: "/calendar",  label: "Calendar",  icon: FiCalendar,      roles: ["admin","manager","member"] },
  { to: "/inquiries", label: "Inquiries", icon: FiMessageSquare, roles: ["admin","manager","member"] },
  { to: "/seller-inquiries", label: "Seller Inquiries", icon: FiShoppingBag, roles: ["admin","manager","member"] },
  { to: "/buyers",    label: "Buyers",    icon: FiUsers,         roles: ["admin","manager","member"] },
  { to: "/sellers",   label: "Sellers",   icon: FiShoppingBag,  roles: ["admin","manager","member"] },
  { to: "/accounts",  label: "Accounts",  icon: FiDollarSign,   roles: ["admin","manager"] },
  { to: "/companies", label: "Companies", icon: FiBriefcase,    roles: ["admin","manager"] },
  { to: "/generate",  label: "Documents", icon: FiFileText,     roles: ["admin","manager","member"] },
  { to: "/analytics", label: "Analytics", icon: FiBarChart2,    roles: ["admin","manager","member"] },
  { to: "/product-analytics", label: "Products", icon: FiPackage, roles: ["admin","manager","member"] },
  { to: "/messages",  label: "Messages",  icon: FiMessageCircle,roles: ["admin","manager","member"] },
  { to: "/settings",  label: "Settings",  icon: FiSettings,     roles: ["admin", "manager", "member"] },
];

// ── Key stored in localStorage to track last-read message id ─────────────────
const LAST_READ_KEY = "msg_last_read_id";

function Layout() {
  const location = useLocation();
  const hideSidebar = location.pathname === "/";

  const fullName = localStorage.getItem("username") || "User";
  const role     = localStorage.getItem("role")     || "member";
  const myId     = parseInt(localStorage.getItem("userId") || "0");

    const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel =
    role === "admin" ? "Administrator" :
    role === "manager" ? "Manager" : "Member";

  // ── Unread message count ────────────────────────────────────────────────────
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!myId) return;
    checkUnread();
    const interval = setInterval(checkUnread, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

    // When user navigates TO /messages, mark all as read
    // Removed because read status is now tracked per conversation in Messages.js

  const checkUnread = () => {
    if (!myId) return;

    fetch(`http://localhost:5000/messages/unread?userId=${myId}`)
      .then(r => r.json())
      .then(data => {
        setUnread(data.total || 0);
        // Also dispatch an event so other components can pick up the data
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdate', { detail: data }));
      })
      .catch(() => {});
  };

    const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem(LAST_READ_KEY);
    window.location.href = "/";
  };

    useEffect(() => {
    const handleMessage = (event) => {
      // Allow messages from DocPlatform iframe
      if (event.data?.action === "navigate") {
        if (event.data.forceLogout) {
          handleLogout();
        } else if (event.data.to) {
          window.location.href = event.data.to;
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="layout">

      {!hideSidebar && (
        <div className="sidebar">
          <div className="logo-area">
            <img src="/jot copy.png" alt="JOT logo" className="sidebar-logo" />
          </div>

          <nav>
            {visibleNav.map(({ to, label, icon: Icon }) => {
              const isActive =
                location.pathname === to ||
                (to !== "/dashboard" && location.pathname.startsWith(to));

              const isMessages = to === "/messages";

              return (
                <Link key={to} to={to} className={isActive ? "active" : ""}>
                  <Icon size={18} />
                  <span>{label}</span>
                  {/* Unread badge — only on Messages nav item */}
                  {isMessages && unread > 0 && (
                    <span className="nav-unread-badge">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{initials}</div>
              <div className="sidebar-user-info">
                <strong>{fullName}</strong>
                <span>{roleLabel}</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <FiLogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      )}

      <div className="main">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/inquiries"  element={<ProtectedRoute><Inquiries /></ProtectedRoute>} />
          <Route path="/inquiries/recycle-bin" element={<ProtectedRoute><InquiriesRecycleBin /></ProtectedRoute>} />
          <Route path="/seller-inquiries" element={<ProtectedRoute><SellerInquiries /></ProtectedRoute>} />
          <Route path="/seller-inquiries/recycle-bin" element={<ProtectedRoute><SellerInquiriesRecycleBin /></ProtectedRoute>} />
          <Route path="/buyers"     element={<ProtectedRoute><Buyers /></ProtectedRoute>} />
          <Route path="/sellers"    element={<ProtectedRoute><Sellers /></ProtectedRoute>} />
          <Route path="/buyers/recycle-bin" element={<ProtectedRoute><BuyersRecycleBin /></ProtectedRoute>} />
          <Route path="/buyers/:buyerId/documents" element={<ProtectedRoute><BuyerDocs /></ProtectedRoute>} />
          <Route path="/sellers/recycle-bin" element={<ProtectedRoute><SellerRecycleBin /></ProtectedRoute>} />
          <Route path="/sellers/:sellerId/documents" element={<ProtectedRoute><SellerDocs /></ProtectedRoute>} />
          <Route path="/companies"  element={<ProtectedRoute><Companies /></ProtectedRoute>} />
          <Route path="/generate"   element={<ProtectedRoute><GenerateDoc /></ProtectedRoute>} />
          <Route path="/accounts"   element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
          <Route path="/calendar"   element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} /> 
          <Route path="/analytics"  element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/product-analytics" element={<ProtectedRoute><ProductAnalytics /></ProtectedRoute>} />
          <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/messages"   element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        </Routes>
      </div>

    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;