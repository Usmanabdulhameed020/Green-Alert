# 🧠 Deep-Dive Explainers

Two focused walkthroughs for presenting the trickier parts of GreenAlert: the MapLibre map and the role-based access system.

---

## (a) The MapLibre Map — how it works

**Files:** `client/src/components/map/MapLibreMap.jsx`, `MapControls.jsx`, `pages/dashboard/MapPage.jsx`, and the location picker in `pages/dashboard/CreateReport.jsx`.

**The core idea:** MapLibre is a *rendering engine*, not a map provider. You hand it a **style object** that describes where tiles come from. Our map doesn't use MapTiler or any API key — it defines three raster tile feeds directly (`MapLibreMap.jsx:7-119`):

- `GOOGLE_HYBRID_STYLE` (default) — `mt1.google.com/vt/lyrs=y&...` satellite + labels
- `GOOGLE_PURE_SATELLITE_STYLE` — satellite only
- `ESRI_SATELLITE_STYLE` — ArcGIS World Imagery + transportation + boundaries overlaid

A style is just `{ version, sources, layers }`. Each source has `tiles: ['https://.../{z}/{x}/{y}']` (the `{z}/{x}/{y}` are filled in per tile), and each layer says how to draw that source (`type: 'raster'`).

**Lifecycle (one-time effect, `:165-220`):**

1. On mount, `new maplibregl.Map({ container, style, center, zoom })` creates the map inside a `<div ref={containerRef}>`.
2. On `map.on('load')` we store the instance in `mapInstanceRef`, set `mapLoaded = true`, and call `map.resize()` after 150ms (fixes blank maps caused by layout timing).
3. If `static`/non-interactive, all pan/zoom/rotate handlers are disabled; otherwise Navigation + Scale controls are added.
4. Cleanup calls `map.remove()` on unmount.

**Markers (the interesting part, `:251-465`):** Rather than DOM markers, markers are drawn as a **GeoJSON source + layers**:

- `markers` prop → filtered to features with valid `lng`/`lat` → a `FeatureCollection` (`:277-281`).
- If `clusterMarkers` and >3 points: a clustered source is added with three layers — a green `clusters` circle, a `cluster-count` text layer, and the `unclustered-point` circle. Clicking a cluster calls `getClusterExpansionZoom` to zoom in (`:343-351`); clicking a point opens a `maplibregl.Popup` and fires `onMarkerClick(id)` — which is exactly what `MapPage.jsx` wires to navigate to the report.
- The "sonar pulse" effect (`:414-464`) is a separate `pulse-source` layer whose circle radius/opacity are animated via `requestAnimationFrame`, using a `pulse` property that ramps 0→1 over 1.8s.

**Key props you can explain:** `markers`, `clusterMarkers`, `fitBoundsToMarkers`, `center`/`zoom`, `onClick` (map click → lng/lat), `onMarkerClick` (marker click → id), `static` (for read-only mini maps), `showControls`, `children` (drag a marker/pin into the map).

**MapControls.jsx** — simple overlay buttons for zoom/locate/reset that call methods on the map instance.

**CreateReport.jsx** uses the same component with `onClick` to capture `{ lng, lat }`, reverse-geocodes it into a human-readable `location`, and stores all three on the report.

> One-liner: *"MapLibre renders whatever tile source we describe; our markers are GeoJSON layers so the browser draws hundreds of points and clusters cheaply instead of hundreds of DOM elements."*

---

## (b) The Role-Based System — how it works

**Files:** `server/src/middlewares/auth.middleware.js`, `server/src/routes/*.routes.js`, `server/src/controllers/auth.controller.js`, `client/src/App.jsx`, `components/ui/ProtectedRoute.jsx`, `contexts/CitizenContext.jsx`.

Three roles live on `User.role`: `citizen`, `agency`, `admin`.

**1. Login issues a minimal token.** `auth.controller.js` signs `jwt.sign({ id: user._id }, JWT_SECRET)` — the role is **deliberately not in the token**. The token is returned in the body and set as an `httpOnly` cookie (`CitizenContext.jsx:10-16` attaches it as a `Bearer` header on every Axios request).

**2. Every request is re-authorized against the database.** This is the key design decision (`auth.middleware.js:5-35`):

- `protect` reads the token from the cookie *or* the `Authorization` header, verifies it, then **re-loads the user from MongoDB** (`User.findById(decoded.id)`) and attaches it to `req.user`. Because the role is read fresh each time, a promotion/ban takes effect immediately — no token revocation list needed.
- Banned users are rejected right here with `403`.

**3. Role checks are a second, separate gate.** `authorize(...roles)` (`:38-45`) returns a closure middleware that returns `403` unless `req.user.role` is in the list. This is the difference between **authentication** ("who are you?") and **authorization** ("what may you do?").

**4. Routes declare their policy declaratively.** For example `admin.routes.js`:

```js
router.use(protect);
router.use(authorize('admin'));   // whole router is admin-only
```

`report.routes.js` applies `protect` to everything, but adds `authorize('agency','admin')` only to `agency-reports` and the status-update route. `agency.routes.js` locks the whole file to `agency`. So the security policy is readable straight off the route files.

**5. Agency onboarding adds a verification gate.** `register-org` creates the user + an unverified `Organization`. `login` returns `403 { awaitingVerification: true }` until an admin calls `PATCH /admin/organizations/:id/verify`, which flips `verified`/`status` — only then can the agency log in.

**6. The client mirrors the rules for UX only.** After login, `Login.jsx`/`Signup.jsx` redirect by role (`citizen → /citizen-dashboard`, `agency → /agency`, `admin → /admin`). `App.jsx` wraps each dashboard in `<ProtectedRoute roles={[...]}>`, and that component (`ProtectedRoute.jsx`) waits for `authInitialized`, redirects unauthenticated users to `/login`, and bounces wrong-role users to their own dashboard. On refresh, `CitizenContext` calls `/auth/me` to revalidate the session so each role stays put.

> One-liner: *"The client guard is just for a smooth UX — the real security is two server middlewares: `protect` proves who you are on every request, `authorize` proves what you're allowed to do."*
