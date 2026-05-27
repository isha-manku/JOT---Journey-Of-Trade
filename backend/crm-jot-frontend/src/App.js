import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation
} from "react-router-dom";

import Buyers from "./pages/Buyers";
import Sellers from "./pages/Sellers";
import Companies from "./pages/Companies";
import GenerateDoc from "./pages/GenerateDoc";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import Inquiries from "./pages/Inquiries";
import CalendarPage from "./pages/CalendarPage";

import "./App.css";

function Layout() {

  const location = useLocation();

  // HIDE SIDEBAR ON LOGIN PAGE
  const hideSidebar = location.pathname === "/";

  return (

    <div className="layout">

      {/* SIDEBAR */}
      {!hideSidebar && (

        <div className="sidebar">

          {/* LOGO */}
          <div className="logo-area">

            <img
              src="/jot.png"
              alt="logo"
              className="sidebar-logo"
            />

         
          </div>

          {/* NAVIGATION */}
          <Link to="/dashboard">
            Dashboard
          </Link>
             {/* NEW CALENDAR PAGE */}
          <Link to="/calendar">
            Calendar
          </Link>

          <Link to="/inquiries">
            Inquiries
          </Link>

          <Link to="/buyers">
            Buyers
          </Link>

          <Link to="/sellers">
            Sellers
          </Link>

        

          <Link to="/generate">
            Generate Doc
          </Link>

       

          {/* LOGOUT */}
          <button
            className="logout-btn"
            onClick={() => {

              sessionStorage.removeItem("loggedIn");

              localStorage.removeItem("role");

              localStorage.removeItem("username");

              window.location.href = "/";

            }}
          >
            Logout
          </button>

        </div>

      )}

      {/* MAIN CONTENT */}
      <div className="main">

        <Routes>

          {/* LOGIN */}
          <Route
            path="/"
            element={<Login />}
          />

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* INQUIRIES */}
          <Route
            path="/inquiries"
            element={
              <ProtectedRoute>
                <Inquiries />
              </ProtectedRoute>
            }
          />

          {/* BUYERS */}
          <Route
            path="/buyers"
            element={
              <ProtectedRoute>
                <Buyers />
              </ProtectedRoute>
            }
          />

          {/* SELLERS */}
          <Route
            path="/sellers"
            element={
              <ProtectedRoute>
                <Sellers />
              </ProtectedRoute>
            }
          />

          {/* COMPANIES */}
          <Route
            path="/companies"
            element={
              <ProtectedRoute>
                <Companies />
              </ProtectedRoute>
            }
          />

          {/* GENERATE DOC */}
          <Route
            path="/generate"
            element={
              <ProtectedRoute>
                <GenerateDoc />
              </ProtectedRoute>
            }
          />

          {/* CALENDAR */}
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />

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