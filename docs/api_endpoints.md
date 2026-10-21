# 🔌 API Endpoints Reference

The GreenAlert backend is a RESTful JSON API. Every route lives under `/api/v1`.

## Authentication

Protected routes expect a token. Send it either:

- as a header: `Authorization: Bearer <JWT_TOKEN>`, or
- as a cookie named `token` (the server sets this on login).

A `401` means the token is missing/invalid. A `403` means you are logged in but your role is not allowed to do that action.

---

## 🔒 Auth (prefix: `/api/v1/auth`)

### `POST /check-email` — public
Check whether an email is already used by a user or an organization.

```json
{ "email": "john@example.com" }
```
Response: `{ "success": true, "exists": true|false }`

### `POST /register` — public
Register a citizen account.

```json
{ "fullName": "John Doe", "email": "john@example.com", "password": "Password123" }
```
Response (201): JWT token + user object.

### `POST /login` — public
```json
{ "email": "john@example.com", "password": "Password123" }
```
Response (200): JWT token + user object.
- If the account is an unverified agency, the response is `403` with `{ "awaitingVerification": true }`.
- If the account is banned, the response is `403`.

### `POST /register-org` — public
Register an agency organization. Accepts `multipart/form-data` with an optional `licenseDocument` file.

Fields: `orgName`, `description`, `email`, `phone`, `address`, `website`, `category`, `licenseNumber`, `password`.
Creates the agency user + organization (unverified) and returns a token. The agency cannot log in until an admin verifies it.

### `POST /logout` — public
Clears the auth cookie.

### `GET /me` — protected
Returns the logged-in user (including `settings`).

### `PATCH /me` — protected
Update the profile. Accepts any of: `fullName`, `phone`, `avatar`, `settings`.

### `DELETE /me` — protected
Deletes the account and all of its reports.

### `PATCH /me/password` — protected
```json
{ "currentPassword": "old", "newPassword": "newpass" }
```

---

## 📋 Reports (prefix: `/api/v1/reports`)

All report routes require login.

### `GET /` — protected
All reports (newest first), paginated with `?page=` and `?limit=`. Each report is populated with its author and assigned organization.

### `GET /my-reports` — protected
Reports created by the logged-in user.

### `GET /agency-reports` — protected (`agency`, `admin`)
Reports assigned to the logged-in agency's organization.

### `GET /:id` — protected
A single report.

### `POST /` — protected
Create a report.

```json
{
  "title": "Oil spill near canal",
  "description": "Large leak near the industrial drainage.",
  "location": "Lagos Industrial Canal",
  "latitude": 6.5244,
  "longitude": 3.3792,
  "category": "Oil Spill",
  "priority": "High",
  "images": ["https://res.cloudinary.com/.../img.jpg"]
}
```
Response (201): the created report.

### `DELETE /:id` — protected
Delete a report. Only the owner may delete their own report.

### `PATCH /:id/status` — protected (`agency`, `admin`)
Update a report's status.

```json
{
  "status": "Resolved",
  "resolutionNotes": "Cleared and drained.",
  "resolutionImages": ["https://res.cloudinary.com/.../after.jpg"]
}
```
Valid statuses: `Submitted`, `Under Review`, `Assigned`, `In Progress`, `Resolved`, `Closed`.
A `Closed` report can no longer be changed.

---

## ⬆️ Uploads (prefix: `/api/v1/upload`)

### `POST /` — protected
Upload up to 5 images/videos (`multipart/form-data`, field name `images`, 20 MB each). Returns Cloudinary URLs:

```json
{ "success": true, "data": { "urls": ["https://...", "..."] } }
```

---

## 🛡️ Admin (prefix: `/api/v1/admin`)

All admin routes require login and the `admin` role.

### `GET /stats`
Aggregated dashboard stats: report/user/organization counts, reports by status, category, priority, and month, recent reports, recent users, pending organizations, and quick counts (critical, unverified orgs, pending review, active assignments).

### `GET /reports` and `GET /reports/:id`
All reports / a single report (admin view).

### `PATCH /reports/:id/assign`
Assign a report to an organization (also sets status to `Assigned`).
```json
{ "organizationId": "<org id>" }
```

### `GET /users`
List users. Query params: `role`, `search`, `page`, `limit`.

### `DELETE /users/:id`
Delete a user.

### `PATCH /users/:id/ban`
```json
{ "banReason": "Spam" }
```

### `PATCH /users/:id/unban`
Reactivates a banned user.

### `POST /users/bulk-ban`
```json
{ "userIds": ["<id>", "<id>"], "banReason": "Spam" }
```

### `GET /organizations`
List all organizations (with the linked user).

### `PATCH /organizations/:id/verify`
Approve an organization (sets `verified: true`, `status: 'Active'`). The agency can then log in.

### `DELETE /organizations/:id`
Delete an organization and its linked user.

---

## 🏢 Agency (prefix: `/api/v1/agency`)

All agency routes require login and the `agency` role.

### `GET /stats`
Dashboard counts for the agency's assigned reports: totals, in-progress, resolved, assigned, closed, submitted, resolution rate, and new-this-week.

### `GET /org`
The logged-in agency's organization profile.

### `PATCH /org`
Update the organization profile: `description`, `phone`, `address`, `website`.

### `PATCH /reports/:id/status`
Update one of the agency's assigned reports. Same body as the report status route, but the report must be assigned to this agency.

---

## ❤️ Health (prefix: `/api/v1`)

### `GET /health`
Returns database and Cloudinary status, uptime, and a timestamp. Responds `200` when the database is connected, `500` otherwise.
