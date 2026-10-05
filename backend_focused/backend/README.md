# Fleet Maintenance API

REST API for managing a fleet of vehicles, the offices they belong to, the mechanics who service
them and their maintenance history. Built with Django 5.2 and Django REST Framework, documented
with OpenAPI (Swagger) and shipped with Docker + PostgreSQL.

The challenge brief is in [../README.md](../README.md). This submission covers the back-end.

## Contents

- [Running the project](#running-the-project)
- [Running the tests](#running-the-tests)
- [API overview](#api-overview)
- [Project structure](#project-structure)
- [Assumptions](#assumptions)
- [Design decisions and tradeoffs](#design-decisions-and-tradeoffs)
- [Not included](#not-included)

## Running the project

### With Docker (recommended)

Requires Docker with Compose v2. From `backend_focused/`:

```bash
docker compose up --build                                       # API on http://localhost:8000
docker compose exec api python manage.py seed_fleet --clear     # load demo data
```

The API container waits for PostgreSQL to be healthy and applies migrations on start-up. The
source is mounted into the container and served by Django's auto-reloading dev server; the image's
default command runs `gunicorn` for production-like use.

> The database is also published on host port **5432**. If a local PostgreSQL already uses that
> port, stop it first or remove the `ports` entry of the `db` service (the API reaches the
> database over the internal Docker network either way).

### Without Docker

Requires Python 3.11+. Uses SQLite unless `DATABASE_URL` is set (see `.env.example`).

```bash
cd backend_focused/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_fleet --clear
python manage.py runserver
```

### Useful URLs

| URL | Purpose |
| --- | --- |
| http://localhost:8000/api/docs/ | Swagger UI: every endpoint, with "Try it out" |
| http://localhost:8000/api/redoc/ | ReDoc reference |
| http://localhost:8000/api/schema/ | OpenAPI 3 schema |
| http://localhost:8000/api/ | DRF browsable API |
| http://localhost:8000/api/health/ | Health check (verifies the database connection) |
| http://localhost:8000/admin/ | Django admin (`python manage.py createsuperuser` first) |

### Demo data

`seed_fleet` creates 8 offices, 20 mechanics, 150 vehicles and about 2,500 maintenance records.
It is deterministic (`--seed`, default 42) and refuses to run on a non-empty database unless
`--clear` is passed. The data deliberately includes the cases the endpoints have to handle:

- one vehicle with 500 maintenance records (vehicle details performance);
- active vehicles that were never serviced, and others last serviced over 365 days ago;
- inactive vehicles, one of which reuses an active vehicle's license plate;
- an inactive mechanic with historical records.

Options: `--offices`, `--mechanics`, `--vehicles`, `--records`, `--seed`, `--clear`.

## Running the tests

```bash
docker compose exec api pytest          # PostgreSQL, from backend_focused/
pytest                                  # SQLite, from backend_focused/backend/ with the venv active
```

76 tests (pytest + pytest-django + factory_boy) cover database constraints, validation messages,
every filter and report, boundary dates, error codes and **query counts** (vehicle details takes
2 queries with 1 or 300 maintenance records). Report logic is tested against a fixed date, so
results don't depend on when the suite runs.

Linting, formatting and schema checks:

```bash
ruff check . && ruff format --check .
python manage.py spectacular --validate --fail-on-warn --file /dev/null
```

## API overview

All endpoints live under `/api/`. Lists are paginated (`?page=`, `?page_size=` up to 100) and
accept `?ordering=` on the documented fields. Full request and response schemas are in Swagger.

| # | Endpoint | Description |
| --- | --- | --- |
| 1 | `/offices/`, `/vehicles/`, `/mechanics/`, `/maintenance-records/` | CRUD (`GET`, `POST`, `GET/PUT/PATCH/DELETE {id}/`) |
| 2 | `GET /offices/summary/` | Every office with active vehicle count, maintenance cost over the last 12 months and last maintenance date |
| 3 | `GET /vehicles/?office=&is_active=&make=&model=&maintenance_date_from=&maintenance_date_to=&mechanic_certification=` | Vehicle search; all filters optional and combinable |
| 4 | `GET /vehicles/{id}/` | Vehicle with its office and full maintenance history, including each mechanic |
| 5 | `GET /vehicles/{id}/maintenance-history/` | Paginated maintenance history, newest first |
| 6 | `POST /vehicles/{id}/assign/` with `{"office": <id>}` | Move a vehicle to another office |
| 7 | `GET /mechanics/workload/?year=` | Records and cost per mechanic for a year (default: current), busiest first |
| 8 | `GET /vehicles/needing-maintenance/` | Active vehicles never serviced or last serviced over 365 days ago, oldest first |
| 9 | `GET /vehicles/duplicate-check/?vin=&license_plate=&exclude_id=` | `{"conflicts": ["vin", "license_plate"]}` |

Example:

```bash
curl "http://localhost:8000/api/vehicles/?make=ford&is_active=true&maintenance_date_from=2026-01-01"
curl -X POST http://localhost:8000/api/vehicles/1/assign/ \
  -H "Content-Type: application/json" -d '{"office": 2}'
```

### Errors

| Status | When | Body |
| --- | --- | --- |
| 400 | Validation errors, invalid query parameters | `{"field": ["message"]}` or `{"non_field_errors": [...]}` |
| 404 | Unknown id | `{"detail": "..."}` |
| 409 | Deleting an office that still has vehicles or a mechanic who has records; a concurrent write that hits a database constraint | `{"detail": "Cannot delete this office: it is still referenced by 3 vehicles."}` |

## Project structure

```
backend/
├── server/                  settings, URLs, health check
└── fleet/
    ├── models.py            models, constraints, indexes and the report queries (QuerySet methods)
    ├── serializers.py       request validation and response shapes
    ├── filters.py           vehicle search, maintenance record filters, stable ordering
    ├── views.py             viewsets and custom actions
    ├── exceptions.py        409 responses for database conflicts
    ├── management/commands/seed_fleet.py
    └── tests/
```

## Assumptions

**Domain rules**
- A VIN is 17 characters without I, O or Q. VINs and plates are trimmed and stored in upper case.
- A plate is unique among **active** vehicles only. An inactive vehicle may keep a plate that was
  reissued, and reactivating it is rejected while another active vehicle holds the plate.
- An office name is unique within a city. Vehicle year is between 1900 and next year.
- Maintenance cannot be dated in the future and cost cannot be negative.
- Inactive mechanics cannot be assigned new maintenance, but their existing records stay editable.
- History is preserved: an office with vehicles or a mechanic with records cannot be deleted (409);
  deactivate them instead. Deleting a vehicle deletes its maintenance records.
- No authentication, as the brief states.

**Endpoints**
- **Office summary:** "last 12 months" means the last 365 days including today. Cost and last
  maintenance include work on the office's inactive vehicles, since that work was still done; the
  vehicle count includes only active vehicles. Returned as a plain list, like the brief's example.
- **Vehicle search:** make and model are exact, case-insensitive matches. The date range is
  inclusive. When dates and a mechanic certification are combined, they must match the **same**
  maintenance record ("serviced by this mechanic within these dates").
- **Assign vehicle:** "record only the new office assignment" is read as writing only the office
  (no assignment history), so a request cannot change other fields. Assigning the current office
  returns 400, and `PUT`/`PATCH` on a vehicle cannot change its office.
- **Mechanic workload:** "current year" is the calendar year, overridable with `?year=`. Mechanics
  without work are listed with zeros. Ties are broken by total cost, then name. Returned as a plain
  list.
- **Vehicles needing maintenance:** "more than 365 days ago" is strict, so a vehicle serviced
  exactly 365 days ago is not due yet. Never-serviced vehicles come first, as the oldest case.
- **Duplicate check:** a VIN conflicts with any vehicle, a plate only with an active one.
  `exclude_id` lets an edit form ignore the vehicle being edited ("another" vehicle in the brief).

## Design decisions and tradeoffs

**Query performance**
- **Office summary** uses one correlated subquery per figure. Joining vehicles and maintenance
  records in a single aggregate would repeat each vehicle once per record and inflate both the
  count and the sum. The whole report is one query with no outer `GROUP BY`.
- **Mechanic workload** uses `FilteredRelation`, which puts the year range in the `JOIN` condition,
  so only that year's records are joined and the `(mechanic, maintenance_date)` index applies.
- **Vehicle search** filters maintenance with `EXISTS` rather than a `JOIN`, so a vehicle with many
  matching records is returned once without `DISTINCT`.
- **Vehicle details** use `select_related` for the office and a `Prefetch` with `select_related`
  for records and mechanics: 2 queries regardless of history size, enforced by tests. Because the
  brief asks for the complete history in this response, its size grows with the history; the
  separate paginated history endpoint is the one to use for long lists.
- **Indexes:** `(vehicle, -maintenance_date)` serves history, last-maintenance and per-vehicle
  date filters; `(mechanic, maintenance_date)` serves workload; a functional index on
  `UPPER(make), UPPER(model)` serves case-insensitive search on PostgreSQL. The default
  single-column foreign-key indexes on maintenance records are disabled because the composite
  indexes already lead with those columns.

**Data integrity**
- Every business rule exists twice: as a database constraint (unique VIN, partial unique index on
  active plates, check constraints) and as serializer validation. The serializer gives a clear 400
  message; the constraint guarantees correctness when two requests race past validation, and that
  case is returned as a 409 instead of a 500.

**Structure**
- Query logic lives in QuerySet methods next to the models (`Office.objects.with_summary(today)`,
  `Vehicle.objects.needing_maintenance(today)`, …). They take the date or year as a parameter,
  which keeps views thin and makes boundaries testable. A separate service layer was not worth the
  indirection at this size.
- Each action picks its serializer (light list, nested detail, update without `office`, report
  shapes), so responses carry only what that endpoint needs.
- Errors keep DRF's standard shapes instead of a custom envelope; they are what DRF clients expect
  and already carry field-level messages.
- Lists use a stable ordering (primary key as tie-breaker) so pagination never repeats or skips
  rows.

**Operations**
- PostgreSQL in Docker for realistic constraint and index behaviour; SQLite fallback for a
  zero-setup local run. The test suite passes on both.
- Gunicorn (WSGI) rather than an ASGI server: the API is synchronous, so ASGI would add a thread
  hop per request without benefit.
- A single settings module configured through environment variables. Its defaults target local
  development (`DEBUG=True`, a development secret key), so a deployment must set them explicitly.

## Not included

- Front-end and demo video: this submission focuses on the back-end.
- JWT authentication (optional bonus in the brief).
- Continuous integration; the commands in [Running the tests](#running-the-tests) are what a
  pipeline would run.
