import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation
} from "react-router-dom";

import {
  FiGrid,
  FiCalendar,
  FiMessageSquare,
  FiUsers,
  FiShoppingBag,
  FiBriefcase,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

import Buyers      from "./pages/Buyers";
import Sellers     from "./pages/Sellers";
import Companies   from "./pages/Companies";
import GenerateDoc from "./pages/GenerateDoc";
import Dashboard   from "./pages/Dashboard";
import Login       from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import Inquiries   from "./pages/Inquiries";
import CalendarPage from "./pages/CalendarPage";
import Analytics   from "./pages/Analytics";
import Settings from "./pages/Settings";

import "./App.css";

// ── Nav items with role restrictions ─────────────────────────────────────────
// roles: which roles can SEE this nav item
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: FiGrid,         roles: ["admin","manager","member"] },
  { to: "/calendar",  label: "Calendar",  icon: FiCalendar,     roles: ["admin","manager","member"] },
  { to: "/inquiries", label: "Inquiries", icon: FiMessageSquare,roles: ["admin","manager","member"] },
  { to: "/buyers",    label: "Buyers",    icon: FiUsers,         roles: ["admin","manager","member"] },
  { to: "/sellers",   label: "Sellers",   icon: FiShoppingBag,  roles: ["admin","manager","member"] },
  { to: "/companies", label: "Companies", icon: FiBriefcase,    roles: ["admin","manager"] },
  { to: "/generate",  label: "Documents", icon: FiFileText,     roles: ["admin","manager"] },
  { to: "/analytics", label: "Analytics", icon: FiBarChart2,    roles: ["admin","manager"] },
  { to: "/settings",  label: "Settings",  icon: FiSettings,     roles: ["admin"] },
];

function Layout() {
  const location = useLocation();
  const hideSidebar = location.pathname === "/";

  const fullName = localStorage.getItem("username") || "User";
  const role     = localStorage.getItem("role")     || "member";

  // Initials for avatar circle
  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Role display label
  const roleLabel = role === "admin"
    ? "Administrator"
    : role === "manager"
    ? "Manager"
    : "Member";

  const handleLogout = () => {
    sessionStorage.removeItem("loggedIn");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    window.location.href = "/";
  };

  // Filter nav items by current user's role
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="layout">

      {/* ── SIDEBAR ── */}
      {!hideSidebar && (
        <div className="sidebar">

          {/* LOGO */}
          <div className="logo-area">
            <img src="/jot.png" alt="JOT logo" className="sidebar-logo" />
            
          </div>

          {/* NAV — filtered by role */}
          <nav>
            {visibleNav.map(({ to, label, icon: Icon }) => {
              const isActive =
                location.pathname === to ||
                (to !== "/dashboard" && location.pathname.startsWith(to));
              return (
                <Link key={to} to={to} className={isActive ? "active" : ""}>
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* USER + LOGOUT */}
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

      {/* ── MAIN ── */}
      <div className="main">
        <Routes>

          <Route path="/" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/inquiries" element={
            <ProtectedRoute><Inquiries /></ProtectedRoute>
          } />
          <Route path="/buyers" element={
            <ProtectedRoute><Buyers /></ProtectedRoute>
          } />
          <Route path="/sellers" element={
            <ProtectedRoute><Sellers /></ProtectedRoute>
          } />
          <Route path="/companies" element={
            <ProtectedRoute><Companies /></ProtectedRoute>
          } />
          <Route path="/generate" element={
            <ProtectedRoute><GenerateDoc /></ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute><CalendarPage /></ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute><Analytics /></ProtectedRoute>
          } />
        <Route path="/settings" element={
  <ProtectedRoute><Settings /></ProtectedRoute>
} />
 
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