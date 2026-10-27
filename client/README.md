# GreenAlert — Client (Frontend)

The React + Vite frontend for GreenAlert. See the [root README](../README.md) for the full project overview, architecture, API, and setup details.

## Quick Start

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. API requests to `/api` are proxied to `http://localhost:5001` in development (see `vite.config.js`).

### Environment

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5001
```

Leave `VITE_API_URL` unset in development to use the Vite proxy. In production, set it to your deployed API URL before building (Vite bakes env values in at build time).

> `VITE_MAPTILER_KEY` and `VITE_GOOGLE_CLIENT_ID` may appear in existing env files but are unused — the map uses free ESRI/Google raster tiles and there is no social login.

## Scripts

| Script | Does |
|--------|------|
| `npm run dev` | Start the dev server |
| `npm run dev:host` | Dev server exposed on the network |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the built `dist/` locally |
| `npm run lint` | Run ESLint |
| `npm run test:mobile` | Serve `dist/` at port 5173 for device testing |

## Tech Stack

React 19 · Vite 8 · Tailwind CSS v4 · React Router v7 · Framer Motion · MapLibre GL · Axios · lucide-react

## Structure

```
src/
├── main.jsx           # Entry point; sets Axios baseURL + credentials
├── App.jsx            # Route table (public + 3 role dashboards)
├── components/        # landing/, map/, ui/, auth/, SEO
├── contexts/          # CitizenContext (session), ToastContext
├── layouts/           # DashboardLayout, AgencyLayout, AdminLayout
└── pages/             # Home, auth pages, dashboard/, admin/, agency/
```

## Routing

- **Public:** `/`, `/login`, `/signup`, `/register-org`, `/privacy`, `/terms`
- **Citizen:** `/citizen-dashboard/*` (guarded, `citizen` only)
- **Agency:** `/agency/*` (guarded, `agency` only)
- **Admin:** `/admin/*` (guarded, `admin` only)

Client-side guards live in `components/ui/ProtectedRoute.jsx`. The server enforces the real rules.
