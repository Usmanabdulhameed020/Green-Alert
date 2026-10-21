# 📘 GreenAlert — The Complete Project Guide

This is the single, exhaustive reference for **everything** in the GreenAlert project: every folder, every file, every endpoint, every concept, and how all the pieces fit together.

If you read only one document, read this one.

> **Quick navigation**
> 1. [What is GreenAlert](#1-what-is-greenalert)
> 2. [Tech stack](#2-tech-stack)
> 3. [Repository layout](#3-repository-layout)
> 4. [How the frontend and backend connect](#4-how-the-frontend-and-backend-connect)
> 5. [Backend — every file explained](#5-backend--every-file-explained)
> 6. [Frontend — every file explained](#6-frontend--every-file-explained)
> 7. [Data model](#7-data-model)
> 8. [Authentication & roles end-to-end](#8-authentication--roles-end-to-end)
> 9. [The report lifecycle](#9-the-report-lifecycle)
> 10. [File uploads (Cloudinary)](#10-file-uploads-cloudinary)
> 11. [Maps & geocoding](#11-maps--geocoding)
> 12. [State, storage & configuration](#12-state-storage--configuration)
> 13. [Environment variables](#13-environment-variables)
> 14. [Running, building & deploying](#14-running-building--deploying)
> 15. [Known minor issues & dead code](#15-known-minor-issues--dead-code)
> 16. [Glossary](#16-glossary)

---

## 1. What is GreenAlert

GreenAlert is a **civic environmental reporting platform**. It connects three groups through one workflow:

- **Citizens** spot an environmental problem (illegal dumping, blocked drainage, oil spill, flooding, air/water pollution, waste overflow, road hazards, tree hazards), and file a report with a **photo**, a **map location**, a **category**, and a **priority**.
- **Agencies** (environmental organizations) receive reports **assigned to them by an admin**, travel to the location, do the work, and update the report's status — optionally attaching **resolution photos and notes** as proof.
- **Admins** oversee the whole platform: assign reports to the right agency, verify agency organizations, and manage users (ban/unban/delete).

Every report moves along one fixed pipeline:

```
Submitted → Under Review → Assigned → In Progress → Resolved → Closed
```

Community members can also browse all reports on an **Explore feed** and an interactive **Map**.

---

## 2. Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19, Vite 8 | Fast SPA with HMR |
| UI | Tailwind CSS v4, Framer Motion, lucide-react | Styling + animation + icons |
| Routing | React Router v7 | Client-side routing |
| HTTP | Axios | Talks to the API |
| Maps | MapLibre GL | Interactive satellite maps |
| Backend | Node.js, Express 5 | REST API |
| Database | MongoDB + Mongoose 9 | Documents, schemas, validation |
| Auth | JSON Web Token (JWT) + bcryptjs | Stateless auth + password hashing |
| Uploads | Cloudinary + multer | Image/video storage + CDN |
| Env validation | envalid | Fail-fast config |
| SEO | react-helmet-async | Per-page `<head>` tags |

---

## 3. Repository layout

```
GreenAlert/
├── README.md                       # Project intro + quick start
├── docker-compose.yml              # Optional container orchestration
├── docs/                           # All documentation (this file lives here)
│   ├── PROJECT_GUIDE.md            # ← you are here
│   ├── api_endpoints.md            # Endpoint reference
│   ├── system_architecture.md      # Architecture overview
│   ├── ARCHITECTURE_GUIDE.md       # File-by-file walkthrough
│   ├── frontend-backend-connection.md  # How the two halves talk
│   ├── explainers.md               # Map + role-system deep dives
│   ├── setup_and_deployment.md     # Run + deploy
│   └── presentation_slides.md      # Talk outline
│
├── client/                         # React frontend
│   ├── index.html                  # HTML shell
│   ├── vite.config.js              # Vite + dev proxy
│   ├── eslint.config.js            # Lint rules
│   ├── vercel.json                 # SPA rewrite for Vercel
│   ├── Dockerfile / .dockerignore  # Static-site container build
│   ├── package.json
│   ├── .env / .env.production      # VITE_* vars
│   ├── public/                     # Static files (incl. logo, 2 HTML docs)
│   └── src/
│       ├── main.jsx                # Entry: axios config + mount
│       ├── App.jsx                 # All routes + providers
│       ├── index.css               # Tailwind + custom theme
│       ├── assets/                 # Logo + hero images
│       ├── components/
│       │   ├── SEO.jsx
│       │   ├── auth/               # AuthLayout, EmailStep
│       │   ├── landing/            # 10 landing sections
│       │   ├── map/                # MapLibreMap, MapControls
│       │   └── ui/                 # Reusable primitives
│       ├── contexts/               # CitizenContext, ToastContext
│       ├── layouts/                # Dashboard/Admin/Agency shells
│       └── pages/                  # Public + 3 role dashboards
│
└── server/                         # Express backend
    ├── package.json
    ├── .env.example                # Template for .env
    ├── Dockerfile / .dockerignore  # node:20-alpine, `npm ci --only=production`
    ├── public/                     # Static files
    └── src/
        ├── server.js               # Process entry (connect + listen)
        ├── app.js                  # Express app + route mounting
        ├── config/                 # env, db, cloudinary, admin seed
        ├── models/                 # User, Report, Organization
        ├── middlewares/            # protect + authorize
        ├── controllers/            # Business logic
        └── routes/                 # URL → controller maps
```

---

## 4. How the frontend and backend connect

The two halves are **separate programs that only talk over HTTP with JSON**.

```
React (client/)  ──HTTP + JSON──►  Express (server/)  ──►  MongoDB
   :5173 (dev)         /api/v1/...       :5000              Cloudinary
```

### The four things that join them

1. **URLs** — the client only ever calls `/api/v1/...` paths.
2. **JSON shapes** — every response has an agreed structure (see the contract below).
3. **The JWT** — the client sends `Authorization: Bearer <token>` on every request; the server verifies it.
4. **The dev proxy / `VITE_API_URL`** — in dev Vite forwards `/api` to `localhost:5000`; in production `VITE_API_URL` points at the deployed API.

### The request path (line by line)

1. A page calls `axios.get('/api/v1/reports')`.
2. An **axios request interceptor** in `CitizenContext.jsx` adds the `Bearer` token from `localStorage`.
3. `app.js` runs global middleware: `cors` → `express.json` → `cookieParser` → static.
4. Express matches the URL to a **router** (`routes/*.js`).
5. Router middleware runs: `protect` (verify JWT, load user) then `authorize(...roles)` (check role).
6. The **controller** runs logic, queries MongoDB via a **model**, and calls `res.json(...)`.
7. Axios resolves with `res.data`; the page stores it in state; React re-renders.

### The response-shape contract

| Endpoint | Body |
|----------|------|
| `GET /api/v1/reports` | **bare array** |
| `GET /api/v1/reports/my-reports` | **bare array** |
| `GET /api/v1/reports/agency-reports` | **bare array** |
| `GET /api/v1/reports/:id` | **bare report object** |
| `POST /api/v1/reports` | **bare report object** |
| `GET /api/v1/auth/me` | `{ success, data: { user } }` |
| `POST /api/v1/auth/login` & `/register` & `/register-org` | `{ success, message, data: { token, user } }` |
| `GET /api/v1/admin/stats` | flat stats object |
| `GET /api/v1/admin/reports`, `/admin/organizations` | **bare arrays** |
| `GET /api/v1/admin/users` | `{ users, total, pages }` |
| `GET /api/v1/admin/reports/:id`, assign, verify, ban/unban | **bare document** |
| `POST /api/v1/upload` | `{ success, data: { urls, publicIds } }` |
| Any error (4xx/5xx) | `{ success: false, message }` |

> Whenever you add a feature, make sure both sides agree on the shape. This is the most common source of "API works but page is broken" bugs.

---

## 5. Backend — every file explained

### Entry points

**`server/src/server.js`** — the process entry point.
- Loads `.env` (`dotenv`) and validates it (`config/env.js`).
- Connects to MongoDB (`connectDB`), runs the admin seed (`seedAdmin`), then `app.listen(PORT)`.
- Registers graceful shutdown on `SIGINT`/`SIGTERM` (disconnect Mongoose, exit 0).

**`server/src/app.js`** — builds the Express app (importable in tests).
- Configures Cloudinary.
- Global middleware: `cors({ origin: true, credentials: true })`, `express.json()`, `express.urlencoded()`, `cookieParser()`, and `express.static('public')`.
- Mounts routers: `/api/v1/auth`, `/api/v1/reports`, `/api/v1/upload`, `/api/v1/admin`, `/api/v1/agency`, and health on `/api/v1`.
- `GET /` returns a welcome JSON.
- A final **error handler** converts all thrown errors (including multer errors) into JSON.

### Config (`server/src/config/`)

**`env.js`** — validates env with `envalid`. Required: `MONGODB_URI`, `JWT_SECRET`. Optional with defaults: `NODE_ENV`, `PORT` (5000), `JWT_EXPIRES_IN` (7d), three `CLOUDINARY_*` (default ''), `BCRYPT_SALT_ROUNDS` (12), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

**`database.js`** — `connectDB()` connects with 45s timeouts (Atlas-friendly); `getStatus()` maps Mongoose `readyState` to a string for the health check.

**`cloudinary.js`** — `configureCloudinary()` reads `CLOUDINARY_*` (warns and continues if missing); `checkStatus()` pings Cloudinary; exports the configured `cloudinary` instance.

**`adminSeed.js`** — idempotent admin bootstrap. Creates the admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` if missing, promotes an existing user to `admin` if needed, and updates the password if changed. Runs every boot.

### Models (`server/src/models/`)

**`User.js`** — `fullName`, `email` (unique, lowercase), `phone`, `password` (`select:false`, min 6), `role` (`citizen|agency|admin`, default citizen), `avatar`, `organizationId` (→ Organization, for agencies), `status` (`active|banned`), `banReason`, `bannedAt`, `bannedBy`, and a nested `settings` sub-document (`emailNotif`, `statusUpdates`, `publicReports`, `allowContact`, `language`, `defaultCategory`, `weeklyDigest`). Pre-save hook hashes the password with bcrypt (only when modified); `comparePassword()` method; `timestamps: true`.

**`Report.js`** — `title`, `description`, `location`, `latitude`, `longitude`, `category`, `status` (enum, default `Submitted`), `priority` (enum `Low|Medium|High|Critical`, default `Medium`), `user` (→ User, required), `assignedTo` (→ Organization), `imageUrl`, `images[]`, `resolutionImages[]`, `resolutionNotes`, `resolvedAt`. Adds a virtual `id` (hex string of `_id`) and `toJSON/toObject: { virtuals: true }` so the frontend can use `report.id`.

**`Organization.js`** — `name` (unique), `description`, `email`, `phone`, `address`, `website`, `category` (enum of 8 service types), `licenseNumber`, `licenseDocument`, `verified` (default false), `status` (`Active|Inactive|Suspended`, default Inactive), `user` (→ User, required). Virtual `id` + `toJSON/toObject` virtuals.

### Middleware (`server/src/middlewares/auth.middleware.js`)

- **`protect`** — authentication. Reads the token from the cookie **or** the `Authorization: Bearer` header, verifies it with `JWT_SECRET`, **loads the user from MongoDB**, rejects banned users with `403`, and attaches `req.user`. Because the role is re-read on every request, promotions/bans take effect immediately.
- **`authorize(...roles)`** — authorization. Returns a middleware that `403`s unless `req.user.role` is in the allowed list.

### Routes (`server/src/routes/`)

| File | Base | Guard | Endpoints |
|------|------|-------|-----------|
| `auth.routes.js` | `/api/v1/auth` | per-route | `POST /check-email`, `/register`, `/login`, `/logout`, `/register-org` (multer, 10MB, image/PDF). `GET /me`, `PATCH /me`, `DELETE /me`, `PATCH /me/password` (all `protect`). |
| `report.routes.js` | `/api/v1/reports` | `protect` on all | `GET /`, `/my-reports`, `/agency-reports`(+authorize agency,admin), `POST /`, `GET /:id`, `DELETE /:id`, `PATCH /:id/status`(+authorize) |
| `upload.routes.js` | `/api/v1/upload` | `protect` | `POST /` (multer `images`, max 5, 20MB, image/video) |
| `admin.routes.js` | `/api/v1/admin` | `protect`+`authorize('admin')` on all | `GET /stats`, `/reports`, `/reports/:id`, `PATCH /reports/:id/assign`, `GET /users`, `DELETE /users/:id`, `PATCH /users/:id/ban`, `/unban`, `POST /users/bulk-ban`, `GET /organizations`, `PATCH /organizations/:id/verify`, `DELETE /organizations/:id` |
| `agency.routes.js` | `/api/v1/agency` | `protect`+`authorize('agency')` on all | `GET /stats`, `/org`, `PATCH /org`, `PATCH /reports/:id/status` |
| `health.routes.js` | `/api/v1` | public | `GET /health` |

### Controllers (`server/src/controllers/`)

**`auth.controller.js`**
- `signToken(user)` signs `{ id: user._id }` with `JWT_SECRET`.
- `createSendToken(user, code, res, msg)` sets an `httpOnly` cookie and returns `{ success, message, data: { token, user } }` where `user` has `id, fullName, email, role, avatar, phone, organizationId`.
- `register` — create citizen (rejects reserved admin email, duplicate email).
- `checkEmail` — is the email used by a user or an org?
- `login` — verify password; block banned users; block **unverified agencies** with `{ awaitingVerification: true }`.
- `logout` — overwrite the cookie with a short-lived `loggedout` value.
- `getMe` — the logged-in user (includes `settings`).
- `updateProfile` — updates `fullName`, `phone`, `avatar`, `settings`.
- `deleteAccount` — deletes the user's organization (if agency), their reports, then the user.
- `registerOrg` — validates, optionally uploads the license to Cloudinary, creates an `agency` user then the (unverified) organization; if the org insert fails, the user is rolled back.
- `changePassword` — verifies the current password, then saves the new one (re-hashed by the model hook).

**`report.controller.js`**
- `getAllReports` (paginated, populated; sets `X-Total-Count`/`X-Total-Pages`), `getMyReports`, `getAgencyReports`.
- `getReportById`, `createReport` (validates required fields), `deleteReport` (**owner-only**, else 403), `updateReportStatus` (validates status, blocks changes to `Closed`, and — for agencies — **verifies the report is assigned to their org**; sets `resolvedAt`).

**`admin.controller.js`**
- `getStats` — one `Promise.all` of counts/aggregations powering the whole dashboard.
- `getUsers` (search + role filter + pagination → `{users,total,pages}`), `deleteUser` (cascade: reports + org + user), `banUser`, `unbanUser`, `bulkBanUsers`.
- `assignReport` — reads the report id from the URL param and `organizationId` from the body; sets `assignedTo` + status `Assigned`.
- `getOrganizations`, `verifyOrganization` (approve), `deleteOrganization` (also deletes the linked user).

**`agency.controller.js`**
- `getAgencyStats` — counts for the agency's assigned reports plus `reportsByCategory`, `reportsByPriority`, `reportsByMonth` (for dashboard charts).
- `getOrgProfile`, `updateOrgProfile` (description/phone/address/website).
- `updateReportStatus` — allows `In Progress|Resolved|Closed`; enforces the report belongs to this agency and isn't `Closed`.

**`health.controller.js`** — combines DB status + Cloudinary ping + uptime + timestamp. `200` when DB connected, else `500`.

---

## 6. Frontend — every file explained

### Core

- **`main.jsx`** — reads `VITE_API_URL` into `axios.defaults.baseURL`; sets `withCredentials = true`; mounts `<App/>` in `StrictMode`.
- **`App.jsx`** — provider stack (`BrowserRouter > HelmetProvider > ToastProvider > CitizenProvider > ErrorBoundary`) and the entire route table (below).
- **`index.css`** — Tailwind v4 import (`@import "tailwindcss"`), an `@theme` block with custom colors + Inter font, custom scrollbar, and global resets.

### Providers / contexts

- **`contexts/CitizenContext.jsx`** — the "session brain": `user`, `token`, `authInitialized`, `reports`, `allReports`, `savedReports`, `settings`; installs the axios auth interceptor; revalidates via `/auth/me` on load; exposes `updateUser`, `updateSettings`, `deleteAccount`, `createReport`, `deleteReport`, `fetchAllReports`, `toggleSaveReport`, `getReportDetails`, `logout`.
- **`contexts/ToastContext.jsx`** — global toasts (`success/error/warning/info`), auto-dismissed by timers.

### Layouts

- **`layouts/DashboardLayout.jsx`** — citizen shell (sidebar + mobile drawer + bottom nav) → `<Outlet/>`.
- **`layouts/AdminLayout.jsx`** — admin shell (dark sidebar).
- **`layouts/AgencyLayout.jsx`** — agency shell (amber sidebar).

### Reusable UI (`components/ui/`)

`ProtectedRoute` (role guard, spinner while `authInitialized`), `ToastContainer`, `StatusBadge` (status color map), `LoadingSkeleton` (variants: card/table/list/profile/report-card/dashboard), `EmptyState`, `ErrorState`, `ErrorBoundary`, `TiltCard` (now a no-op wrapper).

### Map (`components/map/`)

- **`MapLibreMap.jsx`** — see [§11](#11-maps--geocoding).
- **`MapControls.jsx`** — `MapSearchBar` (debounced Nominatim search), `LocateMeButton` (geolocation), `MapThemeToggle` (**stub → null**), `FullscreenToggle`.

### Landing (`components/landing/`)

`Navbar`, `Hero`, `Stats`, `HowItWorks`, `ProblemSolution`, `Categories`, `Partners`, `Testimonials`, `CTA`, `Footer`, and `ScrollUI` (named exports `ScrollProgress`, `BackToTop`). All are **static/marketing** components — no API calls. `Footer`'s newsletter form is non-functional (just `preventDefault`).

### Other components

- **`components/SEO.jsx`** — sets title/description/OG/Twitter tags via `react-helmet-async`.
- **`components/auth/AuthLayout.jsx`** — centered auth card wrapper.
- **`components/auth/EmailStep.jsx`** — the reusable "enter your email" step.

### Public pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `Home.jsx` | Landing composition |
| `/login` | `Login.jsx` | 2-step login; redirects by role |
| `/signup` | `Signup.jsx` | Citizen registration |
| `/register-org` | `OrgRegister.jsx` | 4-step agency registration wizard |
| `/privacy` | `PrivacyPolicy.jsx` | Static |
| `/terms` | `Terms.jsx` | Static |
| `*` | `NotFoundPage.jsx` | 404 |
| `/report` | — | redirects to `/citizen-dashboard/create-report` |

### Citizen dashboard (`pages/dashboard/`)

| Route | File | Purpose |
|-------|------|---------|
| `/citizen-dashboard` | `DashboardHome.jsx` | Stats, bar chart, tips, recent reports |
| `my-reports` | `MyReports.jsx` | Filter/sort user's reports |
| `reports/:id` | `ReportDetails.jsx` | Report detail + workflow tracker |
| `create-report` | `CreateReport.jsx` | 7-step report wizard + uploads |
| `explore` | `ExploreReports.jsx` | Community report feed |
| `map` | `MapPage.jsx` | Map of all reports + filters + hotspots |
| `saved` | `SavedReports.jsx` | Bookmarked reports (local) |
| `profile` | `ProfilePage.jsx` | Profile + change password |
| `settings` | `SettingsPage.jsx` | Account/security/notifications/privacy |

### Admin dashboard (`pages/admin/`)

| Route | File | Purpose |
|-------|------|---------|
| `/admin` | `AdminDashboard.jsx` | Stats, breakdowns, recent users/reports |
| `reports` | `AdminReports.jsx` | All reports + assign |
| `reports/:id` | `AdminReportDetails.jsx` | Report detail + assign |
| `users` | `AdminUsers.jsx` | Search, ban/unban/delete, bulk ban |
| `organizations` | `AdminOrganizations.jsx` | Review/verify/delete orgs |
| `settings` | `AdminSettings.jsx` | Admin profile + notifications |

### Agency dashboard (`pages/agency/`)

| Route | File | Purpose |
|-------|------|---------|
| `/agency` | `AgencyDashboard.jsx` | Stats, charts, recent reports |
| `reports` | `AgencyReports.jsx` | Assigned reports + inline status |
| `reports/:id` | `AgencyReportDetails.jsx` | Detail + status update + resolution proof |
| `settings` | `AgencySettings.jsx` | Org profile, account, password |

### Endpoints used by the frontend (quick map)

- **Auth:** `/auth/check-email`, `/auth/register`, `/auth/login`, `/auth/register-org`, `/auth/logout`, `/auth/me` (GET/PATCH/DELETE), `/auth/me/password` (PATCH).
- **Reports:** `GET /reports`, `/reports/my-reports`, `/reports/agency-reports`, `/reports/:id`; `POST /reports`; `PATCH /reports/:id/status`; `DELETE /reports/:id`.
- **Upload:** `POST /upload`.
- **Admin:** `/admin/stats`, `/admin/reports`(+`/:id`, `/assign`), `/admin/users`(+`/:id`, ban/unban, bulk-ban), `/admin/organizations`(+`/:id/verify`, DELETE).
- **Agency:** `/agency/stats`, `/agency/org` (GET/PATCH), `/agency/reports/:id/status`.

---

## 7. Data model

Three collections. Relationships:

```
User ──(organizationId)──► Organization
 │                              ▲
 │ reports.user                 │ reports.assignedTo
 ▼                              │
Report ────────────────────────┘
```

- A **User** may own many **Reports** (`reports.user`).
- A **Report** may be assigned to one **Organization** (`reports.assignedTo`).
- An **Organization** belongs to one **User** (`organization.user`) — the agency account.

See [§5 Models](#models-serversrcmodels) for field-by-field detail.

---

## 8. Authentication & roles end-to-end

### Register / login

1. Client posts credentials.
2. Server verifies; signs a JWT containing **only `{ id }`**; sets an `httpOnly` cookie; returns the token + a trimmed user object.
3. Client stores `greenalert_token` + `greenalert_user` in `localStorage`.

### Every subsequent request

1. The axios interceptor adds `Authorization: Bearer <token>`.
2. `protect` verifies the token, **reloads the user from the DB**, blocks banned users, attaches `req.user`.
3. `authorize(...roles)` checks the role for restricted routes.

### Why the role is not in the token

Because `protect` reloads the user every request, the current role and ban status are always honored instantly — no token revocation list required.

### Role → dashboard

| Role | Dashboard | Guard |
|------|-----------|-------|
| citizen | `/citizen-dashboard` | `ProtectedRoute roles={['citizen']}` |
| agency | `/agency` | `roles={['agency']}` |
| admin | `/admin` | `roles={['admin']}` |

The client guard is **UX only**; the server enforces the real rules.

### Agency verification gate

- Agency registers at `/register-org` → creates an unverified Organization.
- Login returns `403 { awaitingVerification: true }` until an admin calls `PATCH /admin/organizations/:id/verify`.

### Session persistence

On page load, `CitizenContext` calls `GET /auth/me`; if the token is invalid it is cleared and the user is logged out.

---

## 9. The report lifecycle

1. **Citizen** creates a report (`CreateReport.jsx`): uploads photos (`POST /upload` → Cloudinary URLs), fills details, sets location from the map/GPS. Status starts `Submitted`.
2. **Admin** assigns it (`PATCH /admin/reports/:id/assign`) → `assignedTo` set, status `Assigned`.
3. **Agency** sees it (`/agency-reports`) and advances it: `In Progress` → `Resolved`/`Closed` (`PATCH /agency/reports/:id/status`), optionally attaching `resolutionImages` + `resolutionNotes`.
4. **Citizen** sees updates on `ReportDetails`.

Status colors (from `StatusBadge`): Submitted (blue), Under Review (yellow), Assigned (purple), In Progress (orange), Resolved (emerald), Closed (slate).

---

## 10. File uploads (Cloudinary)

```
Browser file → POST /api/v1/upload
             → multer (in-memory, ≤5 files, 20MB, image/video)
             → cloudinary.uploader.upload_stream (folder "greenalert")
             → returns { secure_url }
             → client stores the URL on the report
```

- The license document for agencies goes through `/auth/register-org` (multer `licenseDocument`, ≤10MB, image/PDF) into Cloudinary folder `greenalert/licenses`.
- Only **URLs** are stored in MongoDB.
- If Cloudinary creds are missing, the server still boots; only uploads fail.

---

## 11. Maps & geocoding

### Rendering — `MapLibreMap.jsx`

MapLibre draws whatever **style** you give it. This project uses three free **raster** tile sources (no API key): Google Hybrid (default), Google Pure Satellite, and Esri Satellite (with transportation + labels overlays). A dropdown switches between them via `map.setStyle`.

Markers are a **GeoJSON source + layers**, not DOM elements:
- `markers` → `FeatureCollection`; optional clustering (circle + count + unclustered layers) with click-to-expand and popups.
- `onMarkerClick(id)` lets pages navigate to a report.
- A "sonar pulse" layer animates recent/critical markers with `requestAnimationFrame`.

Key props: `markers`, `center`, `zoom`, `clusterMarkers`, `fitBoundsToMarkers`, `onClick`, `onMarkerClick`, `static`, `showControls`, `children`, `onMapLoad`.

### Geocoding — `MapControls.jsx` & `CreateReport.jsx`

- Search uses the free **Nominatim** API (debounced 400ms).
- "Locate me" uses `navigator.geolocation`.
- `CreateReport` reverse-geocodes a pin → address via Nominatim, with a BigDataCloud fallback.

---

## 12. State, storage & configuration

### State management

No Redux. Shared session + report state lives in `CitizenContext`; everything else is local component state fetched per page.

### localStorage keys

| Key | Holds |
|-----|-------|
| `greenalert_token` | JWT |
| `greenalert_user` | user object |
| `greenalert_settings` | user settings |
| `ga_saved_<userId>` | bookmarked report ids |

### Client config

- `vite.config.js` — React + Tailwind plugins and the `/api` dev proxy → `http://localhost:5000`.
- `eslint.config.js` — Vite defaults + `react-hooks/set-state-in-effect` and `react-hooks/exhaustive-deps` turned off (with comments).
- `vercel.json` — rewrites all paths to `/index.html` (SPA hosting).

---

## 13. Environment variables

### Backend (`server/.env`)

| Var | Notes |
|-----|-------|
| `NODE_ENV` | development/production/test |
| `PORT` | default 5000 |
| `MONGODB_URI` | **required** |
| `JWT_SECRET` | **required** |
| `JWT_EXPIRES_IN` | default 7d |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | leave blank to disable uploads |
| `BCRYPT_SALT_ROUNDS` | default 12 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seeds/promotes the admin on boot |

### Frontend (`client/.env`)

| Var | Notes |
|-----|-------|
| `VITE_API_URL` | API base; blank in dev (uses proxy) |
| `VITE_MAPTILER_KEY` | **unused** (map uses free tiles) |
| `VITE_GOOGLE_CLIENT_ID` | **unused** (no social login) |

---

## 14. Running, building & deploying

### Develop

```bash
# Terminal 1 — backend
cd server && npm install && npm run dev      # http://localhost:5000

# Terminal 2 — frontend
cd client && npm install && npm run dev      # http://localhost:5173
```

### Build & deploy

- **Frontend:** `npm run build` → static `dist/`. Deploy to Netlify/Vercel/Render static; set `VITE_API_URL` to the deployed API **before building**.
- **Backend:** deploy `server/` to Render/Railway as a Web Service; set env vars; start `npm start`.
- **Database:** MongoDB Atlas; **Uploads:** Cloudinary.

Full details: [setup_and_deployment.md](setup_and_deployment.md).

---

## 15. Known minor issues & dead code

These are not crashes — they're cleanup items / rough edges found during a full pass:

1. **`MapThemeToggle`** in `MapControls.jsx` is a stub that returns `null`.
2. **`TiltCard`** is a deliberate no-op wrapper.
3. **Login/register response has no `settings`** while `getMe` does; harmless, but slightly inconsistent.
4. **Marketing copy is static** (stats, testimonials, report counts are hardcoded).
5. **`createSendToken` returns `user.id`** (not `_id`) — the client consistently uses `.id`, so this is fine, just worth knowing.
6. **`deleteOrganization`** deletes the org's linked user but leaves any reports assigned to it with a dangling `assignedTo` reference.
7. **Two untracked HTML docs** exist in `client/public/` (`GreenAlert_PRD.html`, `GreenAlert_Server_Deep_Dive.html`) — they may describe older features.

> Previously listed dead anchors (`#ai`, `#map`, `#reports`) and the Hero `<a href="/signup">` full-reload link have been **fixed**.

> A full lint + build + server-load pass currently reports **0 errors** (client ESLint clean, Vite build of 2296 modules succeeds, all 20 server files load).

---

## 16. Glossary

| Term | Meaning |
|------|---------|
| **JWT** | JSON Web Token — a signed string proving who you are; here it contains only the user id |
| **protect** | Backend middleware that authenticates a request (verifies JWT, loads user) |
| **authorize** | Backend middleware that checks the user's role against an allow-list |
| **Organization** | The agency's profile record; must be `verified` before the agency can log in |
| **Status pipeline** | `Submitted → Under Review → Assigned → In Progress → Resolved → Closed` |
| **Priority** | `Low / Medium / High / Critical` |
| **GeoJSON** | A JSON format for geographic features, used for map markers |
| **Marker clustering** | Grouping nearby map points into one bubble that expands on click |
| **Cloudinary** | External CDN that stores uploaded images/videos and returns URLs |
| **Multer** | Express middleware that parses `multipart/form-data` file uploads |
| **Mongoose** | MongoDB ODM — defines schemas, validation, and models |
| **Interception** | Axios hook that runs on every request (here: attach the JWT) |
| **Outlet** | React Router placeholder where a layout renders its child route |
| **ProtectedRoute** | Client-side component that redirects users who aren't logged in / lack the role |

---

> **Summary:** GreenAlert is a MERN app where a React SPA talks to an Express/MongoDB API over JSON, authenticating with a JWT that the server revalidates on every request. Citizens file reports (with photos + map pins), admins assign them to verified agencies, and agencies resolve them along a fixed status pipeline — all rendered through three role-specific dashboards plus a shared Explore feed and MapLibre map.
