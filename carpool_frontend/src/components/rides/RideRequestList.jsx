import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * RideRequestList: list ride requests with actions to confirm with an offer and cancel.
 */
export default function RideRequestList({ requests, offers, onConfirm, onCancel }) {
  if (!requests?.length) return <p style={{ color: "#6b7280" }}>No requests yet.</p>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {requests.map((r) => (
        <RequestCard key={r.id} r={r} offers={offers} onConfirm={onConfirm} onCancel={onCancel} />
      ))}
    </div>
  );
}

function RequestCard({ r, offers, onConfirm, onCancel }) {
  const [selectedOffer, setSelectedOffer] = useState(r.matched_offer_id || "");

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Request #{r.id}</strong>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{r.status}</span>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Chip label={`Requester: ${r.requester_id}`} />
        <Chip label={`Seats: ${r.seats_requested}`} />
        <Chip label={`From: ${r.from_location?.custom_label || r.from_location?.preset}`} />
        <Chip label={`To: ${r.to_location?.custom_label || r.to_location?.preset}`} />
        <Chip label={`Time: ${r.time_slot?.preset}${r.time_slot?.custom_time ? ` @ ${new Date(r.time_slot.custom_time).toLocaleString()}` : ""}`} />
        {r.matched_offer_id ? <Chip label={`Matched offer: ${r.matched_offer_id}`} /> : null}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <select
          aria-label="Select offer to confirm with"
          value={selectedOffer}
          onChange={(e) => setSelectedOffer(e.target.value)}
          disabled={r.status === "confirmed" || r.status === "cancelled"}
        >
          <option value="">Select offer…</option>
          {offers.map((o) => (
            <option key={o.id} value={o.id}>
              Offer #{o.id} · seats {o.seats_available}
            </option>
          ))}
        </select>
        <button
          className="btn btn--small"
          onClick={() => selectedOffer && onConfirm?.(r, selectedOffer)}
          disabled={!selectedOffer || r.status === "confirmed" || r.status === "cancelled"}
        >
          Confirm with offer
        </button>
        <button className="btn btn--small" onClick={() => onCancel?.(r)} disabled={r.status === "cancelled"}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function Chip({ label }) {
  return (
    <span style={{ background: "#ecfeff", color: "#1f2937", padding: "4px 8px", borderRadius: 999, fontSize: 12 }}>
      {label}
    </span>
  );
}
