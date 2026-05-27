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

import Buyers from "./pages/Buyers";
import Sellers from "./pages/Sellers";
import Companies from "./pages/Companies";
import GenerateDoc from "./pages/GenerateDoc";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import Inquiries from "./pages/Inquiries";
import CalendarPage from "./pages/CalendarPage";
import Analytics from "./pages/Analytics";

import "./App.css";

// ── nav items config ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: "/dashboard",  label: "Dashboard",  icon: FiGrid        },
  { to: "/calendar",   label: "Calendar",   icon: FiCalendar    },
  { to: "/inquiries",  label: "Inquiries",  icon: FiMessageSquare },
  { to: "/buyers",     label: "Buyers",     icon: FiUsers       },
  { to: "/sellers",    label: "Sellers",    icon: FiShoppingBag },
  { to: "/companies",  label: "Companies",  icon: FiBriefcase   },
  { to: "/generate",   label: "Documents",  icon: FiFileText    },
  { to: "/analytics",  label: "Analytics",  icon: FiBarChart2   },
  { to: "/settings",   label: "Settings",   icon: FiSettings    },
];

function Layout() {
  const location = useLocation();
  const hideSidebar = location.pathname === "/";

  // Get logged-in user info from localStorage
  const username = localStorage.getItem("username") || "User";
  const role     = localStorage.getItem("role")     || "Member";

  // Initials for avatar
  const initials = username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    sessionStorage.removeItem("loggedIn");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    window.location.href = "/";
  };

  return (
    <div className="layout">

      {/* ── SIDEBAR ── */}
      {!hideSidebar && (
        <div className="sidebar">

          {/* LOGO */}
          <div className="logo-area">
            <img src="/jot.png" alt="JOT logo" className="sidebar-logo" />
            <h2>JOT</h2>
            <p>JOURNEY OF TRADE</p>
          </div>

          {/* NAV */}
          <nav>
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to ||
                (to !== "/dashboard" && location.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={isActive ? "active" : ""}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* USER + LOGOUT at bottom */}
          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{initials}</div>
              <div className="sidebar-user-info">
                <strong>{username}</strong>
                <span>{role}</span>
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

          {/* Settings placeholder — replace with your Settings page when ready */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <div style={{ padding: 40, color: "#0e2318" }}>
                <h2>Settings</h2>
                <p style={{ marginTop: 10, color: "#888" }}>Coming soon.</p>
              </div>
            </ProtectedRoute>
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
