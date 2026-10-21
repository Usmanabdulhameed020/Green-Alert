# GreenAlert 🌱

> Environmental reporting and monitoring platform connecting citizens, agencies, and administrators for a cleaner, safer environment.

Citizens report environmental problems (illegal dumping, blocked drainage, oil spills, flooding, and more) with a photo and a map pin. Environmental agencies pick up the report, travel to the location, fix it, and mark it resolved — all tracked on a single status pipeline. Administrators oversee the whole platform.

## Features

- **Report Environmental Issues** — Log an incident with a title, description, category, priority, location (with map coordinates), and photo evidence.
- **Photo Evidence** — Images are uploaded to Cloudinary and shown on the report.
- **Status Pipeline** — Every report moves through a clear, fixed set of stages:
  `Submitted → Under Review → Assigned → In Progress → Resolved → Closed`
- **Role-based Dashboards** — Three separate portals, one per role (Citizen, Agency, Admin).
- **Interactive Map** — All reports plotted on a MapLibre map with search and "locate me".
- **Agency Workflow** — Admins assign reports to an agency; agencies mark their assigned reports as In Progress / Resolved / Closed and can attach a resolution note and before/after photos.
- **Organization Verification** — Agencies register as an organization and must be verified by an admin before they can log in.
- **User Management** — Admins can search users, ban/unban, and delete accounts.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS v4, React Router v7, Framer Motion, MapLibre GL, Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose 9 |
| Auth | JWT (also stored in an httpOnly cookie) |
| Uploads | Cloudinary (images & videos) |
| Config | envalid (environment variable validation) |

## Project Structure

```
GreenAlert/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/      # Reusable UI, landing page, and map components
│       ├── contexts/        # React contexts (auth/session + toasts)
│       ├── layouts/         # Dashboard layouts (citizen, agency, admin)
│       └── pages/           # Page components, grouped by role
├── server/                  # Node.js + Express backend
│   └── src/
│       ├── config/          # Database, Cloudinary, env validation, admin seed
│       ├── controllers/     # Route handlers (the logic)
│       ├── middlewares/     # Authentication + role authorization
│       ├── models/          # Mongoose schemas (User, Report, Organization)
│       ├── routes/          # Express routers (the URLs)
│       ├── app.js           # Express app + route mounting
│       └── server.js        # Starts the server
└── docs/                    # Architecture, API reference, setup, and slides
```

## Getting Started

### Prerequisites

- Node.js 20+
- A MongoDB database (Atlas or a local instance)
- A Cloudinary account (for image uploads)

### 1. Backend

```bash
cd server
cp .env.example .env      # then fill in the values
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend proxies `/api` requests to the backend automatically (see `client/vite.config.js`).

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in the values:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `BCRYPT_SALT_ROUNDS` | Password hashing cost (default `12`) |
| `ADMIN_EMAIL` | Email for the seeded admin account |
| `ADMIN_PASSWORD` | Password for the seeded admin account |

On first start, the server creates (or promotes) the admin account using `ADMIN_EMAIL` / `ADMIN_PASSWORD` (see `server/src/config/adminSeed.js`).

## API Reference

Everything is served under `/api/v1`. See [docs/api_endpoints.md](docs/api_endpoints.md) for the full list. You can also check the server root for a welcome message and `GET /api/v1/health` for a health check.

## Documentation

- [**Presentation Master**](docs/PRESENTATION_MASTER.md) — **presenting? start here**; full file index, concept deep-dives, flow walkthroughs, Q&A bank, demo script
- [**Complete Project Guide**](docs/PROJECT_GUIDE.md) — the exhaustive reference; explains every file, endpoint, and concept end-to-end
- [API Endpoints](docs/api_endpoints.md) — every route and its request/response shape
- [System Architecture](docs/system_architecture.md) — how the pieces fit together
- [Architecture Guide](docs/ARCHITECTURE_GUIDE.md) — a deeper, file-by-file walkthrough
- [Setup & Deployment](docs/setup_and_deployment.md) — running and deploying the app
- [Presentation Slides](docs/presentation_slides.md) — a ready-to-use talk outline
- [Deep-Dive Explainers](docs/explainers.md) — the MapLibre map and role-based system, explained
- [Frontend ⇄ Backend Connection](docs/frontend-backend-connection.md) — how the two halves talk to each other

## License

MIT
