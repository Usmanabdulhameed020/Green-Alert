# GreenAlert 🌱

> Environmental reporting and monitoring platform connecting citizens, agencies, and administrators for a cleaner, safer environment.

## Features

- **Report Environmental Issues** — Log incidents with location, images, videos, and AI-powered analysis
- **Real-time Tracking** — Live updates via WebSocket as agencies review and resolve reports
- **Role-based Dashboards** — Citizen, Agency, and Admin portals with tailored workflows
- **AI Analysis** — Gemini AI automatically categorizes, assesses severity, and detects duplicates
- **Push Notifications** — Free browser push notifications for real-time updates (no app needed)
- **Gamification** — Earn XP and unlock achievements for contributing to your community
- **Interactive Map** — Visualize all reports with Leaflet map integration
- **Community Forums** — Discuss local environmental issues with neighbors

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS v4, Framer Motion, Leaflet, Recharts |
| Backend | Node.js, Express 5, Socket.io |
| Database | MongoDB with Mongoose 9 |
| AI | Google Gemini 2.0 Flash |
| Auth | JWT with cookie-based sessions |
| Email | Brevo (Sendinblue) transactional API |
| Push | Web Push API (VAPID) — completely free |
| Uploads | Cloudinary (images & videos) |

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB instance (Atlas or local)
- Cloudinary account (for media uploads)
- Brevo account (for email)
- Google Gemini API key (for AI features)

### Setup

1. Clone the repo
2. Copy environment files:
   ```bash
   cp server/.env.example server/.env
   ```
3. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
4. Start development servers:
   ```bash
   # Terminal 1 — Server
   cd server && npm run dev

   # Terminal 2 — Client
   cd client && npm run dev
   ```

5. Open http://localhost:5173

### Docker Setup

```bash
docker compose up --build
```

## Environment Variables

See `server/.env.example` for all required variables. Key ones:
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — Secret for signing auth tokens
- `GEMINI_API_KEY` — Google Gemini AI key
- `CLOUDINARY_*` — Cloudinary credentials
- `BREVO_API_KEY` — Brevo transactional email key
- `VAPID_*` — Web Push notification keys (generate via `node src/config/push.js`)

## API Documentation

When the server is running, visit [http://localhost:5000/api/docs](http://localhost:5000/api/docs) for interactive Swagger documentation.

## Project Structure

```
greenalert/
├── client/               # React + Vite frontend
│   ├── public/           # Static assets, service worker
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts (auth, socket, etc.)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── layouts/      # Dashboard layouts (citizen, admin, agency)
│   │   ├── pages/        # Page components
│   │   └── services/     # API utilities (push, etc.)
│   └── ...
├── server/               # Node.js + Express backend
│   ├── src/
│   │   ├── config/       # Configuration (DB, Cloudinary, Brevo, etc.)
│   │   ├── controllers/  # Route handlers
│   │   ├── middlewares/  # Express middlewares
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # Express routers
│   │   ├── services/     # Business logic (push, email, gamification, AI)
│   │   └── utils/        # Utilities (logger)
│   └── ...
├── docker-compose.yml
└── README.md
```

## Contributing

Contributions welcome! Please open an issue first to discuss changes.

## License

MIT
