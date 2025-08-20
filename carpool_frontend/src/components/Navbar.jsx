import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import "./layout.css";

/**
 * PUBLIC_INTERFACE
 * Navbar: top navigation bar with app title and user menu
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const { addToast } = useNotifications();

  const onLogout = () => {
    logout();
    addToast("Signed out", { variant: "info" });
  };

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
            <button className="btn btn--small" onClick={onLogout} aria-label="Sign out">
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
