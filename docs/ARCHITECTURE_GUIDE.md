# 🧭 Architecture Guide (File-by-File Walkthrough)

This guide walks through GreenAlert one file at a time. It is meant for anyone presenting or maintaining the project: read the section for a folder, then open the file to see the code.

Two rules of thumb before you start:

1. **The server is the source of truth.** The client can be bypassed; the server decides what is actually allowed.
2. **Data flows one way.** UI → Axios → route → middleware → controller → model → MongoDB, then JSON back to the UI.

---

## 1. Server Entry Points

### `server/src/server.js`
The process entry point.
- Loads `.env` with `dotenv`, then validates it with `require('./config/env')`.
- Connects to MongoDB (`connectDB`) and seeds the admin account (`seedAdmin`).
- Starts listening on `PORT` (default `5000`).
- Registers `SIGINT`/`SIGTERM` handlers that cleanly disconnect Mongoose before exiting.

### `server/src/app.js`
Builds the Express application (separate from `server.js` so it can be imported in tests).
- Configures Cloudinary once.
- Applies global middleware: `cors` (credentials on), `express.json`, `express.urlencoded`, `cookieParser`, and static files from `public/`.
- Mounts every router under `/api/v1`:
  - `/auth`, `/reports`, `/upload`, `/admin`, `/agency`, plus health on `/api/v1`.
- Exposes a friendly `GET /` welcome JSON.

---

## 2. Configuration (`server/src/config/`)

### `env.js`
Validates required environment variables using `envalid`. If a required variable is missing, the app fails fast at startup with a clear message instead of crashing later.

### `database.js`
- `connectDB()` — connects to MongoDB with generous timeouts (45s server selection) so Atlas cold starts don't fail.
- `getStatus()` — maps Mongoose's numeric `readyState` to a readable string (`connected`, `disconnected`, …) for the health check.

### `cloudinary.js`
- `configureCloudinary()` — reads `CLOUDINARY_*` from env and configures the SDK. Returns `false` (and warns) if credentials are missing, so the server can still boot without uploads.
- `checkStatus()` — pings Cloudinary for the health endpoint.
- Exports the configured `cloudinary` instance used by the upload route.

### `adminSeed.js`
Idempotent admin bootstrap. Given `ADMIN_EMAIL` / `ADMIN_PASSWORD`:
- If the user doesn't exist → create an `admin`.
- If the user exists → promote to `admin` and update the password if it changed.
Runs on every startup, so it's safe to restart.

---

## 3. Models (`server/src/models/`)

Mongoose schemas define both shape and behavior.

