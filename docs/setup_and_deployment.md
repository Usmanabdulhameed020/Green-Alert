# 🛠️ Configuration & Setup Guide

This guide details how to acquire, configure, and manage third-party integration keys required to run GreenAlert.

---

## 🔑 Environment Variables Configuration

GreenAlert uses environment files to load credentials.
- **Server:** [server/.env](file:///C:/Users/HomePC/Desktop/GreenAlert/server/.env) (created from `server/.env.example`)
- **Client:** [client/.env](file:///C:/Users/HomePC/Desktop/GreenAlert/client/.env) / [client/.env.production](file:///C:/Users/HomePC/Desktop/GreenAlert/client/.env.production)

---

## 1. 🗄️ Database Setup (MongoDB Atlas)

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Shared cluster (M0) and name it.
3. Under **Database Access**, create a user with read/write privileges.
4. Under **Network Access**, whitelist `0.0.0.0/log` (allow access from anywhere) or add your server IP.
5. Get your connection string: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`.
6. Add it to `server/.env`:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   ```

---

## 2. 🤖 Google Gemini AI Key

Used for categorizing reports, assessing hazard severity, and detecting duplicates.

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create a API key.
3. Add it to `server/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```

---

## 3. 🖼️ Cloudinary (Media Uploads)

Used to store images and videos submitted by users.

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Copy your **Cloud Name**, **API Key**, and **API Secret** from the console dashboard.
3. Add them to `server/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

---

## 4. ✉️ Brevo (Email Alerts)

Used to send verification codes, welcome emails, and notifications.

1. Create an account at [brevo.com](https://www.brevo.com).
2. Go to **SMTP & API** tab under your account menu.
3. Generate a new API Key v3.
4. Add it to `server/.env`:
   ```env
   BREVO_API_KEY=your_brevo_api_key
   BREVO_SENDER_NAME=GreenAlert
   BREVO_SENDER_EMAIL=your_sending_email
   BREVO_SMTP_LOGIN=your_smtp_login
   ```

---

## 5. 🔔 Web Push Keys (VAPID)

Used for push notifications to browsers on desktops and mobile devices.

1. Generate new VAPID keys by running the helper script or using `web-push` CLI:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Copy the public and private keys generated and add them to `server/.env`:
   ```env
   VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   ```

---

## 🗺️ Map Service (MapTiler)

To use high-quality map vector tiles in the React frontend:

1. Create an account at [maptiler.com](https://www.maptiler.com/).
2. Copy your API key.
3. Add it to `client/.env` and `client/.env.production`:
   ```env
   VITE_MAPTILER_KEY=your_maptiler_key
   ```
