import React, { useMemo, useState } from "react";
import { api } from "../../services/apiClient";

/**
 * PUBLIC_INTERFACE
 * RideRequestForm: form to request seats for a ride
 */
export default function RideRequestForm({ meta, currentUser, onCreated }) {
  const [requesterId, setRequesterId] = useState(currentUser?.id || "");
  const [seats, setSeats] = useState(1);
  const [fromPreset, setFromPreset] = useState(meta?.locations?.[0] || "home");
  const [fromCustom, setFromCustom] = useState("");
  const [toPreset, setToPreset] = useState(meta?.locations?.[1] || "school");
  const [toCustom, setToCustom] = useState("");
  const [slotPreset, setSlotPreset] = useState(meta?.time_slots?.[0] || "morning_pickup");
  const [customTime, setCustomTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isFromCustom = fromPreset === "custom";
  const isToCustom = toPreset === "custom";
  const isTimeCustom = slotPreset === "custom";

  const payload = useMemo(() => {
    return {
      requester_id: requesterId,
      seats_requested: Number(seats),
      from_location: {
        preset: fromPreset,
        custom_label: isFromCustom ? fromCustom || null : null,
      },
      to_location: {
        preset: toPreset,
        custom_label: isToCustom ? toCustom || null : null,
      },
      time_slot: {
        preset: slotPreset,
        custom_time: isTimeCustom && customTime ? new Date(customTime).toISOString() : null,
      },
    };
  }, [requesterId, seats, fromPreset, fromCustom, toPreset, toCustom, slotPreset, customTime, isFromCustom, isToCustom, isTimeCustom]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const created = await api.createRideRequest(payload);
      onCreated?.(created);
      setSeats(1);
    } catch (err) {
      setError(err?.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
      <h4 style={{ margin: "8px 0" }}>Request a ride</h4>
      <div>
        <label>Requester ID</label>
        <input value={requesterId} onChange={(e) => setRequesterId(e.target.value)} required />
      </div>
      <div>
        <label>Seats requested</label>
        <input type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} required />
      </div>
      <div>
        <label>From</label>
        <select value={fromPreset} onChange={(e) => setFromPreset(e.target.value)}>
          {(meta?.locations || []).map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        {isFromCustom && (
          <input placeholder="Custom from" value={fromCustom} onChange={(e) => setFromCustom(e.target.value)} />
        )}
      </div>
      <div>
        <label>To</label>
        <select value={toPreset} onChange={(e) => setToPreset(e.target.value)}>
          {(meta?.locations || []).map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        {isToCustom && (
          <input placeholder="Custom to" value={toCustom} onChange={(e) => setToCustom(e.target.value)} />
        )}
      </div>
      <div>
        <label>Time slot</label>
        <select value={slotPreset} onChange={(e) => setSlotPreset(e.target.value)}>
          {(meta?.time_slots || []).map((ts) => (
            <option key={ts} value={ts}>{ts}</option>
          ))}
        </select>
        {isTimeCustom && (
          <input type="datetime-local" value={customTime} onChange={(e) => setCustomTime(e.target.value)} />
        )}
      </div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? "Posting..." : "Create Request"}
      </button>
    </form>
  );
}
