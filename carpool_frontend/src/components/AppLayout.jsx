import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "./layout.css";

/**
 * PUBLIC_INTERFACE
 * AppLayout: responsive shell used by authenticated pages
 * Renders a top Navbar, a left Sidebar, and the main content area with a footer.
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
