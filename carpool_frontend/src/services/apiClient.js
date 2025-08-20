//
//
// Lightweight API client for the carpool backend.
//
// Uses fetch under the hood to avoid extra dependencies. Automatically injects
// Authorization header when a token exists in localStorage.
//

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

/**
 * Internal helper to build headers with optional auth token.
 */
function buildHeaders(extra = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...extra,
  };
  const token = localStorage.getItem("access_token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Wrap fetch with JSON handling and error normalization.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
async function request(url, options = {}) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: buildHeaders(options.headers || {}),
  });
  const contentType = res.headers.get("content-type") || "";
  const isJSON = contentType.includes("application/json");

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    if (isJSON) {
      try {
        const data = await res.json();
        message = data?.detail || data?.message || message;
      } catch {
        // ignore parse errors
      }
    } else {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        // ignore
      }
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  if (isJSON) return res.json();
  return res.text();
}

/**
 * PUBLIC_INTERFACE
 * Notifications endpoints (optional usage for listing/sending notifications)
 */
async function listNotifications(userId) {
  return request(`/notifications/${encodeURIComponent(userId)}`, { method: "GET" });
}
async function sendNotification(userId, title, body) {
  const params = new URLSearchParams();
  params.set("user_id", String(userId));
  params.set("title", title);
  params.set("body", body);
  return request(`/notifications?${params.toString()}`, { method: "POST" });
}
async function testNotifications(target) {
  const params = new URLSearchParams();
  if (target) params.set("target", target);
  return request(`/notifications/test?${params.toString()}`, { method: "POST" });
}

// PUBLIC_INTERFACE
export const api = {
  /** Auth endpoints */
  // PUBLIC_INTERFACE
  login: async (email, password) => {
    /** Authenticate a user and return token payload */
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  // PUBLIC_INTERFACE
  me: async () => {
    /** Get current user profile from /auth/me */
    return request("/auth/me", { method: "GET" });
  },

  /** Users endpoints */
  // PUBLIC_INTERFACE
  createUser: async (payload) => {
    /** Create a new user */
    return request("/users", { method: "POST", body: JSON.stringify(payload) });
  },
  // PUBLIC_INTERFACE
  listUsers: async () => request("/users", { method: "GET" }),

  /** Rides endpoints */
  // PUBLIC_INTERFACE
  getRidesMeta: async () => request("/rides/meta", { method: "GET" }),
  // PUBLIC_INTERFACE
  listRideOffers: async () => request("/rides/offers", { method: "GET" }),
  // PUBLIC_INTERFACE
  listRideRequests: async () => request("/rides/requests", { method: "GET" }),
  // PUBLIC_INTERFACE
  createRideOffer: async (payload) =>
    request("/rides/offers", { method: "POST", body: JSON.stringify(payload) }),
  // PUBLIC_INTERFACE
  createRideRequest: async (payload) =>
    request("/rides/requests", { method: "POST", body: JSON.stringify(payload) }),
  // PUBLIC_INTERFACE
  confirmRideRequest: async (requestId, offerId) =>
    request(
      `/rides/requests/${encodeURIComponent(
        requestId
      )}/confirm?offer_id=${encodeURIComponent(offerId)}`,
      {
        method: "POST",
      }
    ),
  // PUBLIC_INTERFACE
  cancelRideRequest: async (requestId) =>
    request(`/rides/requests/${encodeURIComponent(requestId)}/cancel`, {
      method: "POST",
    }),
  // PUBLIC_INTERFACE
  cancelRideOffer: async (offerId) =>
    request(`/rides/offers/${encodeURIComponent(offerId)}/cancel`, {
      method: "POST",
    }),

  /** Calendar endpoints */
  // PUBLIC_INTERFACE
  getEvents: async (days = 7, userId) => {
    const params = new URLSearchParams();
    if (days) params.set("days", String(days));
    if (userId) params.set("user_id", String(userId));
    return request(`/calendar/events?${params.toString()}`, { method: "GET" });
  },
  // PUBLIC_INTERFACE
  syncCalendar: async (userId, source) => {
    /** Connect/sync a calendar source (URL or ICS text) for a user */
    return request(`/calendar/sync`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, source }),
    });
  },

  /** Admin endpoints */
  // PUBLIC_INTERFACE
  getAdminUsers: async () => {
    /** Fetch all users via admin scope */
    return request("/admin/users", { method: "GET" });
  },
  // PUBLIC_INTERFACE
  getAdminRides: async () => {
    /** Fetch all rides via admin scope */
    return request("/admin/rides", { method: "GET" });
  },

  /** User updates */
  // PUBLIC_INTERFACE
  updateUserRole: async (userId, role) => {
    /** Update only the role field for a user using PATCH /users/{id} */
    return request(`/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  /** Notifications helpers (optional) */
  // PUBLIC_INTERFACE
  listNotifications,
  // PUBLIC_INTERFACE
  sendNotification,
  // PUBLIC_INTERFACE
  testNotifications,
};

// PUBLIC_INTERFACE
export function formatDateRange(startISO, endISO) {
  /** Utility to format start/end into a friendly string */
  try {
    const start = startISO ? new Date(startISO) : null;
    const end = endISO ? new Date(endISO) : null;
    if (!start && !end) return "";
    if (start && !end) return `${start.toLocaleString()}`;
    if (!start && end) return `${end.toLocaleString()}`;
    const sameDay =
      start.toDateString && end.toDateString && start.toDateString() === end.toDateString();
    if (sameDay) {
      return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return `${start.toLocaleString()} - ${end.toLocaleString()}`;
  } catch {
    return `${startISO || ""}${endISO ? ` - ${endISO}` : ""}`;
  }
}

export default api;
