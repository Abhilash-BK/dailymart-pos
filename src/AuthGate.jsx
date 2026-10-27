
import { useState } from "react";
import { ShoppingBasket, Eye, EyeOff, LockKeyhole } from "lucide-react";
import App from "./App";
import "./AuthGate.css";

export default function AuthGate() {
  const [token, setToken] = useState(
    () => localStorage.getItem("dailymart-token") || ""
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      localStorage.setItem("dailymart-token", data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("dailymart-token");
    setToken("");
    setPassword("");
  }

  if (token) {
    return <App onLogout={logout} />;
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="login-logo">
          <ShoppingBasket size={28} />
        </div>

        <h1>DailyMart</h1>
        <p className="login-subtitle">Sign in to manage your store</p>

        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          autoComplete="username"
          required
        />

        <label htmlFor="login-password">Password</label>
        <div className="password-field">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && <p className="login-error" role="alert">{error}</p>}

        <button className="login-submit" type="submit" disabled={loading}>
          <LockKeyhole size={17} />
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="login-footer">Authorized administrator access only</p>
      </form>
    </main>
  );
}
