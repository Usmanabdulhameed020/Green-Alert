# 🔌 API Endpoints Reference

GreenAlert backend provides a RESTful JSON API. For interactive testing, run the server and open: `http://localhost:5000/api/docs`.

---

## 🔒 Authentication & Session Management

All non-public endpoints require the HTTP Authorization header:
`Authorization: Bearer <JWT_TOKEN>` (or cookies with credentials enabled).

### 1. User Registration
* **Endpoint:** `POST /api/v1/auth/register`
* **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123"
  }
  ```

### 2. User Login
* **Endpoint:** `POST /api/v1/auth/login`
* **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "Password123"
  }
  ```
* **Response:** Returns JWT token and user profile object.

---

## 📋 Environmental Reports

### 1. Submit a Report
* **Endpoint:** `POST /api/reports` (or `/api/v1/reports`)
* **Body:**
  ```json
  {
    "title": "Oil spill near canal",
    "description": "Large leak detected near the industrial sector drainage.",
    "location": "Lagos Industrial Canal",
    "category": "Sewage & Water Pollution",
    "priority": "High",
    "imageUrl": "https://cloudinary.com/.../img.png",
    "latitude": 6.5244,
    "longitude": 3.3792
  }
  ```

### 2. Retrieve Reports
* **Endpoint:** `GET /api/reports` (or `/api/v1/reports`)
* **Query Params (Optional):** `status` (e.g. `Pending`, `Resolved`), `category`, `latitude`, `longitude`, `radius`
* **Response:** Array of report JSON objects.

### 3. Update Report Status (Agency Only)
* **Endpoint:** `PATCH /api/reports/:id`
* **Body:**
  ```json
  {
    "status": "In Progress"
  }
  ```

---

## 💬 Community Forum & Engagement

### 1. Retrieve Communities
* **Endpoint:** `GET /api/communities`

### 2. Join a Community
* **Endpoint:** `POST /api/communities/:id/join`

### 3. Submit a Comment on a Report
* **Endpoint:** `POST /api/v1/reports/:reportId/comments`
* **Body:**
  ```json
  {
    "text": "Clean up crew is on their way."
  }
  ```

---

## 🔔 Browser Push Notifications

### 1. Get VAPID Public Key
* **Endpoint:** `GET /api/push/vapid-public-key`
* **Description:** Retrieve the backend's VAPID public key needed to subscribe the browser to push notifications.

### 2. Subscribe to Push Notification
* **Endpoint:** `POST /api/push/subscribe`
* **Body:**
  ```json
  {
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "...",
        "auth": "..."
      }
    }
  }
  ```
