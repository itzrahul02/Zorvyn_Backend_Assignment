# Zorvyn — Finance dashboard (MERN)

**Swagger API Docs:** `http://localhost:5000/docs`  
**Bearer token generator (dev only):** `http://localhost:5000/dev/tokens`

Backend API for financial records with **role-based access control (RBAC)**, **dashboard aggregations**, and a **React** client. Stack: **Node.js**, **Express**, **MongoDB** (Mongoose), **React** (Vite).

## Prerequisites

- Node.js 18+ (uses `import` / top-level `await` in the backend entrypoint)
- MongoDB 4.4+ running locally or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string

## Quick start

### 1. Database

Start MongoDB locally, or create a cluster and copy the connection URI.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI and JWT_SECRET
npm install
npm run seed
npm run dev
```

The API listens on `http://localhost:5000` by default. Health check: `GET /api/health`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Optional: set VITE_API_URL if the API is not on http://localhost:5000
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`).

### Preparing for submission

- Ensure `.env` files are configured in `backend` and `frontend`. Example files are provided as `.env.example` in each folder.
- Verify seeded demo accounts and roles:
	- `cd backend && npm run seed`
	- If roles appear swapped, fix with: `cd backend && npm run fix-roles`
- Run smoke tests to validate endpoints and RBAC: `cd backend && npm run smoke`
- Start the servers for manual verification:
```bash
cd backend
npm run dev

cd frontend
npm run dev
```

When preparing a submission zip or repo pointer, include:
- A short `API.md` (this repo includes one at the project root)
- Notes in the README about any deviations or assumptions
- Command list to reproduce locally (seed, start servers, smoke tests)

### Demo accounts (after `npm run seed`)

| Role    | Email              | Password   |
| ------- | ------------------ | ---------- |
| Admin   | `admin@example.com` | `adminadmin` |
| Analyst | `analyst@example.com` | `analyst12` |
| Viewer  | `viewer@example.com`  | `viewer1234` |

Override the admin email/password in `.env` with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before seeding.

## API overview

All protected routes expect a header: `Authorization: Bearer <JWT>` (except login).

| Method | Path | Roles | Description |
| ------ | ---- | ----- | ----------- |
| GET | `/api/health` | — | Liveness |
| POST | `/api/auth/login` | — | `{ email, password }` → JWT + user |
| GET | `/api/me` | any | Current user from token |
| GET | `/api/dashboard/summary` | viewer, analyst, admin | Totals, net balance, category breakdown |
| GET | `/api/dashboard/recent?limit=` | viewer, analyst, admin | Recent transactions |
| GET | `/api/dashboard/trends?groupBy=month\|week&span=` | viewer, analyst, admin | Aggregated trends |
| GET | `/api/transactions` | analyst, admin | List with pagination, filters (`type`, `category`, `dateFrom`, `dateTo`, `q`) |
| GET | `/api/transactions/:id` | analyst, admin | Single transaction |
| POST | `/api/transactions` | admin | Create |
| PATCH | `/api/transactions/:id` | admin | Update |
| DELETE | `/api/transactions/:id` | admin | Soft delete (`isDeleted`) |
| GET | `/api/users` | admin | List users |
| POST | `/api/users` | admin | Create user |
| PATCH | `/api/users/:id` | admin | Update name, role, status |

**Error responses:** JSON `{ error: string, details?: array }` with appropriate HTTP status codes (`400`, `401`, `403`, `404`, `409`, `500`).

## RBAC model

| Role | Capabilities |
| ---- | ------------ |
| **viewer** | Dashboard summaries only (no raw transaction list, no mutations) |
| **analyst** | Read transactions + dashboard |
| **admin** | Full transaction CRUD + user management |

## Assumptions

- A single **global** transaction pool (no per-user data isolation). All analysts/admins see the same records; **viewer** sees only aggregated dashboard data.
- **Soft delete** for transactions (`isDeleted`, `deletedAt`) instead of hard delete.
- **JWT** stored in `localStorage` on the client (acceptable for a demo; production apps often prefer HttpOnly cookies + CSRF strategy).
- Currency display uses **USD** formatting in the UI; amounts are stored as numbers without a currency field.

## Tradeoffs

- **Global vs per-user transactions:** Chosen for simpler grading and aggregation. Multi-tenant or “my transactions only” would add `ownerId` or scoped queries everywhere.
- **RBAC in middleware vs per-route:** Centralized `requireCapability` keeps routes readable; roles are enumerated in one place (`rbac.js`).
- **Dashboard trends:** Implemented with `$year` / `$month` / `$isoWeek` aggregation for broad MongoDB compatibility instead of `$dateTrunc` (MongoDB 5+).
- **Rate limiting:** Applied to `/api/auth` to reduce brute-force login attempts; global API limits can be added similarly.

## Optional enhancements included

- Soft delete for transactions
- Pagination and search/filter on transaction list
- Rate limiting on auth routes
- Helmet + CORS for basic API hardening

## Project layout

```
backend/src   — Express app, routes, middleware, services, models
frontend/src  — React (Vite), pages, API client, auth context
```

## License

This project is provided as sample application code for assignment or learning use.
