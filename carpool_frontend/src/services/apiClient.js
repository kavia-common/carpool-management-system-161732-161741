//
// Lightweight API client for the carpool backend.
//
// Uses fetch under the hood to avoid extra dependencies. Automatically injects
// Authorization header when a token exists in localStorage.
//

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

/**
 * Internal helper to build headers with optional auth token.
 */
function buildHeaders(extra = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...extra,
  };
  const token = localStorage.getItem("access_token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Wrap fetch with JSON handling and error normalization.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
async function request(url, options = {}) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: buildHeaders(options.headers || {}),
  });
  const contentType = res.headers.get("content-type") || "";
  const isJSON = contentType.includes("application/json");

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    if (isJSON) {
      try {
        const data = await res.json();
        message = data?.detail || data?.message || message;
      } catch {
        // ignore parse errors
      }
    } else {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        // ignore
      }
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  if (isJSON) return res.json();
  return res.text();
}

// PUBLIC_INTERFACE
export const api = {
  /** Auth endpoints */
  // PUBLIC_INTERFACE
  login: async (email, password) => {
    /** Authenticate a user and return token payload */
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  // PUBLIC_INTERFACE
  me: async () => {
    /** Get current user profile from /auth/me */
    return request("/auth/me", { method: "GET" });
  },

  /** Users endpoints */
  // PUBLIC_INTERFACE
  createUser: async (payload) => {
    /** Create a new user */
    return request("/users", { method: "POST", body: JSON.stringify(payload) });
  },
  // PUBLIC_INTERFACE
  listUsers: async () => request("/users", { method: "GET" }),

  /** Rides endpoints */
  // PUBLIC_INTERFACE
  getRidesMeta: async () => request("/rides/meta", { method: "GET" }),
  // PUBLIC_INTERFACE
  listRideOffers: async () => request("/rides/offers", { method: "GET" }),
  // PUBLIC_INTERFACE
  listRideRequests: async () => request("/rides/requests", { method: "GET" }),
  // PUBLIC_INTERFACE
  createRideOffer: async (payload) =>
    request("/rides/offers", { method: "POST", body: JSON.stringify(payload) }),
  // PUBLIC_INTERFACE
  createRideRequest: async (payload) =>
    request("/rides/requests", { method: "POST", body: JSON.stringify(payload) }),
  // PUBLIC_INTERFACE
  confirmRideRequest: async (requestId, offerId) =>
    request(`/rides/requests/${encodeURIComponent(requestId)}/confirm?offer_id=${encodeURIComponent(offerId)}`, {
      method: "POST",
    }),
  // PUBLIC_INTERFACE
  cancelRideRequest: async (requestId) =>
    request(`/rides/requests/${encodeURIComponent(requestId)}/cancel`, { method: "POST" }),
  // PUBLIC_INTERFACE
  cancelRideOffer: async (offerId) =>
    request(`/rides/offers/${encodeURIComponent(offerId)}/cancel`, { method: "POST" }),

  /** Calendar endpoints */
  // PUBLIC_INTERFACE
  getEvents: async (days = 7, userId) => {
    const params = new URLSearchParams();
    if (days) params.set("days", String(days));
    if (userId) params.set("user_id", String(userId));
    return request(`/calendar/events?${params.toString()}`, { method: "GET" });
  },
  // PUBLIC_INTERFACE
  syncCalendar: async (userId, source) => {
    /** Connect/sync a calendar source (URL or ICS text) for a user */
    return request(`/calendar/sync`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, source }),
    });
  },
};

