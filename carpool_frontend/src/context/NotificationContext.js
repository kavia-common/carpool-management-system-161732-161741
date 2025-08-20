import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * Notification object interface
 * @typedef {Object} Toast
 * @property {string} id - unique id
 * @property {"success"|"info"|"warning"|"error"} variant
 * @property {string} message
 * @property {number} timeout - ms
 */

/**
 * PUBLIC_INTERFACE
 * NotificationContext: provides addToast and removeToast
 */
export const NotificationContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 * NotificationProvider: wrap app to enable toast notifications
 */
export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, options = {}) => {
    const id = `${Date.now()}-${idRef.current++}`;
    const variant = options.variant || "info";
    const timeout = typeof options.timeout === "number" ? options.timeout : 3500;
    const toast = { id, message, variant, timeout };
    setToasts((prev) => [...prev, toast]);

    if (timeout > 0) {
      window.setTimeout(() => removeToast(id), timeout);
    }

    return id;
  }, [removeToast]);

  const value = useMemo(() => ({ addToast, removeToast, toasts }), [addToast, removeToast, toasts]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * PUBLIC_INTERFACE
 * useNotifications: access addToast/removeToast
 */
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
