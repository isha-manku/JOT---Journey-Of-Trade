import { Navigate } from "react-router-dom";

// Define which roles can access which routes
const ROLE_ACCESS = {
  "/analytics":  ["admin", "manager"],
  "/settings":   ["admin"],
  "/generate":   ["admin", "manager"],
  "/companies":  ["admin", "manager"],
  "/sellers":    ["admin", "manager", "member"],
  "/buyers":     ["admin", "manager", "member"],
  "/inquiries":  ["admin", "manager", "member"],
  "/calendar":   ["admin", "manager", "member"],
  "/dashboard":  ["admin", "manager", "member"],
};

function ProtectedRoute({ children }) {
  const loggedIn = sessionStorage.getItem("loggedIn");
  const role     = localStorage.getItem("role");

  // Not logged in → redirect to login
  if (!loggedIn) {
    return <Navigate to="/" replace />;
  }

  // Check role-based access for current path
  const currentPath = window.location.pathname;
  const allowedRoles = ROLE_ACCESS[currentPath];

  if (allowedRoles && !allowedRoles.includes(role)) {
    // User doesn't have permission — redirect to dashboard
    return (
      <div style={{
        padding: 40,
        textAlign: "center",
        color: "#0e2318",
      }}>
        <h2 style={{ fontSize: 24, marginBottom: 10 }}>🚫 Access Denied</h2>
        <p style={{ color: "#888", marginBottom: 20 }}>
          You don't have permission to view this page.
        </p>
        <a href="/dashboard" style={{
          background: "#0e2318",
          color: "#c9a96e",
          padding: "10px 24px",
          borderRadius: 10,
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 14,
        }}>
          Back to Dashboard
        </a>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