// PUBLIC_INTERFACE
export function formatDateRange(startISO, endISO) {
  /** Utility to format start/end into a friendly string */
  try {
    const start = startISO ? new Date(startISO) : null;
    const end = endISO ? new Date(endISO) : null;
    if (!start && !end) return "";
    if (start && !end) return `${start.toLocaleString()}`;
    if (!start && end) return `${end.toLocaleString()}`;
    const sameDay =
      start.toDateString && end.toDateString && start.toDateString() === end.toDateString();
    if (sameDay) {
      return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return `${start.toLocaleString()} - ${end.toLocaleString()}`;
  } catch {
    return `${startISO || ""}${endISO ? ` - ${endISO}` : ""}`;
  }
}

export default api;
```

Explanation: Create authentication context to store token/user, expose login/logout, and guard routes.
````write file="carpool-management-system-161732-161741/carpool_frontend/src/context/AuthContext.js"
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/apiClient";

// PUBLIC_INTERFACE
export const AuthContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 * AuthProvider: provides authentication state and actions to children.
 */
export function AuthProvider({ children }) {
  /** This provider holds:
   * - access_token: persisted in localStorage
   * - user: fetched from /auth/me
   * - login(email, password), logout()
   */
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMe() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const me = await api.me();
        setUser(me);
      } catch (e) {
        // invalid token or backend error
        localStorage.removeItem("access_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, [token]);

  // PUBLIC_INTERFACE
  const login = async (email, password) => {
    setError(null);
    const res = await api.login(email, password);
    const accessToken = res?.access_token;
    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
      setToken(accessToken);
      // fetch user after login
      const me = await api.me();
      setUser(me);
    } else {
      throw new Error("Invalid login response");
    }
  };

  // PUBLIC_INTERFACE
  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({ token, user, loading, error, login, logout }),
    [token, user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * PUBLIC_INTERFACE
 * useAuth: access auth context
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
```

Explanation: Create reusable protected route wrapper.
````write file="carpool-management-system-161732-161741/carpool_frontend/src/components/ProtectedRoute.jsx"
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * ProtectedRoute: guards child routes based on auth.
 */
export default function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

Explanation: Create layout components: Navbar, Sidebar, and AppLayout scaffolding.
````write file="carpool-management-system-161732-161741/carpool_frontend/src/components/Navbar.jsx"
import React from "react";
import { useAuth } from "../context/AuthContext";
import "./layout.css";

/**
 * PUBLIC_INTERFACE
 * Navbar: top navigation bar with app title and user menu
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="brand__logo">🚗</span>
        <span className="brand__title">Carpool Manager</span>
      </div>
      <div className="navbar__actions">
        {user ? (
          <>
            <span className="navbar__user">{user.full_name}</span>
            <button className="btn btn--small" onClick={logout} aria-label="Sign out">
              Sign out
            </button>
          </>
        ) : (
          <span className="navbar__user">Guest</span>
        )}
      </div>
    </header>
  );
}
```

Explanation: Sidebar component for navigation.
````write file="carpool-management-system-161732-161741/carpool_frontend/src/components/Sidebar.jsx"
import React from "react";
import { NavLink } from "react-router-dom";
import "./layout.css";

/**
 * PUBLIC_INTERFACE
 * Sidebar: left navigation with primary sections
 */
export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="nav">
        <NavLink className="nav__link" to="/dashboard">Dashboard</NavLink>
        <NavLink className="nav__link" to="/rides">Rides</NavLink>
        <NavLink className="nav__link" to="/calendar">Calendar</NavLink>
        <NavLink className="nav__link" to="/users">Users</NavLink>
      </nav>
    </aside>
  );
}
```

Explanation: AppLayout combines Navbar, Sidebar, and main content area.
````write file="carpool-management-system-161732-161741/carpool_frontend/src/components/AppLayout.jsx"
import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "./layout.css";

/**
 * PUBLIC_INTERFACE
 * AppLayout: responsive shell used by authenticated pages
 */
export default function AppLayout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <div className="layout__body">
        <Sidebar />
        <main className="layout__content">{children}</main>
      </div>
      <footer className="layout__footer">
        <a href="#help">Help</a>
        <span>·</span>
        <a href="#privacy">Privacy</a>
      </footer>
    </div>
  );
}
```

Explanation: Add layout styles (minimal, responsive).
````write file="carpool-management-system-161732-161741/carpool_frontend/src/components/layout.css"
:root{
  --primary: #1976d2;
  --secondary: #66bb6a;
  --accent: #ffa726;
  --bg: #ffffff;
  --bg-2: #f6f7f9;
  --text: #1f2937;
  --muted: #6b7280;
  --border: #e5e7eb;
}

* { box-sizing: border-box; }

html, body, #root { height: 100%; }

body {
  margin: 0;
  color: var(--text);
  background: var(--bg);
}

a { color: var(--primary); text-decoration: none; }
a.active { font-weight: 600; }

.btn {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
}
.btn--small { padding: 6px 10px; }

.navbar {
  height: 56px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 10;
}
.brand__logo { margin-right: 8px; }
.brand__title { font-weight: 700; }

.navbar__actions { display: flex; gap: 12px; align-items: center; }
.navbar__user { color: var(--muted); }

.layout__body {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: calc(100vh - 56px - 44px);
}

.sidebar {
  border-right: 1px solid var(--border);
  background: var(--bg-2);
  padding: 16px;
}

.nav { display: flex; flex-direction: column; gap: 10px; }
.nav__link {
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--text);
}
.nav__link.active {
  background: rgba(25, 118, 210, 0.1);
  color: var(--primary);
}

.layout__content {
  padding: 20px;
  min-width: 0;
}

.layout__footer {
  height: 44px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  color: var(--muted);
}

@media (max-width: 900px) {
  .layout__body {
    grid-template-columns: 1fr;
  }
  .sidebar {
    display: none;
  }
}
```

Explanation: Add pages for Login, Dashboard, Rides, Calendar, Users, and NotFound.
````write file="carpool-management-system-161732-161741/carpool_frontend/src/pages/Login.jsx"
import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../components/layout.css";

/**
 * PUBLIC_INTERFACE
 * Login page: handles email/password login
 */
export default function Login() {
  const { token, login } = useAuth();
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
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
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
        Use any credentials accepted by backend sample. This UI expects /auth/login to return access_token.
      </p>
    </div>
  );
}
```

