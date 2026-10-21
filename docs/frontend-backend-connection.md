# 🔗 How the Frontend and Backend Connect

This document explains, end to end, how the React frontend talks to the Express backend — from the moment a user clicks a button to the moment data appears on screen.

---

## 1. The Big Picture

GreenAlert is two separate programs that only communicate over HTTP with JSON:

```
┌────────────────────────────┐                     ┌────────────────────────────┐
│  FRONTEND (client/)        │                     │  BACKEND (server/)         │
│  React + Vite              │   HTTP + JSON       │  Express                   │
│  runs on :5173 (dev)       │ ─────────────────►  │  runs on :5000             │
│                            │                     │                            │
│  Pages call Axios ─────────┼──► /api/v1/...  ────┼──► route → middleware →    │
│  Context stores session    │                     │    controller → model      │
│  UI updates from state ◄───┼──── JSON response ◄─┼──── MongoDB / Cloudinary   │
└────────────────────────────┘                     └────────────────────────────┘
```

The frontend **never** touches MongoDB or Cloudinary directly. It only knows URLs like `/api/v1/reports`.

---

## 2. How the Frontend Reaches the Backend

### Step 1 — Axios is configured once (`main.jsx`)

```js
const API_BASE = import.meta.env.VITE_API_URL;
if (API_BASE) axios.defaults.baseURL = API_BASE;
axios.defaults.withCredentials = true;
```

Two things happen here:
- If `VITE_API_URL` is set, every Axios call is prefixed with it. In **development** it is usually left blank, so requests go to the same origin (`:5173`) and are **proxied** to the backend by Vite.
- `withCredentials = true` lets the browser send/receive the auth cookie.

### Step 2 — Vite proxies `/api` in development (`vite.config.js`)

```js
server: {
  proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } }
}
```

So `axios.get('/api/v1/reports')` from the browser actually hits `http://localhost:5000/api/v1/reports`. This avoids CORS pain during development. In production there is no proxy — `VITE_API_URL` points straight at the deployed backend.

### Step 3 — The token is attached automatically (`CitizenContext.jsx`)

