import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../services/apiClient";
import RideOfferForm from "../components/rides/RideOfferForm";
import RideRequestForm from "../components/rides/RideRequestForm";
import RideOfferList from "../components/rides/RideOfferList";
import RideRequestList from "../components/rides/RideRequestList";
import { useAuth } from "../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * Rides page: create offers/requests and manage confirmations/cancellations
 */
export default function Rides() {
  const { user } = useAuth();
  const [meta, setMeta] = useState(null);
  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const reload = async () => {
    setLoading(true);
    setErr("");
    try {
      const [m, o, r] = await Promise.all([api.getRidesMeta(), api.listRideOffers(), api.listRideRequests()]);
      setMeta(m);
      setOffers(o || []);
      setRequests(r || []);
    } catch (e) {
      setErr(e?.message || "Failed to load rides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const onOfferCreated = (created) => {
    // optimistic append
    setOffers((prev) => [created, ...prev]);
  };

  const onRequestCreated = (created) => {
    setRequests((prev) => [created, ...prev]);
  };

  const onCancelOffer = async (offer) => {
    try {
      const updated = await api.cancelRideOffer(offer.id);
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? updated : o)));
    } catch (e) {
      alert(e?.message || "Failed to cancel offer");
    }
  };

  const onCancelRequest = async (request) => {
    try {
      const updated = await api.cancelRideRequest(request.id);
      setRequests((prev) => prev.map((r) => (r.id === request.id ? updated : r)));
      // Refresh offers as seats may be released after cancel
      const refreshedOffers = await api.listRideOffers();
      setOffers(refreshedOffers || []);
    } catch (e) {
      alert(e?.message || "Failed to cancel request");
    }
  };

  const onConfirmRequest = async (request, offerId) => {
    try {
      const updatedReq = await api.confirmRideRequest(request.id, offerId);
      setRequests((prev) => prev.map((r) => (r.id === request.id ? updatedReq : r)));
      // Refresh offers to reflect reduced seats after confirmation
      const refreshedOffers = await api.listRideOffers();
      setOffers(refreshedOffers || []);
    } catch (e) {
      alert(e?.message || "Failed to confirm request");
    }
  };

  const headerInfo = useMemo(() => {
    const availableSeats = (offers || []).reduce((acc, o) => acc + (o.seats_available || 0), 0);
    return { availableSeats, counts: { offers: offers.length, requests: requests.length } };
  }, [offers, requests]);

  return (
    <AppLayout>
      <h2>Rides</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <section style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <strong>Summary</strong>
              <span style={{ color: "#6b7280" }}>
                Offers: {headerInfo.counts.offers} · Requests: {headerInfo.counts.requests} · Seats available: {headerInfo.availableSeats}
              </span>
              <button className="btn btn--small" onClick={reload}>Reload</button>
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
              <RideOfferForm meta={meta} currentUser={user} onCreated={onOfferCreated} />
            </div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
              <RideRequestForm meta={meta} currentUser={user} onCreated={onRequestCreated} />
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <h3 style={{ marginTop: 0 }}>Offers</h3>
              <RideOfferList offers={offers} onCancel={onCancelOffer} />
            </div>
            <div>
              <h3 style={{ marginTop: 0 }}>Requests</h3>
              <RideRequestList requests={requests} offers={offers} onConfirm={onConfirmRequest} onCancel={onCancelRequest} />
            </div>
          </section>
        </>
      )}
    </AppLayout>
  );
}
