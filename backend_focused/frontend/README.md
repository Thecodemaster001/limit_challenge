# Fleet Maintenance — Front-end

Web app for the [Fleet Maintenance API](../backend/README.md), built with Next.js 16 (App Router),
React 19, Material UI, React Query and axios. It covers every CRUD resource, the vehicle search,
and the office summary and vehicles-needing-maintenance reports.

**Demo video:** _add the link here_

## Contents

- [Running](#running)
- [What it does](#what-it-does)
- [State and data](#state-and-data)
- [Tests and checks](#tests-and-checks)
- [Structure](#structure)
- [Assumptions and tradeoffs](#assumptions-and-tradeoffs)

## Running

The app needs the API running and a user to sign in with.

### With Docker

From `backend_focused/`, `docker compose up --build` starts the database, the API and this app
on http://localhost:3000. The first start installs dependencies inside the container, so it takes
a minute. Then load demo data and create a user (see the
[backend README](../backend/README.md#running-the-project)).

### Locally

Requires Node.js 22+ and the API running on http://localhost:8000.

```bash
cd backend_focused/frontend
npm install
npm run dev                 # http://localhost:3000
```

`NEXT_PUBLIC_API_BASE_URL` defaults to `http://localhost:8000/api`. To change it, copy
`.env.example` to `.env.local`; the value is read when the app is built or started.

## What it does

| Page                     | Features                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard `/`            | Fleet totals, offices with active vehicles / 12-month cost / last maintenance, vehicles needing maintenance (never serviced first)                                           |
| Vehicles `/vehicles`     | Search by office, status, make, model, maintenance date range and mechanic certification; sortable, paginated; add / edit / delete with a live VIN and plate duplicate check |
| Vehicle `/vehicles/{id}` | Vehicle and office info, maintenance summary with a "due" badge, paginated history; add / edit / delete records; move to another office                                      |
| Offices `/offices`       | CRUD; each office links to its vehicles; a blocked delete explains why and links to the vehicles                                                                             |
| Mechanics `/mechanics`   | CRUD with a status filter; a blocked delete offers "Deactivate instead"                                                                                                      |

Signing in returns you to the page you asked for, so a shared search link survives the login.
An expired access token is refreshed silently; when the session ends, the login page says so.

## State and data

- **The URL is the source of truth for the vehicle search.** Every filter, the sort and the page
  live in the query string (`/vehicles?office=2&is_active=true&make=ford&ordering=-year&page=2`),
  so back/forward, reload and shared links restore the exact view. Text filters are debounced;
  changing a filter returns to page 1; invalid values in a hand-edited URL fall back to defaults.
- **Server state lives only in React Query.** Query keys come from one factory; a change
  invalidates every affected view (a new maintenance record refreshes the vehicle, its history,
  the search results, the dashboard and mechanic workload). Paginated lists keep the previous page
  visible while the next one loads.
- **API types are generated** from the backend's OpenAPI schema (`npm run generate:api-types`,
  with the API running), so request and response shapes cannot drift from the backend.
- **Every data view has loading, empty and error states:** skeletons, empty states with a next
  step ("Clear filters", "Add vehicle"), and readable errors with Retry. DRF validation errors
  appear on the matching form fields; 409 conflicts explain what to do instead.

## Tests and checks

```bash
npm test                                   # Vitest unit tests
npm run lint && npm run typecheck && npm run format && npm run build
```

The 59 unit tests cover the logic that is easiest to get wrong: URL ↔ search state (invalid
values, page reset, round trips), DRF error parsing, date handling across time zones, the
maintenance-due rule, safe login redirects, and the token refresh flow (one shared refresh for
concurrent 401s, sign-out when the refresh token has expired).

## Structure

```
frontend/
├── app/                     routes: login, and (app)/ for signed-in pages behind the auth guard
├── components/              building blocks, grouped by area (vehicles/, offices/, dashboard/, ...)
├── hooks/                   React Query hooks per resource, form state, debouncing
└── lib/
    ├── api/                 typed API calls and the generated schema types
    ├── api-client.ts        axios with JWT header, single-flight refresh and sign-out
    ├── auth/                token storage and the auth context
    └── *.ts                 pure helpers: search params, errors, formatting, maintenance rules
```

## Assumptions and tradeoffs

- **Tokens are kept in `localStorage`** so a session survives reloads and is shared across tabs
  (signing out in one tab signs out all of them). That exposes them to XSS; an httpOnly cookie
  would avoid it but needs backend changes. Routes are protected client-side, since a Next.js
  proxy cannot read `localStorage`; the API enforces authentication either way.
- **Select inputs load up to 100 offices or mechanics.** Fleets have few of each; a larger fleet
  would need a searchable autocomplete.
- **Only the vehicle search keeps its state in the URL.** Paging on smaller lists (offices,
  mechanics, history) is local state, which keeps those pages simple.
- **Currency is shown as US dollars;** the API stores amounts without a currency.
- **Moving a vehicle uses the dedicated assign action**, so the vehicle edit form shows the
  office read-only, matching the backend.
