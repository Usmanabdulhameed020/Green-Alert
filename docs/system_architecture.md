# 🏗️ System Architecture

This document explains how GreenAlert is put together — the big picture, the request flow, the data model, and the security rules.

## High-Level Overview

GreenAlert is a classic three-tier web application:

```
┌──────────────────────────┐        ┌──────────────────────────┐        ┌──────────────────┐
│      CLIENT (React)      │        │    SERVER (Express)      │        │   DATABASE       │
│                          │  HTTP  │                          │  ODM   │                  │
│  Pages, contexts, hooks  │ ─────► │  Routes → Controllers    │ ─────► │  MongoDB         │
│  Axios (JSON + JWT)      │  JSON  │  Middleware (auth)       │        │  (Mongoose)      │
│  MapLibre / Tailwind     │ ◄───── │  Models (schemas)        │ ◄───── │                  │
└──────────────────────────┘        └───────────┬──────────────┘        └──────────────────┘
                                                │
                                                ▼
                                    ┌──────────────────────┐
                                    │      CLOUDINARY      │
                                    │  Image / video CDN   │
                                    └──────────────────────┘
```

- **Client** — A React single-page app. It never talks to the database directly; it only calls the REST API with Axios.
- **Server** — An Express API that owns all business logic and enforces who is allowed to do what.
- **Database** — MongoDB stores users, reports, and organizations. Mongoose provides schemas and validation.
- **Cloudinary** — External service that stores uploaded photos/videos and returns CDN URLs.

## Request Lifecycle

Every API call follows the same path:

1. **React page/context** calls `axios.get/post/patch(...)`.
2. **Axios request interceptor** (`CitizenContext.jsx`) attaches `Authorization: Bearer <token>` from `localStorage` (if present). Cookies are also sent (`withCredentials`).
3. **Express** receives the request and passes it through middleware: `cors` → `express.json` → `cookieParser`.
4. The request reaches the matching **router** (`/api/v1/...`).
5. Route-level middleware runs:
   - `protect` — verifies the JWT, loads the user from MongoDB, rejects banned users, attaches `req.user`.
   - `authorize('admin')` etc. — checks `req.user.role` is allowed.
6. The **controller** runs the business logic and queries MongoDB through a **model**.
7. The controller sends back JSON (`res.json(...)`), and React updates the UI.

## The Three Roles

GreenAlert has exactly three roles, stored on `User.role`:

| Role | Can do |
|------|--------|
| **citizen** | Create reports, view the map & explore feed, manage their own profile/settings |
| **agency** | View reports assigned to their organization, update report status, edit their organization profile |
| **admin** | View everything, assign reports, manage users (ban/unban/delete), verify organizations |

After login, the client reads the user's role and sends them to the matching dashboard:

- `citizen` → `/citizen-dashboard`
- `agency` → `/agency`
- `admin` → `/admin`

Route guards (`ProtectedRoute`) enforce this on the client, and `protect` + `authorize` enforce it on the server. The client guard is for UX; the server guard is the real security boundary.

## Authentication & Authorization

### Login flow

1. User submits email + password to `POST /api/v1/auth/login`.
2. The server finds the user (password fields are `select: false`, so it explicitly asks for the password), compares it with `bcrypt.compare`, and — if correct — signs a JWT containing only `{ id: user._id }`.
3. The token is returned in the response body **and** set as an `httpOnly` cookie.
4. The client stores the token in `localStorage` and the user object in `localStorage`.

### Why the role is not in the token

The JWT carries only the user id. On every protected request, `protect` re-loads the user from the database, so the role and banned-status are always current. If an admin bans a user, that user loses access on their very next request — no token revocation list needed.

### Two-layer middleware

- `protect` = **authentication** ("are you logged in?"). Returns `401` if not.
- `authorize(...roles)` = **authorization** ("are you allowed?"). Returns `403` if the role is not in the allowed list.

## Data Model

Three collections, with relationships shown below.

```
User ──────────────┐
  _id              │ reports.user
  fullName         │
  email (unique)   ▼
  password       Report ─────────────┐
  role           _id                 │ reports.assignedTo
  status         title               │
  organizationId │ status            ▼
  settings       category        Organization
                 priority          _id
                 latitude/longitude name (unique)
                 user ─────────────►category
                 assignedTo ───────►
                 images[] / resolutionImages[]
```

