import React from "react";
import AppLayout from "../components/AppLayout";
import { Link } from "react-router-dom";

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
        <Card to="/rides" title="Rides" description="Create offers and requests, manage confirmations." />
        <Card to="/calendar" title="Calendar" description="View upcoming events and carpool activities." />
        <Card to="/users" title="Users" description="Manage users and roles (admin only scope in future)." />
      </div>
    </AppLayout>
  );
}

function Card({ title, description, to }) {
  const content = (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ color: "#6b7280" }}>{description}</p>
    </div>
  );
  return to ? (
    <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
      {content}
    </Link>
  ) : (
    content
  );
}
