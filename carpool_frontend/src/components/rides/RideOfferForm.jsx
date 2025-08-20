import React, { useMemo, useState } from "react";
import { api } from "../../services/apiClient";

/**
 * PUBLIC_INTERFACE
 * RideOfferForm: form to create a ride offer (driver/parent offering seats)
 */
export default function RideOfferForm({ meta, currentUser, onCreated }) {
  const [driverId, setDriverId] = useState(currentUser?.id || "");
  const [seats, setSeats] = useState(3);
  const [pickupPreset, setPickupPreset] = useState(meta?.locations?.[0] || "home");
  const [pickupCustom, setPickupCustom] = useState("");
  const [dropoffPreset, setDropoffPreset] = useState(meta?.locations?.[1] || "school");
  const [dropoffCustom, setDropoffCustom] = useState("");
  const [slotPreset, setSlotPreset] = useState(meta?.time_slots?.[0] || "morning_pickup");
  const [customTime, setCustomTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isPickupCustom = pickupPreset === "custom";
  const isDropoffCustom = dropoffPreset === "custom";
  const isTimeCustom = slotPreset === "custom";

  const payload = useMemo(() => {
    return {
      driver_id: driverId,
      seats_available: Number(seats),
      pickup_location: {
        preset: pickupPreset,
        custom_label: isPickupCustom ? pickupCustom || null : null,
      },
      dropoff_location: {
        preset: dropoffPreset,
        custom_label: isDropoffCustom ? dropoffCustom || null : null,
      },
      time_slot: {
        preset: slotPreset,
        custom_time: isTimeCustom && customTime ? new Date(customTime).toISOString() : null,
      },
    };
  }, [driverId, seats, pickupPreset, pickupCustom, dropoffPreset, dropoffCustom, slotPreset, customTime, isPickupCustom, isDropoffCustom, isTimeCustom]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const created = await api.createRideOffer(payload);
      onCreated?.(created);
      // reset minimal fields
      setSeats(3);
    } catch (err) {
      setError(err?.message || "Failed to create offer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
      <h4 style={{ margin: "8px 0" }}>Offer a ride</h4>
      <div>
        <label>Driver ID</label>
        <input value={driverId} onChange={(e) => setDriverId(e.target.value)} required />
      </div>
      <div>
        <label>Seats available</label>
        <input type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} required />
      </div>
      <div>
        <label>Pickup location</label>
        <select value={pickupPreset} onChange={(e) => setPickupPreset(e.target.value)}>
          {(meta?.locations || []).map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        {isPickupCustom && (
          <input placeholder="Custom pickup" value={pickupCustom} onChange={(e) => setPickupCustom(e.target.value)} />
        )}
      </div>
      <div>
        <label>Dropoff location</label>
        <select value={dropoffPreset} onChange={(e) => setDropoffPreset(e.target.value)}>
          {(meta?.locations || []).map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        {isDropoffCustom && (
          <input placeholder="Custom dropoff" value={dropoffCustom} onChange={(e) => setDropoffCustom(e.target.value)} />
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
        {submitting ? "Posting..." : "Create Offer"}
      </button>
    </form>
  );
}
