import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api, formatDateRange } from "../services/apiClient";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * Calendar page: agenda/list view of upcoming rides and club events with calendar sync input.
 */
export default function Calendar() {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [days, setDays] = useState(7);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Sync form
  const [syncUrl, setSyncUrl] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await api.getEvents(days, user?.id);
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load events");
      addToast(e?.message || "Failed to load events", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const grouped = useMemo(() => groupByDate(events), [events]);

  const onSync = async (e) => {
    e.preventDefault();
    if (!syncUrl || !user?.id) return;
    setSyncLoading(true);
    setSyncMsg("");
    try {
      const res = await api.syncCalendar(user.id, syncUrl);
      const connected = res?.connected_sources;
      const msg = `Sync successful. ${typeof connected === "number" ? connected : "Updated"} source(s) connected.`;
      setSyncMsg(msg);
      addToast(msg, { variant: "success" });
      // Reload events after successful sync
      await load();
      setSyncUrl("");
    } catch (e) {
      setSyncMsg(e?.message || "Failed to sync calendar");
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <AppLayout>
      <header style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <h2 style={{ margin: 0, marginRight: "auto" }}>Calendar</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label htmlFor="days" style={{ fontWeight: 600 }}>Days</label>
          <input
            id="days"
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value || 7))}
            style={{ width: 84 }}
          />
          <button className="btn btn--small" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Reload"}
          </button>
        </div>
      </header>

      <section style={{ marginTop: 16, marginBottom: 20 }}>
        <SyncBox
          value={syncUrl}
          onChange={setSyncUrl}
          onSubmit={onSync}
          loading={syncLoading}
          message={syncMsg}
        />
      </section>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {loading ? (
        <p>Loading events…</p>
      ) : events?.length ? (
        <Agenda grouped={grouped} />
      ) : (
        <EmptyState onReload={load} />
      )}
    </AppLayout>
  );
}

function SyncBox({ value, onChange, onSubmit, loading, message }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <label style={{ fontWeight: 600 }}>
          Sync external calendar (iCal/ICS URL)
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="url"
            placeholder="https://example.com/calendar.ics"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ flex: 1, minWidth: 260 }}
            aria-label="Calendar source URL"
            required
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Syncing..." : "Connect"}
          </button>
        </div>
        {message ? <span style={{ color: "#374151" }}>{message}</span> : null}
        <span style={{ color: "#6b7280", fontSize: 13 }}>
          Paste an iCal/ICS URL from your club or league. The backend uses a mock adapter and merges events with rides.
        </span>
      </form>
    </div>
  );
}

function Agenda({ grouped }) {
  const dates = Object.keys(grouped).sort();
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {dates.map((day) => (
        <DayGroup key={day} date={day} items={grouped[day]} />
      ))}
    </div>
  );
}

function DayGroup({ date, items }) {
  const friendly = new Date(date).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <section style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
      <header
        style={{
          background: "#f6f7f9",
          padding: "10px 12px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <strong>{friendly}</strong>
        <span style={{ color: "#6b7280", fontSize: 13 }}>{items.length} event(s)</span>
      </header>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((ev) => (
          <AgendaItem key={ev.id || `${ev.title}-${ev.start}`} event={ev} />
        ))}
      </ul>
    </section>
  );
}

function AgendaItem({ event }) {
  const {
    title,
    type, // e.g., "ride", "club_event"
    start,
    end,
    location,
    description,
    status,
  } = normalizeEvent(event);

  const badge = type === "ride" ? "🚗 Ride" : type === "club_event" ? "🏅 Club" : "📌 Event";
  const time = formatDateRange(start, end);
  const statusColor =
    status === "confirmed" ? "#16a34a" :
    status === "cancelled" ? "#dc2626" :
    "#2563eb";

  return (
    <li
      style={{
        padding: 12,
        borderTop: "1px solid #e5e7eb",
        display: "grid",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ background: "#eef2ff", padding: "2px 6px", borderRadius: 6, fontSize: 12 }}>
          {badge}
        </span>
        {status ? (
          <span
            style={{
              background: "#f1f5f9",
              padding: "2px 6px",
              borderRadius: 6,
              fontSize: 12,
              color: statusColor,
              border: `1px solid ${statusColor}22`,
            }}
          >
            {status}
          </span>
        ) : null}
        <strong style={{ fontSize: 16 }}>{title}</strong>
      </div>
      <div style={{ color: "#374151" }}>{time}</div>
      {location ? (
        <div style={{ color: "#6b7280" }}>
          📍 {location}
        </div>
      ) : null}
      {description ? (
        <div style={{ color: "#6b7280", fontSize: 14 }}>{description}</div>
      ) : null}
    </li>
  );
}

function EmptyState({ onReload }) {
  return (
    <div
      style={{
        border: "1px dashed #cbd5e1",
        borderRadius: 12,
        padding: 24,
        textAlign: "center",
      }}
    >
      <p style={{ marginTop: 0, color: "#6b7280" }}>
        No upcoming events found. Try connecting a calendar source or extending the days range.
      </p>
      <button className="btn btn--small" onClick={onReload}>Reload</button>
    </div>
  );
}

// Helpers

function groupByDate(items) {
  const map = {};
  for (const ev of items || []) {
    const d = pickDateKey(ev.start || ev.time?.start || ev.time_slot?.custom_time);
    const key = d || "Unknown";
    if (!map[key]) map[key] = [];
    map[key].push(ev);
  }
  return map;
}

function pickDateKey(iso) {
  try {
    if (!iso) return null;
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return null;
  }
}

function normalizeEvent(ev) {
  // Backend may return mixed types; attempt to normalize to a common shape.
  const isRide = ev?.type === "ride" || ev?.ride_id || ev?.time_slot;
  const isClub = ev?.type === "club_event" || ev?.club || ev?.source === "club";

  if (isRide) {
    const title = ev.title || "Carpool Ride";
    const start = ev.start || ev.time?.start || ev.time_slot?.custom_time || null;
    const end = ev.end || ev.time?.end || null;
    const location =
      ev.location?.custom_label ||
      ev.location?.preset ||
      ev.dropoff_location?.custom_label ||
      ev.dropoff_location?.preset ||
      ev.from_location?.custom_label ||
      ev.from_location?.preset ||
      null;
    return {
      title,
      type: "ride",
      start,
      end,
      location,
      description: ev.description || null,
      status: ev.status || null,
    };
  }

  // fallback club event normalization
  return {
    title: ev.title || ev.name || "Club Event",
    type: isClub ? "club_event" : ev.type || "event",
    start: ev.start || ev.starts_at || ev.time?.start || null,
    end: ev.end || ev.ends_at || ev.time?.end || null,
    location: ev.location || ev.venue || null,
    description: ev.description || null,
    status: ev.status || null,
  };
}
