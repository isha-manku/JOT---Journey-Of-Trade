import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {

  const isLoggedIn = sessionStorage.getItem("loggedIn");

  // 🔒 Prevent back button cache access
  window.history.pushState(null, "", window.location.href);

  window.onpopstate = function () {
    if (!sessionStorage.getItem("loggedIn")) {
      window.location.replace("/");
    }
  };

  if (isLoggedIn !== "true") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;  