```js
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('greenalert_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

Every outgoing request gets the JWT header if the user is logged in. No page has to remember to add it.

### Step 4 — A page makes a call

Example (`MyReports`/`CitizenContext`):

```js
const res = await axios.get('/api/v1/reports/my-reports');
// res.data is the JSON body the backend sent
setReports(res.data);
```

`res.data` is always the **response body** (already parsed from JSON). The page then stores it in React state, which re-renders the UI.

---

## 3. How the Backend Receives and Answers

### Step 1 — `app.js` sets up the pipeline

```js
cloudinaryConfig.configureCloudinary();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/agency', agencyRoutes);
app.use('/api/v1', healthRoutes);
```

Every request passes through the global middleware in order, then is matched to a router by its URL prefix.

### Step 2 — The router decides who is allowed (`routes/*.js`)

```js
router.use(protect);              // must be logged in
router.use(authorize('admin'));   // must be an admin
router.get('/stats', getStats);   // then run this controller
```

`protect` verifies the JWT, loads the user from MongoDB and attaches `req.user`. `authorize` checks `req.user.role`.

### Step 3 — The controller does the work

```js
exports.getStats = async (req, res) => {
  const reports = await Report.find().sort({ createdAt: -1 });
  return res.status(200).json(reports);   // <-- JSON sent back
};
```

The controller talks to **models** (Mongoose schemas), which talk to MongoDB. It ends by calling `res.json(...)`.

### Step 4 — The response travels back

Express serialises the value into JSON, Axios resolves the promise with `res.data`, and the page updates.

---

## 4. A Full Round Trip (Worked Example)

**User creates a report with a photo.**

1. **Upload the photo** — `CreateReport.jsx`:
   ```js
   const form = new FormData();
   form.append('images', file);
   const uploadRes = await axios.post('/api/v1/upload', form);
   const url = uploadRes.data.data.urls[0];
   ```
   Backend `upload.routes.js`: `protect` → multer reads the file → Cloudinary stores it → responds `{ success: true, data: { urls: [...] } }`.

2. **Create the report** — `CreateReport.jsx` (via `CitizenContext.createReport`):
   ```js
   const res = await axios.post('/api/v1/reports', {
     title, description, location, latitude, longitude,
     category, priority, images: [url],
   });
   ```
   Backend `report.controller.createReport`: validates fields, sets `user: req.user._id`, saves to MongoDB, responds `201` with the new report.

3. **See it on screen** — the page adds the returned report to state:
   ```js
   setReports((prev) => [res.data, ...prev]);
   ```

That is the entire connection in one flow: **UI → Axios (+ token) → route → middleware → controller → model → DB → JSON → state → UI.**

---

## 5. Authentication Across the Two Sides

| Concern | Frontend | Backend |
|---------|----------|---------|
| Where the token is kept | `localStorage.greenalert_token` | Signed JWT, also set as `httpOnly` cookie |
| How it's sent | Axios interceptor adds `Bearer` header | `protect` reads header **or** cookie |
| Who the user is | `CitizenContext.user` (also `localStorage.greenalert_user`) | `protect` load user from DB into `req.user` |
| Role routing | `ProtectedRoute roles={[...]}` in `App.jsx` | `authorize(...roles)` on routes |
| Staying logged in after refresh | `CitizenContext` calls `GET /auth/me` | `protect` revalidates and returns the user |

**Key idea:** the client's role check is only UX. The server re-checks everything on each request, so it is the real security boundary.

---

## 6. The Response-Shape Contract

The frontend and backend must agree on JSON shape. The current contract:

| Endpoint | Returns |
|----------|---------|
| `GET /api/v1/reports` | **bare array** of reports |
| `GET /api/v1/reports/my-reports` | **bare array** |
| `GET /api/v1/reports/agency-reports` | **bare array** |
| `GET /api/v1/reports/:id` | **bare report object** |
| `POST /api/v1/reports` | **bare report object** |
| `GET /api/v1/auth/me` | `{ success, data: { user } }` |
| `POST /api/v1/auth/login` | `{ success, token, data: { user } }` |
| `GET /api/v1/admin/stats` | flat stats object |
| `GET /api/v1/admin/users` | `{ users, total, pages }` |
| `GET /api/v1/admin/reports`, `/admin/organizations` | **bare arrays** |
| `POST /api/v1/upload` | `{ success, data: { urls: [...] } }` |
| Errors | `{ success: false, message: "..." }` under 4xx/5xx |

A mismatch here is the most common source of "the page is broken but the API works" bugs (reading `res.data.data` when the body is already an array, or vice-versa). When adding a feature, always check both sides match.

---

## 7. Error Handling Across the Boundary

- **Backend:** controllers wrap work in `try/catch` and respond `{ success:false, message }` with the right status code. A final error handler in `app.js` catches multer errors (wrong file type/size) and other unhandled errors, returning JSON instead of an HTML error page.
- **Frontend:** pages read `err.response?.data?.message` to show a friendly message:
  ```js
  catch (err) {
    toastError(err.response?.data?.message || 'Something went wrong');
  }
  ```

---

## 8. Where Each Side Lives (Quick Map)

| Task | Frontend file | Backend file |
|------|---------------|--------------|
| Send token | `contexts/CitizenContext.jsx` (interceptor) | `middlewares/auth.middleware.js` (`protect`) |
| Login/register | `pages/Login.jsx`, `Signup.jsx`, `OrgRegister.jsx` | `controllers/auth.controller.js` |
| List/create reports | `pages/dashboard/*`, `context/CitizenContext.jsx` | `controllers/report.controller.js` |
| Upload images | call sites using `axios.post('/api/v1/upload')` | `routes/upload.routes.js` + `config/cloudinary.js` |
| Assign reports | `pages/admin/AdminReports.jsx` | `controllers/admin.controller.js` |
| Update status | `pages/agency/AgencyReportDetails.jsx` | `controllers/agency.controller.js` / `report.controller.js` |
| Role routing | `App.jsx` + `components/ui/ProtectedRoute.jsx` | `routes/*.js` (`authorize`) |

---

## 9. One-Sentence Summary

> The frontend is a React app that calls REST endpoints with Axios (automatically attaching a JWT), and the backend is an Express app that receives those calls, runs them through authentication/authorization middleware, let controllers talk to MongoDB and Cloudinary, and returns JSON that the frontend renders — the two sides are joined only by HTTP URLs, JSON shapes, and the JWT.
