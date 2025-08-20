import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../services/apiClient";
import RideOfferForm from "../components/rides/RideOfferForm";
import RideRequestForm from "../components/rides/RideRequestForm";
import RideOfferList from "../components/rides/RideOfferList";
import RideRequestList from "../components/rides/RideRequestList";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

/**
 * PUBLIC_INTERFACE
 * Rides page: create offers/requests and manage confirmations/cancellations
 */
export default function Rides() {
  const { user } = useAuth();
  const { addToast } = useNotifications();

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
      const msg = e?.message || "Failed to load rides";
      setErr(msg);
      addToast(msg, { variant: "error" });
    } finally {
      setLoading(false);
      if (!err) {
        addToast("Rides reloaded", { variant: "success", timeout: 2000 });
      }
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onOfferCreated = (created) => {
    setOffers((prev) => [created, ...prev]);
    addToast(`Ride offer #${created?.id || ""} created`, { variant: "success" });
  };

  const onRequestCreated = (created) => {
    setRequests((prev) => [created, ...prev]);
    addToast(`Ride request #${created?.id || ""} created`, { variant: "success" });
  };

  const onCancelOffer = async (offer) => {
    try {
      const updated = await api.cancelRideOffer(offer.id);
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? updated : o)));
      addToast(`Offer #${offer.id} cancelled`, { variant: "info" });
    } catch (e) {
      addToast(e?.message || "Failed to cancel offer", { variant: "error" });
    }
  };

  const onCancelRequest = async (request) => {
    try {
      const updated = await api.cancelRideRequest(request.id);
      setRequests((prev) => prev.map((r) => (r.id === request.id ? updated : r)));
      const refreshedOffers = await api.listRideOffers();
      setOffers(refreshedOffers || []);
      addToast(`Request #${request.id} cancelled`, { variant: "info" });
    } catch (e) {
      addToast(e?.message || "Failed to cancel request", { variant: "error" });
    }
  };

  const onConfirmRequest = async (request, offerId) => {
    try {
      const updatedReq = await api.confirmRideRequest(request.id, offerId);
      setRequests((prev) => prev.map((r) => (r.id === request.id ? updatedReq : r)));
      const refreshedOffers = await api.listRideOffers();
      setOffers(refreshedOffers || []);
      addToast(`Request #${request.id} confirmed with offer #${offerId}`, { variant: "success" });
    } catch (e) {
      addToast(e?.message || "Failed to confirm request", { variant: "error" });
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
