import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/apiClient";

// PUBLIC_INTERFACE
export const AuthContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 * AuthProvider: provides authentication state and actions to children.
 */
export function AuthProvider({ children }) {
  /**
   * Holds:
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
