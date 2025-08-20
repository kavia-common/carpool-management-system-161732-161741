import React from "react";
import "./toast.css";
import { useNotifications } from "../context/NotificationContext";

/**
 * PUBLIC_INTERFACE
 * ToastContainer: Renders toasts from NotificationContext
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useNotifications();
  if (!toasts?.length) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const color =
    toast.variant === "success" ? "#16a34a" :
    toast.variant === "warning" ? "#f59e0b" :
    toast.variant === "error" ? "#dc2626" :
    "#2563eb";
  const icon =
    toast.variant === "success" ? "✅" :
    toast.variant === "warning" ? "⚠️" :
    toast.variant === "error" ? "❌" :
    "ℹ️";

  return (
    <div className="toast" role="status" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="toast__icon" aria-hidden="true">{icon}</div>
      <div className="toast__message">{toast.message}</div>
      <button className="toast__close" onClick={onClose} aria-label="Dismiss notification">
        ✕
      </button>
    </div>
  );
}
