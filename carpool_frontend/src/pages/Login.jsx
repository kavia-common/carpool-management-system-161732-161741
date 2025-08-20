import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import "../components/layout.css";

/**
 * PUBLIC_INTERFACE
 * Login page: handles email/password login
 */
export default function Login() {
  const { token, login } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const [email, setEmail] = useState("parent@example.com");
  const [password, setPassword] = useState("password");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      addToast("Signed in successfully", { variant: "success" });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
      addToast(err?.message || "Login failed", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: "60px auto", padding: 24, border: "1px solid #eee", borderRadius: 10 }}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Sign in</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button className="btn" type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p style={{ color: "#6b7280", marginTop: 12 }}>
        This UI expects /auth/login to return access_token and /auth/me to fetch the current user.
      </p>
    </div>
  );
}
