# ⚙️ Setup & Deployment Guide

This guide covers running GreenAlert locally and deploying it. It assumes the simplified codebase: React + Vite frontend, Express + MongoDB backend, Cloudinary for uploads.

---

## 1. Prerequisites

- **Node.js 20+** and npm
- **MongoDB** — a local instance or a free MongoDB Atlas cluster
- **Cloudinary account** — free tier is fine (only needed for image uploads)
- **Git**

Check your tooling:

```bash
node -v
npm -v
```

---

## 2. Clone the Repository

```bash
git clone https://github.com/Usmanabdulhameed020/Green-Alert.git
cd Green-Alert
```

The project has two independent packages: `server/` and `client/`.

---

## 3. Backend Setup

```bash
cd server
npm install
```

### Create `server/.env`

Copy the example and fill it in:

```bash
cp .env.example .env
```

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://localhost:27017/greenalert
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

BCRYPT_SALT_ROUNDS=10

# Admin seed (created/promoted automatically on startup)
ADMIN_EMAIL=admin@greenalert.com
ADMIN_PASSWORD=your-secure-admin-password
```

Notes:
- All variables are validated at startup (`server/src/config/env.js`). Missing `MONGODB_URI` or `JWT_SECRET` will stop the server with a clear message.
- If the Cloudinary variables are blank, the server still starts — only uploads fail.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` are optional, but if set, that account is created (or promoted) as an admin every time the server boots.

### Run the backend

```bash
npm run dev     # node --watch (auto-restarts on file changes)
# or
npm start       # plain node
```

You should see:

```
Database connected successfully.
Server running on http://localhost:5000
Health check: http://localhost:5000/api/v1/health
```

Verify it's alive:

```bash
curl http://localhost:5000/api/v1/health
```

---

## 4. Frontend Setup

```bash
cd ../client
npm install
```

### `client/.env`

```env
VITE_API_URL=http://localhost:5000
```

- In **development**, leave `VITE_API_URL` unset and the Vite dev server proxies `/api` to `http://localhost:5000` (see `client/vite.config.js`). Setting it to `http://localhost:5000` also works.
- In **production**, set it to your deployed backend URL (for example `https://green-alert.onrender.com`).
- `VITE_MAPTILER_KEY` and `VITE_GOOGLE_CLIENT_ID` appear in some env files but are **unused** — the map uses free ESRI/Google raster tiles and there is no social login.

### Run the frontend

```bash
npm run dev
```

Open `http://localhost:5173`.

---

## 5. Using the App

1. **Admin** — log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.
2. **Agency** — register at `/register-org`, then have the admin verify the organization (Admin → Organizations → Verify). Only then can the agency log in.
3. **Citizen** — register at `/signup` and start creating reports at `/citizen-dashboard/create-report`.

---

## 6. Available Scripts

### Server (`server/`)
| Script | Does |
|--------|------|
| `npm run dev` | Runs with `node --watch` (restarts on changes) |
| `npm start` | Runs the server normally |

### Client (`client/`)
| Script | Does |
|--------|------|
| `npm run dev` | Vite dev server |
| `npm run dev:host` | Dev server exposed on the network |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run lint` | Runs ESLint |
| `npm run test:mobile` | Serves `dist/` at port 5173 (device testing) |

---

## 7. Production Build (Frontend)

```bash
cd client
npm run build
```

This outputs a static site to `client/dist/`. Deploy it to any static host (Netlify, Vercel, GitHub Pages, an S3 bucket, or Render's static site service). Make sure `VITE_API_URL` points at your deployed API **before** building (Vite bakes env values in at build time).

Preview the build locally:

```bash
npm run preview
```

---

## 8. Deployment

### Backend (e.g. Render / Railway)

1. Create a Web Service pointing at the `server/` directory.
2. Build command: `npm install` · Start command: `npm start`.
3. Add the same environment variables from `.env` in the host's dashboard, including `NODE_ENV=production` and your Atlas `MONGODB_URI`.
4. Note the public URL (e.g. `https://green-alert.onrender.com`).

### Frontend (e.g. Render Static / Netlify / Vercel)

1. Point at the `client/` directory.
2. Build command: `npm install && npm run build` · Publish directory: `dist`.
3. Set `VITE_API_URL` to the backend URL.

### Database (MongoDB Atlas)

1. Create a free cluster and a database user.
2. Allow network access from your host (or `0.0.0.0/0` for simplicity).
3. Copy the connection string into `MONGODB_URI`.

### Cloudinary

1. Create an account and grab the cloud name, API key, and API secret.
2. Set the three `CLOUDINARY_*` variables on the backend host.

---

## 9. Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| `MONGODB_URI is not set` | Missing `server/.env` or the variable |
| Server exits with an env error | A required variable is missing — check `env.js` |
| `Cloudinary configuration missing` warning | Expected if you haven't set Cloudinary creds; uploads won't work |
| Frontend gets `404`/`ERR_CONNECTION_REFUSED` on API calls | Backend not running, or wrong `VITE_API_URL` |
| CORS errors | Backend not running, or you're hitting a different origin than expected |
| Map is blank | Tile provider blocked on your network; check the browser console |
| Agency can't log in | Organization not yet verified by an admin |
| `401 Invalid or expired token` | Logged out/expired — log in again |

---

## 10. Security Checklist Before Deploying

- [ ] `JWT_SECRET` is a long, random value (not the example)
- [ ] `ADMIN_PASSWORD` is strong and not committed
- [ ] `.env` files are git-ignored (never commit secrets)
- [ ] MongoDB Atlas network access is restricted
- [ ] Cloudinary API secret is only in server env (never in the client)
- [ ] `NODE_ENV=production` on the backend
