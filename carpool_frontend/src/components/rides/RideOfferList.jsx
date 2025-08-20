import React from "react";

/**
 * PUBLIC_INTERFACE
 * RideOfferList: list ride offers with cancel action and seat status.
 */
export default function RideOfferList({ offers, onCancel }) {
  if (!offers?.length) return <p style={{ color: "#6b7280" }}>No offers yet.</p>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {offers.map((o) => (
        <div key={o.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Offer #{o.id}</strong>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{o.status}</span>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Chip label={`Driver: ${o.driver_id}`} />
            <Chip label={`Seats: ${o.seats_available}`} />
            <Chip label={`Pickup: ${o.pickup_location?.custom_label || o.pickup_location?.preset}`} />
            <Chip label={`Dropoff: ${o.dropoff_location?.custom_label || o.dropoff_location?.preset}`} />
            <Chip label={`Time: ${o.time_slot?.preset}${o.time_slot?.custom_time ? ` @ ${new Date(o.time_slot.custom_time).toLocaleString()}` : ""}`} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--small" onClick={() => onCancel?.(o)} disabled={o.status === "cancelled"}>
              Cancel
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Chip({ label }) {
  return (
    <span style={{ background: "#eef2ff", color: "#1f2937", padding: "4px 8px", borderRadius: 999, fontSize: 12 }}>
      {label}
    </span>
  );
}
