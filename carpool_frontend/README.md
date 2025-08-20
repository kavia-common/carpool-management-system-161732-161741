# Carpool Frontend (React)

This frontend is scaffolded for rapid feature development with:
- Project structure for pages, components, services, and context
- Routing (react-router-dom v6)
- API client (fetch-based, no extra deps)
- Authentication context and protected routes
- Responsive layout (navbar, sidebar, main content)
- Sample pages: Login, Dashboard, Rides, Calendar, Users, NotFound

## Getting Started

1. Copy env file
   - cp .env.example .env
   - Set REACT_APP_API_BASE_URL (e.g., http://localhost:8000)

2. Install and run
   - npm install
   - npm start

Backend endpoints used are aligned to the provided OpenAPI (e.g., /auth/login, /auth/me, /rides/meta, /calendar/events).

## Notes
- Authentication: stores access_token in localStorage and injects Authorization: Bearer header for requests.
- Update Sidebar and routes as new features/pages are added.