### User
`fullName`, `email` (unique), `phone`, `password` (excluded from queries by default), `role` (`citizen` | `agency` | `admin`), `avatar`, `organizationId` (for agencies), `status` (`active` | `banned`), ban metadata, and a `settings` sub-object (notifications, language, default category, etc.).

### Report
`title`, `description`, `location`, `latitude`/`longitude`, `category`, `status`, `priority`, `user` (author), `assignedTo` (organization), `imageUrl` + `images[]`, plus resolution fields (`resolutionImages[]`, `resolutionNotes`, `resolvedAt`).

**Status pipeline:**
`Submitted → Under Review → Assigned → In Progress → Resolved → Closed`

**Priority:** `Low | Medium | High | Critical`

### Organization
An agency's public profile: `name` (unique), `description`, contact fields, `category`, `licenseNumber`, `licenseDocument`, `verified` flag, `status` (`Active` | `Inactive` | `Suspended`), and the linked `user`.

## The Report Lifecycle (end to end)

1. **Citizen** creates a report (see `CreateReport.jsx`). Photos are uploaded first via `POST /api/v1/upload`, which returns Cloudinary URLs; those URLs are saved into the report's `images`. Initial status is `Submitted`.
2. **Admin** sees it in the admin dashboard and assigns it to an appropriate organization via `PATCH /api/v1/admin/reports/:id/assign`. This sets `assignedTo` and flips the status to `Assigned`.
3. **Agency** sees it on their dashboard (`GET /api/v1/agency/stats` / `/agency-reports`) and moves it through `In Progress → Resolved → Closed` via `PATCH .../status`, optionally attaching resolution notes and after-photos.
4. The **citizen** sees the status updates on their report detail page.

## File Uploads

Uploads go through `multer` in-memory, then straight to Cloudinary:

```
Browser file → POST /api/v1/upload (multer memory storage)
             → cloudinary.uploader.upload_stream
             → returns { secure_url }
             → client stores the URL in the report
```

Cloudinary credentials live in `.env` and are configured once in `config/cloudinary.js`. If they are missing, the server still starts; only uploads fail.

## Frontend Structure

```
client/src/
├── main.jsx           # React entry; sets Axios baseURL + credentials
├── App.jsx            # All top-level routes (public + 3 dashboards)
├── components/
│   ├── landing/       # Home page sections
│   ├── map/           # MapLibreMap, MapControls
│   └── ui/            # Buttons, badges, toasts, guards, etc.
├── contexts/
│   ├── CitizenContext # Auth state, current user, report CRUD helpers
│   └── ToastContext   # Global toast notifications
├── layouts/           # DashboardLayout, AgencyLayout, AdminLayout
└── pages/             # Home, Login, Signup, OrgRegister, + dashboards
```

**State management:** no Redux. `CitizenContext` holds the session (user, token, `authInitialized`) and shared report helpers; everything else is local component state or fetched per page.

## Backend Structure

```
server/src/
├── server.js          # Loads env, connects DB, seeds admin, listens
├── app.js             # Express app; mounts all routers under /api/v1
├── config/            # env validation, database, cloudinary, admin seed
├── models/            # Mongoose schemas (User, Report, Organization)
├── controllers/       # Business logic per domain
├── routes/            # URL → controller mapping + role guards
└── middlewares/       # protect (auth) + authorize (roles)
```

## Configuration & Startup

- `server.js` loads `.env` (via `dotenv`), validates it (via `envalid`), connects to MongoDB, seeds the admin account, then listens on `PORT` (default 5000).
- Admin seeding is idempotent: it creates the admin if missing, promotes an existing user if needed, and updates the password if it differs.
- Graceful shutdown closes the MongoDB connection on `SIGINT` / `SIGTERM`.

## Security Summary

- Passwords hashed with bcrypt; never returned by queries.
- JWT stored in an `httpOnly` cookie (and `localStorage` for the Axios header).
- Every protected route passes through `protect`; role-restricted routes add `authorize`.
- Banned users are blocked at the `protect` layer on every request.
- Agency accounts cannot log in until an admin verifies their organization.
- Report deletion is restricted to the owner on the server.

## Health Check

`GET /api/v1/health` reports the database state (`connected` / `disconnected`), Cloudinary reachability, process uptime, and a timestamp. It returns `200` when the database is connected and `500` otherwise — useful for uptime monitors and load balancers.
