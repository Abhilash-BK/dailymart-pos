
import { useState } from "react";
import {
  ShoppingBasket,
  Eye,
  EyeOff,
  LockKeyhole,
  UserPlus,
  ArrowLeft,
  Mail,
} from "lucide-react";
import App from "./App";
import "./AuthGate.css";

const API = "http://localhost:5000/api/auth";

export default function AuthGate() {
  const [token, setToken] = useState(
    () => localStorage.getItem("dailymart-token") || ""
  );

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function request(endpoint, body) {
    const response = await fetch(`${API}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await request("login", { email, password });

      localStorage.setItem("dailymart-token", data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await request("register", { email });
      setMessage(data.message);
      setMode("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await request("verify-otp", {
        email,
        otp,
        password,
      });

      setMessage(data.message);
      setPassword("");
      setOtp("");
      setMode("pending");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await request("resend-otp", { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    setMode("login");
    setError("");
    setMessage("");
    setPassword("");
    setOtp("");
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
      <form
        className="login-card"
        onSubmit={
          mode === "login"
            ? handleLogin
            : mode === "register"
            ? handleRegister
            : mode === "verify"
            ? handleVerify
            : (e) => e.preventDefault()
        }
      >
        <div className="login-logo">
          <ShoppingBasket size={28} />
        </div>

        <h1>DailyMart</h1>

        {mode === "login" && (
          <>
            <p className="login-subtitle">
              Sign in to manage your store
            </p>

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
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="login-submit" type="submit" disabled={loading}>
              <LockKeyhole size={17} />
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <p className="login-footer">
              Authorized administrator and approved employee access
            </p>

            <button
              type="button"
              className="register-link"
              onClick={() => {
                setMode("register");
                setError("");
                setMessage("");
                setPassword("");
              }}
            >
              <UserPlus size={17} />
              Create Employee Account
            </button>
          </>
        )}

        {mode === "register" && (
          <>
            <p className="login-subtitle">
              Register as a DailyMart employee
            </p>

            <label htmlFor="register-email">Employee email address</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

            {error && <p className="login-error">{error}</p>}

            <button className="login-submit" type="submit" disabled={loading}>
              <Mail size={17} />
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            <button
              type="button"
              className="register-link"
              onClick={goToLogin}
            >
              <ArrowLeft size={16} /> Back to Sign in
            </button>
          </>
        )}

        {mode === "verify" && (
          <>
            <p className="login-subtitle">
              Verify your email and create a password
            </p>

            <p className="login-footer">
              Verification code sent to {email}
            </p>

            <label htmlFor="register-otp">Six-digit OTP</label>
            <input
              id="register-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter OTP"
              required
            />

            <label htmlFor="register-password">Create password</label>
            <div className="password-field">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 12 characters"
                minLength={12}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>

            <button
              type="button"
              className="register-link"
              onClick={handleResendOtp}
              disabled={loading}
            >
              Resend OTP
            </button>
          </>
        )}

        {mode === "pending" && (
          <>
            <p className="login-subtitle">Registration completed</p>

            <div className="registration-status">
              <h3>Waiting for Owner Approval</h3>
              <p>
                Your email has been verified successfully. Your account
                will become active after the owner approves your request.
              </p>
            </div>

            <button
              type="button"
              className="login-submit"
              onClick={goToLogin}
            >
              Back to Sign in
            </button>
          </>
        )}

        {message && mode !== "pending" && (
          <p className="login-success" role="status">{message}</p>
        )}
      </form>
    </main>
  );
}
