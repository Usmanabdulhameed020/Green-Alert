# 🎤 GreenAlert — Presentation Master

> **Purpose:** the single document that prepares you to present and defend **everything** in GreenAlert. If a file, concept, flow, or question could come up, it is here.
>
> Read this top-to-bottom once, then use §8 (Q&A bank) and §9 (demo script) the night before.

**Navigation**

1. [The 60-second pitch](#1-the-60-second-pitch)
2. [Numbers cheat-sheet](#2-numbers-cheat-sheet)
3. [Complete file index (every file)](#3-complete-file-index-every-file)
4. [Concept deep-dives](#4-concept-deep-dives)
5. [End-to-end flow walkthroughs](#5-end-to-end-flow-walkthroughs)
6. [The frontend ⇄ backend contract](#6-the-frontend--backend-contract)
7. [Data model](#7-data-model)
8. [Viva / Q&A bank](#8-viva--qa-bank)
9. [Demo script](#9-demo-script)
10. [Troubleshooting (if the demo breaks)](#10-troubleshooting-if-the-demo-breaks)

---

## 1. The 60-second pitch

> "GreenAlert is a civic environmental reporting platform. A **citizen** spots a problem — illegal dumping, a blocked drain, an oil spill — and files a report with a photo, a map pin, a category, and a priority. An **admin** reviews it and assigns it to a verified **agency**. That agency travels to the site, fixes it, and moves the report through a fixed status pipeline — `Submitted → Under Review → Assigned → In Progress → Resolved → Closed` — attaching before/after photos as proof. Everyone can then browse all reports on an Explore feed and an interactive satellite **map**.
>
> It's built on the **MERN** stack: React 19 on the front, Express 5 + MongoDB on the back, JWT for auth, and Cloudinary for image storage. It's **deployed live**."

**One-line version:** "Citizens report, agencies resolve, admins oversee — on one transparent status pipeline."

---

## 2. Numbers cheat-sheet

Memorize these; they show you know your own codebase.

| Thing | Value |
|-------|-------|
| Roles | **3** — citizen, agency, admin |
| Status stages | **6** — Submitted → Under Review → Assigned → In Progress → Resolved → Closed |
| Priorities | **4** — Low, Medium, High, Critical |
| Report categories | **8** — Illegal Dumping, Blocked Drainage, Oil Spill, Air Pollution, Water Pollution, Flooding, Deforestation, Other |
| Organization categories | **8** — Waste Mgmt, Drainage & Flood Control, Oil & Chemical Spill Response, Air Quality Mgmt, Water Treatment, Parks & Forestry, Roads & Infrastructure, Multi-Purpose |
| Mongoose models | **3** — User, Report, Organization |
| Backend source files | **20** (excluding `server.js`) — all load clean |
| Route groups | **6** — auth, reports, upload, admin, agency, health |
| Max upload | **5 files, 20 MB each** (citizen evidence); **1 license, 10 MB** (agency) |
| JWT payload | **just `{ id }`** |
| JWT lifetime | **7 days** default |
| bcrypt rounds | **12** |
| Vite build | ~2296 modules, ~4 s |
| Map styles | **3** free raster sources (no API key) |
| Client libs of note | React 19, Vite 8, Tailwind v4, Router v7, Axios, Framer Motion, MapLibre GL, react-helmet-async, react-countup, use-debounce |

---

## 3. Complete file index (every file)

### 3.1 Root

| Path | Purpose |
|------|---------|
| `README.md` | Project intro, features, stack, quick start, docs index |
| `LICENSE` | MIT |
| `docker-compose.yml` | Optional container orchestration |
| `.gitignore` | Ignores `node_modules`, `.env`, builds, logs |
| `docs/*.md` | All documentation (see §3.4) |

### 3.2 `client/` (React frontend)

**Root files**

| Path | Purpose |
|------|---------|
| `index.html` | HTML shell; mounts `#root`, loads `/src/main.jsx` |
| `vite.config.js` | React + Tailwind plugins; dev proxy `/api → http://localhost:5000` |
| `eslint.config.js` | Vite defaults; two `react-hooks` rules disabled |
| `vercel.json` | SPA rewrite — all paths → `/index.html` |
| `package.json` / `package-lock.json` | Deps + scripts |
| `.env` | Dev: `VITE_API_URL`, `VITE_MAPTILER_KEY`, `VITE_GOOGLE_CLIENT_ID` |
| `.env.production` | `VITE_API_URL=https://green-alert.onrender.com` |
| `Dockerfile`, `.dockerignore` | Container build for the static client |
| `README.md` | Client-specific notes |
| `public/favicon.svg`, `icons.svg` | Icons |
| `public/GreenAlert Logo.png` | Logo |
| `public/GreenAlert_PRD.html`, `GreenAlert_Server_Deep_Dive.html` | Untracked legacy HTML docs |

**`client/src/` — core**

| Path | Purpose |
|------|---------|
| `main.jsx` | Entry — sets `axios.defaults.baseURL` from `VITE_API_URL`, `withCredentials`, mounts `<App/>` in `StrictMode` |
| `App.jsx` | Provider stack + **entire route table** |
| `index.css` | Tailwind v4 import, `@theme` colors/font, a11y + mobile resets, custom keyframe animations |

**`contexts/`**

| Path | Purpose |
|------|---------|
| `CitizenContext.jsx` | "Session brain": user, token, reports, saved, settings; installs axios interceptor; exposes all auth/report methods |
| `ToastContext.jsx` | Global toast notifications (`success/error/warning/info`) |

**`layouts/`**

| Path | Purpose |
|------|---------|
| `DashboardLayout.jsx` | Citizen shell — sidebar + mobile drawer + bottom nav → `<Outlet/>` |
| `AdminLayout.jsx` | Admin shell — dark sidebar |
| `AgencyLayout.jsx` | Agency shell — amber sidebar |

**`components/`**

| Path | Purpose |
|------|---------|
| `SEO.jsx` | Per-page `<head>` tags via react-helmet-async |
| `auth/AuthLayout.jsx` | Centered auth-card wrapper |
| `auth/EmailStep.jsx` | Reusable "enter email" step |
| `landing/Navbar.jsx` | Sticky nav with section links + auth buttons |
| `landing/Hero.jsx` | Above-the-fold headline + CTA |
| `landing/Stats.jsx` | Marketing stat counters (react-countup) |
| `landing/HowItWorks.jsx` | 3-step explainer |
| `landing/ProblemSolution.jsx` | Problem vs solution panels |
| `landing/Categories.jsx` | The 8 report categories |
| `landing/Partners.jsx` | Partner logos |
| `landing/Testimonials.jsx` | Quotes |
| `landing/CTA.jsx` | Final call-to-action band |
| `landing/Footer.jsx` | Footer links (newsletter is non-functional) |
| `landing/ScrollUI.jsx` | `ScrollProgress` + `BackToTop` |
| `map/MapLibreMap.jsx` | The map engine (styles, markers, clustering, popups, sonar) |
| `map/MapControls.jsx` | `MapSearchBar`, `LocateMeButton`, `MapThemeToggle` (stub), `FullscreenToggle` |
| `ui/ProtectedRoute.jsx` | Client-side role guard |
| `ui/ToastContainer.jsx` | Renders active toasts |
| `ui/StatusBadge.jsx` | Status → color map |
| `ui/LoadingSkeleton.jsx` | Skeleton variants (card/table/list/profile/report-card/dashboard) |
| `ui/EmptyState.jsx` | Empty-list placeholder |
| `ui/ErrorState.jsx` | Error placeholder |
| `ui/ErrorBoundary.jsx` | Catches render errors |
| `ui/TiltCard.jsx` | Deliberate no-op wrapper |

**`pages/` — public**

| Path | Route |
|------|-------|
| `Home.jsx` | `/` |
| `Login.jsx` | `/login` |
| `Signup.jsx` | `/signup` |
| `OrgRegister.jsx` | `/register-org` |
| `PrivacyPolicy.jsx` | `/privacy` |
| `Terms.jsx` | `/terms` |
| `NotFoundPage.jsx` | `*` |

**`pages/dashboard/` — citizen**

| Path | Route |
|------|-------|
| `DashboardHome.jsx` | `/citizen-dashboard` |
| `MyReports.jsx` | `/citizen-dashboard/my-reports` |
| `ReportDetails.jsx` | `/citizen-dashboard/reports/:id` |
| `CreateReport.jsx` | `/citizen-dashboard/create-report` |
| `ExploreReports.jsx` | `/citizen-dashboard/explore` |
| `MapPage.jsx` | `/citizen-dashboard/map` |
| `SavedReports.jsx` | `/citizen-dashboard/saved` |
| `ProfilePage.jsx` | `/citizen-dashboard/profile` |
| `SettingsPage.jsx` | `/citizen-dashboard/settings` |

**`pages/admin/`**

| Path | Route |
|------|-------|
| `AdminDashboard.jsx` | `/admin` |
| `AdminReports.jsx` | `/admin/reports` |
| `AdminReportDetails.jsx` | `/admin/reports/:id` |
| `AdminUsers.jsx` | `/admin/users` |
| `AdminOrganizations.jsx` | `/admin/organizations` |
| `AdminSettings.jsx` | `/admin/settings` |

**`pages/agency/`**

| Path | Route |
|------|-------|
| `AgencyDashboard.jsx` | `/agency` |
| `AgencyReports.jsx` | `/agency/reports` |
| `AgencyReportDetails.jsx` | `/agency/reports/:id` |
| `AgencySettings.jsx` | `/agency/settings` |

**`assets/`** — `GreenAlert Logo.png`, `hero.png`.

### 3.3 `server/` (Express backend)

**Root**

| Path | Purpose |
|------|---------|
| `package.json` | Deps + scripts (`start`, `dev`) |
| `.env` / `.env.example` | All env vars (template tracked) |
| `Dockerfile` | `node:20-alpine`, production install, `CMD ["node","src/server.js"]` |
| `.dockerignore` | Excludes `node_modules`, logs, `.env` |
| `public/logo.png` | Static asset |
| `logs/combined.log`, `logs/error.log` | Old log files (logger was removed) |

**`server/src/`**

| Path | Purpose |
|------|---------|
| `server.js` | Process entry — load env, connect DB, seed admin, listen, graceful shutdown |
| `app.js` | Builds Express app; global middleware; mounts routers; final error handler |
| `config/env.js` | Validates env with **envalid** (fail-fast) |
| `config/database.js` | `connectDB()` + `getStatus()` for the health check |
| `config/cloudinary.js` | `configureCloudinary()`, `checkStatus()`, exports the instance |
| `config/adminSeed.js` | Idempotent admin bootstrap/promotion on every boot |
| `models/User.js` | User schema + bcrypt pre-save + `comparePassword` |
| `models/Report.js` | Report schema + virtual `id` |
| `models/Organization.js` | Organization schema + virtual `id` |
| `middlewares/auth.middleware.js` | `protect` (auth) + `authorize(...roles)` (authz) |
| `routes/auth.routes.js` | `/api/v1/auth` |
| `routes/report.routes.js` | `/api/v1/reports` |
| `routes/upload.routes.js` | `/api/v1/upload` |
| `routes/admin.routes.js` | `/api/v1/admin` |
| `routes/agency.routes.js` | `/api/v1/agency` |
| `routes/health.routes.js` | `/api/v1/health` |
| `controllers/auth.controller.js` | Register/login/logout/me/org + password |
| `controllers/report.controller.js` | CRUD + status transitions |
| `controllers/admin.controller.js` | Stats, users, orgs, assignment |
| `controllers/agency.controller.js` | Agency stats + org profile + status |
| `controllers/health.controller.js` | DB + Cloudinary status |

### 3.4 `docs/`

| Path | Purpose |
|------|---------|
| `PRESENTATION_MASTER.md` | **this file** |
| `PROJECT_GUIDE.md` | The exhaustive reference (start-here guide) |
| `api_endpoints.md` | Every route + shapes |
| `system_architecture.md` | Architecture overview |
| `ARCHITECTURE_GUIDE.md` | File-by-file walkthrough |
| `frontend-backend-connection.md` | How the halves talk |
| `explainers.md` | Map + roles deep dives |
| `setup_and_deployment.md` | Run + deploy |
| `presentation_slides.md` | Talk outline |

---

## 4. Concept deep-dives

### 4.1 MERN — what each letter does here

- **M**ongoDB — a document database. Data is stored as JSON-like documents in **collections** (here: `users`, `reports`, `organizations`). No SQL tables.
- **E**xpress — the web framework. Defines routes (`app.get`, `router.post`) and middleware. Version **5** (async errors are auto-forwarded to the error handler).
- **R**eact — the UI library. Components → virtual DOM → real DOM. Version **19**.
- **N**ode — the JavaScript runtime that runs Express on the server.

They talk over **HTTP + JSON**: React calls `/api/v1/...`, Express answers with JSON.

### 4.2 REST + the `/api/v1` convention

REST = resources addressed by URL + HTTP **verbs**:
- `GET` = read, `POST` = create, `PATCH` = partial update, `DELETE` = remove.

`/api/v1` is a **version prefix**. If the API ever changes in a breaking way, you add `/api/v2` and old clients keep working. Everything lives under it so the frontend only ever needs one base URL.

### 4.3 JWT (JSON Web Token)

A JWT is three base64 sections joined by dots: `header.payload.signature`.
- **Payload** here is just `{ id: <user._id> }` plus `iat`/`exp`.
- It is **signed** with `JWT_SECRET`. Anyone can *read* it, but nobody can *forge* it without the secret.
- The server verifies the signature on every protected request.

**Why only the id?** Because `protect` **reloads the user from MongoDB on every request**. So the current role, ban status, etc. are always fresh. If we'd baked `role` into the token, a banned user's old token would still carry the old role for up to 7 days. Reloading avoids that — and means no revocation list is needed.

### 4.4 bcrypt & password hashing

Passwords are **never** stored in plain text. The `User` model has a **pre-save hook**: whenever `password` is modified, it is hashed with bcrypt using **12 salt rounds**. `comparePassword(candidate)` re-hashes the candidate and compares.

- `password` has `select: false`, so a normal query **never returns the hash** — you must explicitly `.select('+password')` (which login does).
- 12 rounds ≈ ~250 ms per hash on a modern CPU — deliberately slow to resist brute force.

### 4.5 Express middleware chain

Middleware are functions `(req, res, next)` that either answer or call `next()`.
- **Global** (in `app.js`): `cors` → `express.json()` → `express.urlencoded()` → `cookieParser()` → `express.static('public')`.
- **Route-level**: `protect` then `authorize(...roles)` then the controller.
- **Error handler** (last): 4-arg `(err, req, res, next)`; converts thrown/multer errors to `{ success:false, message }`.

### 4.6 `protect` vs `authorize`

- **`protect`** = *authentication* ("who are you?"). Reads token from cookie **or** `Authorization: Bearer`, verifies it, loads the user, rejects banned users with `403`, sets `req.user`.
- **`authorize('admin')`** = *authorization* ("what may you do?"). 403 unless `req.user.role` is in the allow-list.

Authentication always runs before authorization.

### 4.7 Mongoose — schemas, models, populate, virtuals

- A **Schema** defines fields, types, defaults, validators, enums, hooks.
- A **Model** (`mongoose.model('User', schema)`) is the class you call (`.find`, `.create`).
- **`populate('user')`** replaces a stored ObjectId with the referenced document (a mini JOIN). E.g. reports return `report.user.fullName`.
- **Virtuals** (`id`, `toJSON: { virtuals:true }`) add computed fields. Here `id` returns `_id` as a hex string so the frontend can use `report.id` uniformly.

### 4.8 React fundamentals used

- **Components** — functions returning JSX.
- **Props** — inputs; **state** — internal data (`useState`).
- **`useEffect`** — run side effects (fetch data) after render; the dependency array controls when.
- **Context** (`createContext` + `useContext`) — share state without prop-drilling. `CitizenContext` and `ToastContext` are the two here.
- **`StrictMode`** — dev-only double-invocation to surface bugs.
- **Router** — `BrowserRouter`, `Routes`/`Route`, `useNavigate`, `useParams`, `Outlet`; `ProtectedRoute` gates by role.

### 4.9 Axios + the request interceptor

`axios` is the HTTP client. In `main.jsx` it sets `baseURL = VITE_API_URL`. In `CitizenContext` an **interceptor** runs on every request and attaches `Authorization: Bearer <token>` from `localStorage`. That's why pages can call `axios.get('/api/v1/...')` without passing headers (admin/agency pages that build their own `headers` object do so explicitly).

### 4.10 Tailwind CSS v4

- v4 is **CSS-first**: `@import "tailwindcss"` (no `tailwind.config.js`).
- Custom design tokens live in an **`@theme { ... }`** block in `index.css` (`--color-primary-custom`, `--font-sans`, …).
- Utility classes are generated on demand by the Vite plugin. `index.css` also adds mobile/a11y resets and a large set of custom `@keyframes` ("alive" animations).

### 4.11 MapLibre GL

- An open-source WebGL map renderer (a fork of Mapbox GL JS v1).
- It renders a **style** — a JSON object listing sources (tile URLs) and layers.
- This project uses **free raster tiles (no API key)**: Google Hybrid (default), Google Pure Satellite, and Esri Satellite, switchable at runtime via `map.setStyle`. **No MapTiler/Google key is required.**
- **Markers** are a **GeoJSON `FeatureCollection`** + layers, not DOM nodes. Optional **clustering** groups nearby points into a count bubble that expands on click. Popups show title/location. A "sonar pulse" layer animates recent/critical markers with `requestAnimationFrame`.

### 4.12 Geocoding (Nominatim + fallbacks)

- **Forward** (address → coordinates): free **Nominatim** `search` API. `CreateReport` debounces input 600 ms and tries progressively broader queries (dropping house number, then leftmost address parts) so a precise street that isn't in OSM still resolves to the nearest area.
- **Reverse** (coordinates → address): Nominatim `reverse`, with a **BigDataCloud** fallback, then a raw `GPS Coordinates: lat, lng` string.
- **"Use my GPS location"** uses `navigator.geolocation.getCurrentPosition`.

### 4.13 Cloudinary + multer (file uploads)

- **multer** parses `multipart/form-data` (browser file uploads) into memory (`memoryStorage`), enforcing size/count/type limits.
- **Cloudinary** is the external CDN. The buffer is piped via `uploader.upload_stream` into a folder (`greenalert` for evidence, `greenalert/licenses` for agency docs) and returns `{ secure_url }`.
- **Only the URL** is stored in MongoDB — never the binary. This keeps the DB small and serves media from a CDN.
- If Cloudinary env vars are missing, the server still boots; only uploads fail.

### 4.14 envalid (env validation)

`config/env.js` uses **envalid** to validate/coerce env vars at startup. Required: `MONGODB_URI`, `JWT_SECRET`. Everything else has a default. This makes the app **fail fast** with a clear message instead of crashing later.

### 4.15 react-helmet-async + SEO

`SEO.jsx` uses `Helmet` to set `<title>`, description, and OG/Twitter tags per page — important because a SPA otherwise shares one static `<head>`.

---

## 5. End-to-end flow walkthroughs

### 5.1 Citizen registration → login → dashboard

1. `/signup` → `POST /api/v1/auth/register` → `auth.controller.register` rejects reserved admin email + duplicate, creates the citizen.
2. `createSendToken` signs a JWT (`{id}`), sets an `httpOnly` cookie, returns `{ success, message, data:{ token, user } }`.
3. Client stores `greenalert_token` + `greenalert_user`, navigates to `/citizen-dashboard`.
4. `CitizenContext` calls `GET /auth/me` to revalidate; the axios interceptor attaches the token.

### 5.2 Agency registration → verification gate

1. `/register-org` (4-step wizard) → `POST /api/v1/auth/register-org` with `multipart/form-data` (license file).
2. multer validates (≤10 MB, image/PDF) → Cloudinary uploads the license.
3. Creates an **agency** User then an **unverified** Organization; if org insert fails, the user is **rolled back**.
4. Login attempt → `403 { awaitingVerification: true }` until an admin verifies.
5. Admin: `PATCH /api/v1/admin/organizations/:id/verify` → `verified: true` → agency can log in.

### 5.3 Create a report (the biggest client flow)

`CreateReport.jsx` is a **7-step wizard** (Category → Location → Images → Description → Severity → Preview → Success).
1. Pick one of 8 categories.
2. Enter address (auto-geocodes, debounced) **or** "Use My GPS Location" (reverse-geocodes).
3. Optionally add up to 5 images/videos. A `beforeunload` + `popstate` guard warns about unsaved changes.
4. Title (≥5 chars) + description (≥20 chars).
5. Pick priority (Low/Medium/High/Critical).
6. Preview all fields.
7. On submit:
   - If images exist: `POST /api/v1/upload` (multipart) → `{ success, data:{ urls } }`.
   - Build the report payload; `createReport(...)` → `POST /api/v1/reports` → returns the bare report object.
   - Show success screen; the new report id links to its detail page.

Status starts **`Submitted`**; priority defaults to whatever was chosen.

### 5.4 Admin assigns a report

1. `/admin/reports` lists all reports (`GET /admin/reports` → bare array) + orgs (`GET /admin/organizations`).
2. Admin clicks **Assign** → modal lists **only verified** orgs.
3. `PATCH /api/v1/admin/reports/:id/assign` with `{ organizationId }`.
4. `admin.controller.assignReport` reads the id from the **URL param** and the org from the **body**, sets `assignedTo` + status `Assigned`.

### 5.5 Agency resolves a report (with proof)

1. `/agency/reports` (`GET /reports/agency-reports` → bare array assigned to this agency).
2. Open a report → `AgencyReportDetails`.
3. Click **In Progress** → `PATCH /api/v1/agency/reports/:id/status` `{ status }`.
4. Click **Resolved** or **Closed** → a **proof modal** opens: upload a cleanup photo (`POST /upload`) + optional notes.
5. `agency.controller.updateReportStatus` allows only `In Progress | Resolved | Closed`, **verifies the report belongs to this agency** (IDOR guard), blocks changes once `Closed`, and sets `resolvedAt`.
6. Citizen sees the "After" photo + notes on their report detail page.

### 5.6 Every authenticated request (the general path)

```
page → axios.get('/api/v1/x')
     → interceptor adds Bearer token
     → Express global middleware (cors, json, cookieParser, static)
     → router matches
     → protect (verify JWT, load user, reject banned)
     → authorize(...roles)  [if restricted]
     → controller (query Mongo via model)
     → res.json(...)
     → axios resolves res.data → React setState → re-render
```

---

## 6. The frontend ⇄ backend contract

The two halves are **separate programs** that only agree on **URLs**, **JSON shapes**, and the **JWT**.

| Endpoint | Response body |
|----------|---------------|
| `GET /reports`, `/reports/my-reports`, `/reports/agency-reports` | **bare array** |
| `GET /reports/:id`, `POST /reports` | **bare report object** |
| `GET /auth/me` | `{ success, data:{ user } }` (includes `settings`) |
| `POST /auth/login` / `/register` / `/register-org` | `{ success, message, data:{ token, user } }` (user has **no** `settings`) |
| `GET /admin/stats` | flat stats object |
| `GET /admin/reports`, `/admin/organizations` | **bare arrays** |
| `GET /admin/users` | `{ users, total, pages }` |
| assign / verify / ban / unban | **bare document** |
| `POST /upload` | `{ success, data:{ urls, publicIds } }` |
| any error | `{ success:false, message }` |

> Mismatched shapes are the #1 cause of "the API works but the page is blank." If you add a field, update both sides.

---

## 7. Data model

```
User ──(organizationId)──► Organization
 │                              ▲
 │ reports.user                 │ reports.assignedTo
 ▼                              │
Report ────────────────────────┘
```

**User** — `fullName`, `email` (unique, lowercase), `phone`, `password` (select:false), `role` (`citizen|agency|admin`), `avatar`, `organizationId`, `status` (`active|banned`), `banReason`, `bannedAt`, `bannedBy`, nested `settings{ emailNotif, statusUpdates, publicReports, allowContact, language, defaultCategory, weeklyDigest }`, timestamps.

**Report** — `title`, `description`, `location`, `latitude`, `longitude`, `category`, `status` (enum, default `Submitted`), `priority` (enum, default `Medium`), `user` (required), `assignedTo`, `imageUrl`, `images[]`, `resolutionImages[]`, `resolutionNotes`, `resolvedAt`, timestamps, virtual `id`.

**Organization** — `name` (unique), `description`, `email`, `phone`, `address`, `website`, `category` (8-value enum), `licenseNumber`, `licenseDocument`, `verified` (default false), `status` (`Active|Inactive|Suspended`, default Inactive), `user` (required), timestamps, virtual `id`.

---

## 8. Viva / Q&A bank

**Architecture & stack**

1. **Why MERN?** One language (JS) across the stack, JSON everywhere, fast to build a CRUD-heavy app. MongoDB's flexible documents suit varied reports/org profiles.
2. **What is Node.js?** A runtime that runs JS outside the browser (on the server), built on Chrome's V8 engine.
3. **Why Express?** Minimal, unopinionated, huge middleware ecosystem. v5 auto-forwards async errors.
4. **SPA vs MPA?** GreenAlert's client is a **SPA** — one `index.html`, routing in the browser, data via API. Faster navigation, clearer front/back separation.
5. **What does Vite do?** Dev server with instant HMR + a production bundler (Rollup). Also hosts the dev proxy.
6. **What is the dev proxy?** In `vite.config.js`, `/api` requests are forwarded to `localhost:5000`, so the browser thinks everything is same-origin (no CORS in dev).

**Auth & security**

7. **How does auth work?** JWT. Login returns a signed token; the client sends it as `Authorization: Bearer`; `protect` verifies it and reloads the user.
8. **Why not put the role in the token?** Ban/role changes must apply instantly; reloading the user on each request guarantees it.
9. **Is the password safe?** Yes — bcrypt with 12 rounds, and `select:false` keeps the hash out of normal queries.
10. **What is `protect` vs `authorize`?** Authentication vs authorization.
11. **What stops a citizen editing another's report?** `deleteReport` is owner-only; `updateReportStatus` checks agency ownership. (An IDOR was fixed here.)
12. **httpOnly cookie vs localStorage?** The token is returned in JSON *and* set as an httpOnly cookie; the client keeps it in localStorage for the Authorization header. httpOnly protects against XSS reads; localStorage is easier for the SPA.
13. **Is it HTTPS?** In production, yes (hosting providers terminate TLS).
14. **CORS?** `cors({ origin:true, credentials:true })` reflects the request origin and allows cookies.

**Backend / data**

15. **What is Mongoose?** The MongoDB ODM — schemas, validation, models.
16. **What is `populate`?** Replaces an ObjectId with the referenced doc (a JOIN).
17. **Why a virtual `id`?** So the frontend uses `report.id` while Mongo's `_id` stays internal.
18. **How is the admin created?** `adminSeed.js` runs every boot — creates/promotes the admin from env, idempotently.
19. **What is envalid?** Startup env validation — fail fast on bad config.
20. **What are the 3 collections?** `users`, `reports`, `organizations`.

**Uploads / maps**

21. **How are images stored?** Browser → multer (memory) → Cloudinary → returns a URL → URL saved on the report. Never the binary in the DB.
22. **Upload limits?** 5 files / 20 MB for evidence; 1 file / 10 MB for a license.
23. **Does the map need an API key?** **No** — it uses free raster tiles. (`VITE_MAPTILER_KEY` is an unused leftover.)
24. **How do markers work?** As a GeoJSON source + layers, with clustering and popups.
25. **How is an address turned into coordinates?** Nominatim (with progressive fallback + BigDataCloud reverse fallback).

**Frontend**

26. **How is state managed?** Context (`CitizenContext`, `ToastContext`) + local component state. No Redux.
27. **What does the axios interceptor do?** Attaches the Bearer token on every request.
28. **What is `ProtectedRoute`?** A client-side role guard — **UX only**; the server enforces real rules.
29. **What are the 3 dashboards?** `/citizen-dashboard`, `/agency`, `/admin`.
30. **Where are saved reports stored?** In `localStorage` under `ga_saved_<userId>` — no backend.

**Product / design**

31. **Why 6 statuses?** To model the real workflow: report → triage → dispatch → working → done → archived.
32. **Why must an agency be verified?** To stop fake orgs from accessing citizen data.
33. **What are the priorities?** Low / Medium / High / Critical, used to route dispatchers.
34. **Why resolution proof?** Accountability — a before/after record for citizens.
35. **How would you scale?** Stateless API → horizontal replicas; add Redis for sessions/caching; Mongo Atlas sharding; CDN already handled by Cloudinary.

---

## 9. Demo script

> Rehearse this. Have two browsers (or one incognito) ready: a citizen and an admin.

1. **Landing** — scroll the marketing page; point out the categories and the "how it works" pipeline.
2. **Sign up** a citizen → land on the dashboard.
3. **Create a report** — walk the 7 steps: pick "Illegal Dumping", type an address (watch it geocode), add a photo, title + description, set **High** priority, preview, submit.
4. **Explore + Map** — show the new report on the feed, then on the map; use search + "locate me".
5. **Admin** (second browser) — log in as the seeded admin → dashboard stats → **Reports** → **Assign** the new report to a verified agency.
6. **Agency** — log in → **Assigned Reports** → open the report → mark **In Progress** → **Resolved** with a cleanup photo + note.
7. **Back to the citizen** — open the report detail; show the workflow tracker advanced and the After photo.
8. **Admin extras** — verify an organization; ban/unban a user.
9. **Close** with the architecture: React SPA → Express API → MongoDB + Cloudinary, JWT-secured.

**Showcase lines:**
- "Notice the role is re-checked on every request, so a ban takes effect immediately."
- "Only the URL is stored in Mongo; the file lives on Cloudinary's CDN."
- "The map uses free tiles — zero API keys."

---

## 10. Troubleshooting (if the demo breaks)

| Symptom | Fix |
|---------|-----|
| Blank pages / 404 on refresh after deploy | SPA rewrite missing → check `vercel.json` |
| All API calls fail in dev | Backend not running on :5000, or proxy misconfigured |
| "Cloudinary configuration missing" | Uploads disabled — fine unless demoing uploads; set the 3 `CLOUDINARY_*` vars |
| Login says `awaitingVerification` | Agency not yet verified by an admin — verify it |
| Map is blank | Tile CDN blocked by network; the app still works otherwise |
| Build fails | Run `npm run build` in `client/`; ensure `VITE_API_URL` is set for production |
| Server won't boot | Check `MONGODB_URI` + `JWT_SECRET` in `server/.env` (envalid fails fast) |

---

> **Bottom line:** three roles, one status pipeline, a JWT-secured Express/Mongo API, a React SPA with three dashboards, Cloudinary uploads, and a keyless MapLibre map — deployed and demo-ready.
