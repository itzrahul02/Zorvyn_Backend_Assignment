API Reference — Zorvyn Backend

This is a compact reference for the backend API used by the Zorvyn finance dashboard.

Base URL (local): http://localhost:5000

Authentication
- POST /api/auth/login — body `{ email, password }` → returns `{ token, user }`.
- Provide protected endpoints with header `Authorization: Bearer <JWT>`.

User / Roles
- GET /api/me — current user from token
- GET /api/users — admin only, list users
- POST /api/users — admin only, create user `{ email, password, name, role?, status? }`
- PATCH /api/users/:id — admin only, update `name`, `role`, `status`

Dashboard
- GET /api/dashboard/summary — viewer, analyst, admin — totals, net balance, category breakdown
- GET /api/dashboard/recent?limit=10 — viewer, analyst, admin — recent transactions (limit up to 50)
- GET /api/dashboard/trends?groupBy=month|week&span=12 — viewer, analyst, admin — aggregated series

Transactions
- GET /api/transactions?page=&limit=&type=&category=&dateFrom=&dateTo=&q= — analyst, admin
- GET /api/transactions/:id — analyst, admin
- POST /api/transactions — admin only — body: `{ amount, type, category, date, notes? }`
- PATCH /api/transactions/:id — admin or analyst (analyst only edits own records)
- DELETE /api/transactions/:id — admin only (soft delete)
- POST /api/transactions/bulk — admin only — `{ records: [ ... ] }` (partial success returns 207)

Validation / Errors
- Uses `express-validator`. Error responses are JSON `{ error: string, details?: array }` with appropriate status codes (400/401/403/404/409/500).

Demo accounts (seeded)
- Admin: `admin@example.com` / `adminadmin`
- Analyst: `analyst@example.com` / `analyst12`
- Viewer: `viewer@example.com` / `viewer1234`

Notes
- Viewer role is intentionally restricted to dashboard endpoints (no transaction list/read). Analysts can view and create transactions; admins manage everything.
