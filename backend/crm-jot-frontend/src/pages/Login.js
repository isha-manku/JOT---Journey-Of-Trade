import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // backend returned 401 or 400
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      // ✅ Save user info to localStorage
      sessionStorage.setItem("loggedIn", "true");
      localStorage.setItem("userId",    data.id);
      localStorage.setItem("username",  data.full_name);   // shows in sidebar
      localStorage.setItem("role",      data.role);         // admin | manager | member

      navigate("/dashboard", { replace: true });

    } catch (err) {
      setError("Cannot connect to server. Is the backend running?");
      setLoading(false);
    }
  };

  // Allow Enter key to submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <img src="/jot copy.png" alt="logo" className="login-logo" />
     

        {/* ERROR MESSAGE */}
        {error && (
          <div style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 13,
            marginBottom: 14,
            textAlign: "left",
          }}>
            ❌ {error}
          </div>
        )}

        <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>

          <input
            type="text"
            placeholder="Username"
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="password-box">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

        </form>

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Signing in..." : "Login Securely"}
        </button>

      </div>
    </div>
  );
}

export default Login;
