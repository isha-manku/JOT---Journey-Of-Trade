import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");

  // 👁 SHOW/HIDE STATES
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const handleLogin = () => {

    if (
      username === "admin" &&
      password === "12345" &&
      secretKey === "crm2026"
    ) {

      // ✅ LOGIN SESSION
    sessionStorage.setItem("loggedIn", "true");

navigate("/dashboard", { replace: true });

      // CLEAR FIELDS
      setUsername("");
      setPassword("");
      setSecretKey("");

      // ✅ REPLACE LOGIN HISTORY
      navigate("/dashboard", { replace: true });

    } else {
      alert("Invalid Credentials ❌");
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <img
          src="/jot.png"
          alt="logo"
          className="login-logo"
        />

        

      

        <form autoComplete="off">

          <input
            type="text"
            placeholder="Username"
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* PASSWORD */}
          <div className="password-box">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>

          </div>

          {/* SECRET KEY */}
          <div className="password-box">

            <input
              type={showSecret ? "text" : "password"}
              placeholder="Security Key"
              autoComplete="new-password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />

            <span
              className="eye-icon"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? "🙈" : "👁"}
            </span>

          </div>

        </form>

        <button onClick={handleLogin}>
          Login Securely
        </button>

      </div>

    </div>
  );
}

export default Login;