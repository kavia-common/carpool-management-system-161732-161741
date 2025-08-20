# Carpool Frontend (React)

This is the web UI for the Carpool Management System. It provides login and protected pages for dashboard, rides, calendar, and user management with role-based access for admins.

## Features

- React 18 + react-router-dom v6.
- Authentication context with persisted access_token in localStorage.
- Protected routes (ProtectedRoute) and admin-only routes (AdminRoute).
- Simple API client with fetch (src/services/apiClient.js).
- Responsive layout with Navbar and Sidebar.
- Sample pages: Login, Dashboard, Rides, Calendar, Users, Admin, NotFound.

## Prerequisites

- Node.js 18+ and npm.

## Environment variables

- REACT_APP_API_BASE_URL
  - Base URL of the backend API.
  - Default: http://localhost:8000
  - Example .env:
    REACT_APP_API_BASE_URL=http://localhost:8000

Note: The backend MVP expects the access token to be provided as a query parameter (?token=...) for protected endpoints. The current API client attaches Authorization: Bearer <token> by default. For endpoints that require the token query parameter, the backend accepts the query token and ignores Authorization. The provided pages and flows call endpoints that work with backend MVP settings as implemented.

## Install and Run (Development)

1) Install dependencies
- cd carpool_frontend
- npm install

2) Start the development server
- npm start

The app runs at http://localhost:3000 and will call the backend at REACT_APP_API_BASE_URL (default http://localhost:8000). Ensure the backend is running and CORS allows http://localhost:3000.

## Build (Production)

- npm run build
This creates a production build in the build/ directory which can be served by any static file server (e.g., Nginx). Configure your reverse proxy to route API requests to the backend and serve static files for the frontend.

## Authentication and Roles

- Login occurs via POST /auth/login. On success, access_token is stored in localStorage.
- The AuthContext fetches the current user from GET /auth/me and stores user details (including role).
- ProtectedRoute requires a token; AdminRoute also requires user.role === "admin".
- For the MVP backend, protected endpoints expect ?token=<access_token> in query. The UI calls endpoints compatible with the current backend.

Default seeded admin (from backend):
- email: admin@carpool.local
- password: admin123

## Key Files

- src/services/apiClient.js
  - fetch-based client with helpers for auth, users, rides, calendar, notifications.
- src/context/AuthContext.js
  - Holds token/user state, login/logout, and fetches /auth/me.
- src/components/ProtectedRoute.jsx and src/components/AdminRoute.jsx
  - Route guards.
- src/pages/*
  - Login, Dashboard, Rides (offers/requests), Calendar, Users, Admin, NotFound.

## Common API Calls (from apiClient)

- Auth:
  - login(email, password): POST /auth/login
  - me(): GET /auth/me
- Users (admin):
  - listUsers(), createUser(payload)
- Rides:
  - getRidesMeta(), listRideOffers(), listRideRequests()
  - createRideOffer(payload), createRideRequest(payload)
  - confirmRideRequest(requestId, offerId), cancelRideRequest(requestId), cancelRideOffer(offerId)
- Calendar:
  - getEvents(days, userId), syncCalendar(userId, source)
- Notifications:
  - listNotifications(userId), sendNotification(userId, title, body), testNotifications(target)

## Development Tips

- If you change the backend port or host, update REACT_APP_API_BASE_URL.
- If CORS errors occur, set CORS_ORIGINS in the backend to include http://localhost:3000.
- Update Sidebar and routes as new features/pages are added.

## Known Limitations

- The backend currently uses an in-memory data store; data resets on backend restart.
- Token handling is MVP-style (query parameter). The frontend attaches Authorization headers by default; this is tolerated by the backend for now.
- No real-time updates; pages poll via HTTP.

## Future Improvements

- Align token handling with Authorization: Bearer header end-to-end.
- Add pagination and filtering to users/rides.
- Improve error display and form validation.
- Add E2E tests and CI integration.