Explanation: Dashboard page stub with quick links.
````write file="carpool-management-system-161732-161741/carpool_frontend/src/pages/Dashboard.jsx"
import React from "react";
import AppLayout from "../components/AppLayout";

/**
 * PUBLIC_INTERFACE
 * Dashboard page: entry for authenticated users
 */
export default function Dashboard() {
  return (
    <AppLayout>
      <h2>Dashboard</h2>
      <p>Welcome to Carpool Manager. Use the sidebar to navigate.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 12 }}>
        <Card title="Rides" description="Create offers and requests, manage confirmations." />
        <Card title="Calendar" description="View upcoming events and carpool activities." />
        <Card title="Users" description="Manage users and roles (admin only scope in future)." />
      </div>
    </AppLayout>
  );
}

function Card({ title, description }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ color: "#6b7280" }}>{description}</p>
    </div>
  );
}
```

Explanation: Rides page stub pulling metadata to verify API integration.
````write file="carpool-management-system-161732-161741/carpool_frontend/src/pages/Rides.jsx"
import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../services/apiClient";

/**
 * PUBLIC_INTERFACE
 * Rides page: lists offers and requests (sample)
 */
export default function Rides() {
  const [meta, setMeta] = useState(null);
  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [m, o, r] = await Promise.all([
          api.getRidesMeta(),
          api.listRideOffers(),
          api.listRideRequests(),
        ]);
        setMeta(m);
        setOffers(o || []);
        setRequests(r || []);
      } catch (e) {
        // no-op for now
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AppLayout>
      <h2>Rides</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <section style={{ marginBottom: 16 }}>
            <h3>Metadata</h3>
            <pre style={{ background: "#f6f7f9", padding: 12, borderRadius: 8 }}>
              {JSON.stringify(meta, null, 2)}
            </pre>
          </section>

          <section style={{ marginBottom: 16 }}>
            <h3>Offers</h3>
            <pre style={{ background: "#f6f7f9", padding: 12, borderRadius: 8 }}>
              {JSON.stringify(offers, null, 2)}
            </pre>
          </section>

          <section>
            <h3>Requests</h3>
            <pre style={{ background: "#f6f7f9", padding: 12, borderRadius: 8 }}>
              {JSON.stringify(requests, null, 2)}
            </pre>
          </section>
        </>
      )}
    </AppLayout>
  );
}
```

Explanation: Calendar page stub calling backend events.
````write file="carpool-management-system-161732-161741/carpool_frontend/src/pages/Calendar.jsx"
import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../services/apiClient";

/**
 * PUBLIC_INTERFACE
 * Calendar page: lists upcoming events
 */
export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.getEvents(days);
        setEvents(data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  return (
    <AppLayout>
      <h2>Calendar</h2>
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Days ahead:</label>
        <input
          type="number"
          min={1}
          max={30}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{ width: 80 }}
        />
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <pre style={{ background: "#f6f7f9", padding: 12, borderRadius: 8 }}>
          {JSON.stringify(events, null, 2)}
        </pre>
      )}
    </AppLayout>
  );
}
```

Explanation: Users page stub.
````write file="carpool-management-system-161732-161741/carpool_frontend/src/pages/Users.jsx"
import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../services/apiClient";

/**
 * PUBLIC_INTERFACE
 * Users page: list users (admin-oriented in future)
 */
export default function Users() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    api
      .listUsers()
      .then((d) => setUsers(d || []))
      .catch(() => setUsers([]));
  }, []);

  return (
    <AppLayout>
      <h2>Users</h2>
      <pre style={{ background: "#f6f7f9", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(users, null, 2)}
      </pre>
    </AppLayout>
  );
}
```

Explanation: NotFound page.
````write file="carpool-management-system-161732-161741/carpool_frontend/src/pages/NotFound.jsx"
import React from "react";

/**
 * PUBLIC_INTERFACE
 * NotFound page
 */
export default function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2>404 - Not Found</h2>
      <p>The page you requested does not exist.</p>
    </div>
  );
}
```

Explanation: Replace App.js to be router-centric and include theme toggle retained from template.
````edit file="carpool-management-system-161732-161741/carpool_frontend/src/App.js"
<<<<<<< SEARCH
import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="App">
      <header className="App-header">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <p>
          Current theme: <strong>{theme}</strong>
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
=======
import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Rides from "./pages/Rides";
import Calendar from "./pages/Calendar";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";

// PUBLIC_INTERFACE
function App() {
  // Keep the original theme toggle from template
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <div className="App">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>

      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/rides" element={<Rides />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/users" element={<Users />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
>>>>>>> REPLACE
