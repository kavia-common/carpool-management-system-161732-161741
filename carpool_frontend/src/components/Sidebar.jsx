import React from "react";
import { NavLink } from "react-router-dom";
import "./layout.css";
import { useAuth } from "../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * Sidebar: left navigation with primary sections
 */
export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  return (
    <aside className="sidebar">
      <nav className="nav">
        <NavLink className="nav__link" to="/dashboard">Dashboard</NavLink>
        <NavLink className="nav__link" to="/rides">Rides</NavLink>
        <NavLink className="nav__link" to="/calendar">Calendar</NavLink>
        <NavLink className="nav__link" to="/users">Users</NavLink>
        {isAdmin ? <NavLink className="nav__link" to="/admin">Admin</NavLink> : null}
      </nav>
    </aside>
  );
}