### `User.js`
Fields: `fullName`, `email` (unique, lowercased), `phone`, `password` (`select: false` so it's never returned by default), `role` (`citizen`/`agency`/`admin`), `avatar`, `organizationId`, `status` (`active`/`banned`) + ban metadata, and a `settings` sub-document.
- Pre-save hook hashes the password with bcrypt (only when modified).
- `comparePassword()` method for login.
- `toJSON` strips the password.

### `Report.js`
Fields: `title`, `description`, `location`, `latitude`, `longitude`, `category`, `status` (default `Submitted`), `priority`, `user`, `assignedTo`, `imageUrl`, `images[]`, `resolutionImages[]`, `resolutionNotes`, `resolvedAt`.
- `status` and `priority` are `enum`-constrained, so only valid values can be saved.
- Adds a virtual `id` (string form of `_id`) so the frontend can use `report.id`.

### `Organization.js`
Fields: `name` (unique), `description`, contact details, `category` (fixed list of environmental service types), `licenseNumber`, `licenseDocument`, `verified` (default `false`), `status` (`Active`/`Inactive`/`Suspended`), and `user` (the linked agency account).

---

## 4. Middleware (`server/src/middlewares/auth.middleware.js`)

A tiny file with outsized importance.

- **`protect`** — the authentication gate:
  1. Reads the token from the cookie or the `Authorization: Bearer` header.
  2. Verifies it with `JWT_SECRET`.
  3. Loads the user from the DB (so role/ban status are always current).
  4. Rejects banned users with `403`.
  5. Attaches `req.user` and calls `next()`.
- **`authorize(...roles)`** — the authorization gate: returns `403` unless `req.user.role` is in the allowed list.

Read these two functions first when explaining the security model.

---

## 5. Routes (`server/src/routes/`)

Routers are thin: they map URLs to controllers and attach guards. No logic lives here.

- `auth.routes.js` — register, login, logout, org registration (multer for the license file), and `/me` management.
- `report.routes.js` — all report CRUD. Applies `protect` to the whole router; `agency-reports` and status updates also require `authorize('agency','admin')`.
- `upload.routes.js` — `protect` + multer (max 5 files, 20 MB each) → Cloudinary.
- `admin.routes.js` — `protect` + `authorize('admin')` for the whole router.
- `agency.routes.js` — `protect` + `authorize('agency')`.
- `health.routes.js` — public health check.

**Pattern to note:** `router.use(protect)` at the top of a file protects every route in that file; role checks are added per-route or for the whole file.

---

## 6. Controllers (`server/src/controllers/`)

Controllers hold the business logic.

### `auth.controller.js`
- `checkEmail` — is this email taken?
- `register` — create a citizen; hash password via the model; sign a JWT.
- `login` — verify credentials; block unverified agencies (`awaitingVerification`) and banned users; sign a JWT; set the cookie.
- `registerOrg` — create an agency user + unverified organization; accept the uploaded license document URL.
- `logout` / `getMe` / `updateMe` / `deleteMe` / `updatePassword`.
- Helper to sign tokens (`{ id }`) and set the cookie.

### `report.controller.js`
- `getAllReports` (paginated, populated), `getMyReports`, `getAgencyReports`.
- `getReportById`, `createReport`, `deleteReport` (owner-only), `updateReportStatus` (validates status; sets `resolvedAt`).

### `admin.controller.js`
- `getStats` — a single `Promise.all` of counts/aggregations powers the whole admin dashboard.
- `getUsers` (search + role filter + pagination), `deleteUser`, `banUser`, `unbanUser`, `bulkBanUsers`.
- `assignReport` — sets `assignedTo` and status `Assigned` (report id comes from the URL, organization id from the body).
- `getOrganizations`, `verifyOrganization` (approve), `deleteOrganization` (also deletes the linked user).

### `agency.controller.js`
- `getAgencyStats` — counts for the logged-in agency's assigned reports.
- `getOrgProfile` / `updateOrgProfile`.
- `updateReportStatus` — enforces that the report is assigned to *this* agency and not already `Closed`.

### `health.controller.js`
Combines database status and Cloudinary ping into one JSON health report.

---

## 7. Client Entry & Routing

### `client/src/main.jsx`
- Sets Axios `baseURL` from `VITE_API_URL` (blank in dev, so requests go through the Vite proxy).
- `axios.defaults.withCredentials = true` so cookies flow.
- Mounts `<App />` in React `StrictMode`.

### `client/src/App.jsx`
The route table. Public routes (Home, Login, Signup, OrgRegister, Privacy, Terms) plus three guarded dashboard trees:
- `/citizen-dashboard/*` guarded by `ProtectedRoute roles={['citizen']}` + `DashboardLayout`.
- `/admin/*` guarded by `roles={['admin']}` + `AdminLayout`.
- `/agency/*` guarded by `roles={['agency']}` + `AgencyLayout`.
Wrapped in `HelmetProvider` (SEO), `ToastProvider`, `CitizenProvider` (session), and `ErrorBoundary`.

### `client/src/components/ui/ProtectedRoute.jsx`
Client-side guard: waits for `authInitialized`, redirects unauthenticated users to `/login`, and redirects wrong-role users to their own dashboard. UX only — the server enforces the real rules.

---

## 8. State & Contexts (`client/src/contexts/`)

### `CitizenContext.jsx`
The session brain of the frontend.
- Holds `user`, `token`, `authInitialized`, `settings`, plus `reports`, `allReports`, `savedReports`.
- An **Axios request interceptor** attaches `Authorization: Bearer <token>` from `localStorage`.
- On load, calls `/auth/me` to revalidate the session and keep each role on its own dashboard.
- Exposes helpers: `updateUser`, `updateSettings`, `deleteAccount`, `createReport`, `deleteReport`, `fetchAllReports`, `toggleSaveReport`, `getReportDetails`, `logout`.
- Saved reports are bookmarked in `localStorage` under `ga_saved_<userId>`.

### `ToastContext.jsx`
Small global toast system (success/error/info) rendered by `ToastContainer`.

---

## 9. Layouts (`client/src/layouts/`)

- `DashboardLayout.jsx` — citizen shell: sidebar + topbar + `<Outlet />`. Sidebar links to dashboard, my reports, create report, explore, map, saved, profile, settings.
- `AdminLayout.jsx` — admin shell: dashboard, reports, users, organizations, settings.
- `AgencyLayout.jsx` — agency shell: dashboard, reports, settings.

Each layout shows the signed-in user's name and a logout action, and renders the active page via React Router's `<Outlet />`.

---

## 10. Pages (`client/src/pages/`)

### Public
- `Home.jsx` — assembles the landing sections (`components/landing/*`).
- `Login.jsx` / `Signup.jsx` — use the shared `components/auth` layout and `EmailStep`.
- `OrgRegister.jsx` — multi-field agency registration with license upload.
- `PrivacyPolicy.jsx`, `Terms.jsx`, `NotFoundPage.jsx`.

### Citizen (`pages/dashboard/`)
- `DashboardHome.jsx` — stat cards, recent reports, a CSS bar chart of report status, quick actions.
- `MyReports.jsx` — the user's own reports with status filters.
- `ReportDetails.jsx` — full report view with status timeline and map.
- `CreateReport.jsx` — the main submission form: category picker, priority, location (map picker + geocoding), and image upload to Cloudinary.
- `ExploreReports.jsx` — browse all public reports with search/filter.
- `MapPage.jsx` — all reports on a MapLibre map; clicking a marker opens the report.
- `SavedReports.jsx` — bookmarked reports (from `localStorage`).
- `ProfilePage.jsx` / `SettingsPage.jsx` — profile editing and preference toggles.

### Admin (`pages/admin/`)
- `AdminDashboard.jsx` — KPI cards, status/category/priority breakdowns, monthly chart, recent users, pending organizations, mini map.
- `AdminReports.jsx` / `AdminReportDetails.jsx` — all reports; assign to an organization; inspect a report.
- `AdminUsers.jsx` — search users, ban/unban, delete, bulk ban.
- `AdminOrganizations.jsx` — review and verify (or delete) agencies.
- `AdminSettings.jsx` — admin profile settings.

### Agency (`pages/agency/`)
- `AgencyDashboard.jsx` — assigned-report KPIs and recent activity.
- `AgencyReports.jsx` / `AgencyReportDetails.jsx` — the agency's assigned reports; move status to In Progress / Resolved / Closed and add resolution notes/photos.
- `AgencySettings.jsx` — organization profile editing.

---

## 11. Components

### `components/map/`
- `MapLibreMap.jsx` — wraps MapLibre GL: loads a map style (MapTiler key from `VITE_MAPTILER_KEY`), plots report markers, handles marker clicks (`onMarkerClick`), and supports recentering.
- `MapControls.jsx` — zoom / locate / reset controls.

### `components/ui/`
Reusable primitives: `TiltCard`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `StatusBadge`, `ToastContainer`, `ProtectedRoute`, `ErrorBoundary`. These keep pages consistent and small.

### `components/landing/` and `components/auth/`
Landing page sections (Hero, Categories, HowItWorks, Stats, Testimonials, CTA, Footer, Navbar, …) and the shared auth form scaffolding.

### `components/SEO.jsx`
Per-page `<title>` / meta tags via `react-helmet-async`.

---

## 12. Where to Look When…

| Question | Open this |
|----------|-----------|
| Who is logged in / how sessions work | `contexts/CitizenContext.jsx` + `middlewares/auth.middleware.js` |
| How a report is created | `pages/dashboard/CreateReport.jsx` + `controllers/report.controller.js` |
| How uploads work | `routes/upload.routes.js` + `config/cloudinary.js` |
| How assignment works | `controllers/admin.controller.js` (`assignReport`) |
| How status changes | `controllers/agency.controller.js` (`updateReportStatus`) |
| How the map renders | `components/map/MapLibreMap.jsx` |
| How routes are wired | `App.jsx` (client) + `app.js` (server) |
