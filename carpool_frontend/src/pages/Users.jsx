import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../services/apiClient";

/**
 * PUBLIC_INTERFACE
 * Users page: list users (read-only for non-admins)
 */
export default function Users() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .listUsers()
      .then((d) => setUsers(d || []))
      .catch((e) => {
        setUsers([]);
        setErr(e?.message || "Failed to load users");
      });
  }, []);

  return (
    <AppLayout>
      <h2>Users</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {users?.length ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "8px 6px" }}>ID</th>
                <th style={{ padding: "8px 6px" }}>Name</th>
                <th style={{ padding: "8px 6px" }}>Email</th>
                <th style={{ padding: "8px 6px" }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 6px", fontFamily: "monospace", fontSize: 12 }}>{u.id}</td>
                  <td style={{ padding: "8px 6px" }}>{u.full_name}</td>
                  <td style={{ padding: "8px 6px" }}>{u.email}</td>
                  <td style={{ padding: "8px 6px" }}>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: "#6b7280" }}>No users found.</p>
      )}
    </AppLayout>
  );
}
