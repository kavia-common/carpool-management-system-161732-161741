import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * Admin page: view users and rides; update user roles.
 */
export default function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState({ offers: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [u, r] = await Promise.all([api.getAdminUsers(), api.getAdminRides()]);
      setUsers(Array.isArray(u) ? u : []);
      // normalize rides: expect backend to return {offers: [], requests: []} or an array; handle both
      let offers = [];
      let requests = [];
      if (r && typeof r === "object" && (Array.isArray(r.offers) || Array.isArray(r.requests))) {
        offers = r.offers || [];
        requests = r.requests || [];
      } else if (Array.isArray(r)) {
        // if single list, split by presence of seats vs seats_requested
        offers = r.filter((x) => typeof x.seats_available === "number");
        requests = r.filter((x) => typeof x.seats_requested === "number");
      }
      setRides({ offers, requests });
    } catch (e) {
      setErr(e?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    return {
      users: users.length,
      offers: rides.offers.length,
      requests: rides.requests.length,
    };
  }, [users, rides]);

  const onChangeRole = async (u, newRole) => {
    if (!newRole || newRole === u.role) return;
    try {
      const updated = await api.updateUserRole(u.id, newRole);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: updated.role || newRole } : x)));
    } catch (e) {
      alert(e?.message || "Failed to update role");
    }
  };

  return (
    <AppLayout>
      <header style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, marginRight: "auto" }}>Admin Tools</h2>
        <span style={{ color: "#6b7280" }}>
          Users: {counts.users} · Offers: {counts.offers} · Requests: {counts.requests}
        </span>
        <button className="btn btn--small" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Reload"}
        </button>
      </header>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Users</h3>
          <UsersTable users={users} currentUserId={currentUser?.id} onChangeRole={onChangeRole} />
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>Ride Offers</h3>
            <RidesList items={rides.offers} type="offer" />
          </div>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>Ride Requests</h3>
            <RidesList items={rides.requests} type="request" />
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function UsersTable({ users, currentUserId, onChangeRole }) {
  if (!users?.length) return <p style={{ color: "#6b7280" }}>No users.</p>;

  const roles = ["admin", "driver", "parent"];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th style={{ padding: "8px 6px" }}>ID</th>
            <th style={{ padding: "8px 6px" }}>Name</th>
            <th style={{ padding: "8px 6px" }}>Email</th>
            <th style={{ padding: "8px 6px" }}>Role</th>
            <th style={{ padding: "8px 6px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "8px 6px", fontFamily: "monospace", fontSize: 12 }}>{u.id}</td>
                <td style={{ padding: "8px 6px" }}>{u.full_name}</td>
                <td style={{ padding: "8px 6px" }}>{u.email}</td>
                <td style={{ padding: "8px 6px" }}>
                  <span
                    style={{
                      background: "#eef2ff",
                      color: "#1f2937",
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 12,
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: "8px 6px" }}>
                  <label style={{ display: "inline-block", marginRight: 6, fontSize: 12, color: "#6b7280" }}>
                    Set role:
                  </label>
                  <select
                    value={u.role}
                    onChange={(e) => onChangeRole(u, e.target.value)}
                    disabled={isSelf}
                    aria-label={`Change role for ${u.full_name}`}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {isSelf ? (
                    <span style={{ marginLeft: 8, color: "#6b7280", fontSize: 12 }}>(cannot change own role)</span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RidesList({ items, type }) {
  if (!items?.length) return <p style={{ color: "#6b7280" }}>No {type}s.</p>;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((r) => (
        <div key={r.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>{type === "offer" ? `Offer #${r.id}` : `Request #${r.id}`}</strong>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{r.status}</span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {type === "offer" ? (
              <>
                <Chip label={`Driver: ${r.driver_id}`} />
                <Chip label={`Seats: ${r.seats_available}`} />
                <Chip label={`Pickup: ${r.pickup_location?.custom_label || r.pickup_location?.preset}`} />
                <Chip label={`Dropoff: ${r.dropoff_location?.custom_label || r.dropoff_location?.preset}`} />
              </>
            ) : (
              <>
                <Chip label={`Requester: ${r.requester_id}`} />
                <Chip label={`Seats: ${r.seats_requested}`} />
                <Chip label={`From: ${r.from_location?.custom_label || r.from_location?.preset}`} />
                <Chip label={`To: ${r.to_location?.custom_label || r.to_location?.preset}`} />
                {r.matched_offer_id ? <Chip label={`Matched offer: ${r.matched_offer_id}`} /> : null}
              </>
            )}
            <Chip
              label={`Time: ${
                r.time_slot?.preset || "custom"
              }${r.time_slot?.custom_time ? ` @ ${new Date(r.time_slot.custom_time).toLocaleString()}` : ""}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Chip({ label }) {
  return (
    <span style={{ background: "#f1f5f9", color: "#1f2937", padding: "2px 8px", borderRadius: 999, fontSize: 12 }}>
      {label}
    </span>
  );
}
