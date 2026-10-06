# Solution notes

How the Submission Tracker is built and why. To run it, see the [README](README.md).

## Approach

**API (Django + DRF)**
- `GET /api/submissions/` returns paginated rows with the company, broker, owner, document and note counts, and a latest-note preview.
  - The counts and latest note come from correlated subqueries rather than joins, so two counts can't multiply each other.
  - A note index (`submission, -created_at`) keeps the latest-note lookup cheap.
- The detail endpoint prefetches contacts, documents and notes.
- Filters live in a django-filter `FilterSet`:
  - `status` and `priority` accept comma-separated lists.
  - `brokerId`, `ownerId`, `companySearch`, `createdFrom`/`createdTo`, `hasDocuments` and `hasNotes`.
  - `ordering` sorts priority and status by workflow rank rather than alphabetically, and breaks ties by id so pages never overlap.
  - Invalid values return 400 with field-level messages.
- `GET /api/submissions/status-counts/` returns counts per status under every filter except `status`. It powers the view tabs and the counts in the status menu.
- The API speaks camelCase end to end:
  - the camel-case renderer, parser and middleware translate keys, so Python stays snake_case
  - a schema hook makes Swagger show the same camelCase names
- **Writes:**
  - `PATCH /api/submissions/<id>/` accepts only `status`, `priority` and `ownerId`.
  - `POST /api/submissions/<id>/notes/` takes the note's author from the signed-in user, never from the request.
- **Authentication:** JWT in httpOnly, SameSite=Lax cookies.
  - CSRF protection applies to every write.
  - Refresh tokens rotate and are blacklisted after use.
  - Sign-in attempts are limited per username.

**Frontend (Next.js 16 + MUI + React Query)**
- **Same-origin API.** Next rewrites `/api/*` to Django, so the browser only ever talks to one origin. Cookies are first-party and no CORS is needed.
- **Route protection.** `proxy.ts` sends signed-out visitors to `/login?next=…` before a page renders. The API client refreshes an expired session once, coalescing parallel requests into a single refresh. When the session can't be refreshed, it returns the user to the login page.
- **The URL is the state.** `lib/submission-search-params.ts` parses the query string, dropping invalid values, and builds it back with the same parameter names as the API. Back, reload and shared links all reproduce the same view, and the detail page's breadcrumb returns to the exact filtered list.
- **Data.** React Query keeps the previous page visible while the next one loads. Hovering a row prefetches its detail. Notes and triage changes update the screen immediately and roll back if the server rejects them, and the triage toast offers Undo.
- **States.** Loading uses skeletons shaped like the real layout. Empty results distinguish "no matches for these filters" (with a Clear filters button) from "nothing here yet". Errors offer a retry, and an unknown submission or a page that no longer exists gets its own message.
- **Design.** The look is a dense operations tool rather than a template:
  - a neutral grey scale with one accent colour
  - 1px borders instead of shadows
  - 13–14px type
  - status shown as a coloured dot and priority as a bar glyph, not loud chips
  - relative dates, with the exact date in a tooltip

  Below 900px the table becomes a stacked list. On the detail page, phones show the key properties first, then the summary and notes.

## Testing

The backend tests cover:
- every filter and ordering, including invalid input
- response shapes and pagination
- query counts: the list always takes 2 queries and the detail 4, however many rows exist
- authentication: cookies, refresh-token rotation and blacklisting, CSRF, rate limiting
- writes: adding notes and triage updates
- the seed command

The frontend unit tests cover the logic that is easy to get wrong:
- parsing and serializing URL state
- saved views and sort direction
- date formatting
- error messages
- safe login redirects
- the rules that decide when keyboard shortcuts fire

I also ran an end-to-end browser pass (Puppeteer) against the Docker stack at desktop and phone widths. It covered login and redirect, every filter, views, sorting, pagination, keyboard navigation, posting a note, changing status with undo, the not-found page and sign-out.

## Extras beyond the brief

- JWT authentication in httpOnly cookies, with a login page and route protection
- Saved views (All, My submissions, In progress, High priority), each with a live count and a hover hint that explains its rule
- Sortable columns, plus a sort menu on phones
- Adding notes and changing status, priority or owner, with optimistic updates and undo
- Next/previous on the detail page ("3 of 15", or `j`/`k`), following the list's filters, sort and page across page boundaries, so you can work through a queue without going back to the list
- Keyboard shortcuts: `j`/`k`, `Enter`, `/`, `Esc`, `⌘/Ctrl Enter`, and `[` to collapse the sidebar. Press `?` for the full list.
- Collapsible sidebar. The choice is stored in a cookie, so the server renders it already collapsed instead of snapping shut after load.
- OpenAPI docs, a Docker setup with Postgres, and realistic, repeatable seed data

## Assumptions and tradeoffs

- **Where submissions come from.** Brokers send submissions and this workspace is where the team reviews them, so the app has no "New submission" form. The brief asks only for read endpoints, and the data comes from `seed_submissions`. Staff can still enter one by hand in the Django admin (Submissions → Add, with contacts, documents and notes on the same page). An in-app intake form would be the natural next step.
- **Owner assignment.** Submissions are assigned to `TeamMember` records. A login is linked to a team member through an optional one-to-one relationship, so the workspace can know who "me" is.
- **What can be edited.** Only triage fields (status, priority, owner) and notes can be changed from the UI. Company, broker and summary come from the broker and stay read-only.
- **Work in progress.** "In progress" means *New* plus *In review*, since Closed and Lost are finished. "High priority" only shows in-progress submissions, because a closed high-priority deal needs no attention.
- **Rate limiting.** The Next.js proxy doesn't forward the client's IP address, so sign-in attempts are limited per username instead. A per-IP limit would have locked every user out together.
- **One business time zone.** "Received" dates, "Yesterday" and the date filters all use US Eastern (`America/New_York`, which handles EST and EDT), not each viewer's browser. Everyone on the team sees the same day for the same submission. Timestamps are stored in UTC, and the zone is one setting (`TIME_ZONE`, mirrored by `BUSINESS_TIME_ZONE` in the frontend).
- **Rendering.** Data loads in the browser through React Query rather than through server components. The workspace is interactive and authenticated, so server rendering would add complexity for little gain.
- **Docker.** The compose stack runs the development servers with live reload. A production setup would build the Next.js app, serve Django through gunicorn (already in the image), and turn on secure cookies (`AUTH_COOKIE_SECURE`, which defaults to on when `DEBUG` is off).


