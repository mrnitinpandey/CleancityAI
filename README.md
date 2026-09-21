# CleanCity AI

> **"See it. Report it. Resolve it."**  
> An AI-powered civic cleanliness platform that converts citizen-reported cleanliness problems into prioritized, trackable municipal actions.

---

## 🌐 Live Deployments

- **Frontend App**: [https://cleancity-1.vercel.app](https://cleancity-1.vercel.app/)
- **Backend API**: [https://cleancity-ai-server.vercel.app](https://cleancity-ai-server.vercel.app/)
- **API Health Check**: [https://cleancity-ai-server.vercel.app/api/health](https://cleancity-ai-server.vercel.app/api/health)

---

## 🏗️ Architecture

```
cleancity-ai/
├── client/                     # Frontend (React 19 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Reusable UI elements & modales
│   │   ├── layouts/            # Page layouts
│   │   ├── pages/
│   │   │   ├── citizen/        # Citizen reporting & tracking
│   │   │   ├── admin/          # Triage table & assignment
│   │   │   └── worker/         # Task queue & proof upload
│   │   ├── context/            # Global state context
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API integration (Fetch client)
│   │   ├── utils/              # Calculation helpers & formatters
│   │   ├── App.jsx             # Main interactive application
│   │   ├── main.jsx            # Entrypoint
│   │   └── index.css           # Tailwind + Design system tokens
│   ├── package.json
│   └── vite.config.js          # Vite config with API proxy to port 5000
│
├── server/                     # Backend (Node.js + Express + MongoDB/Mongoose)
│   ├── config/                 # DB connection logic
│   ├── controllers/            # Complaint & Worker controllers
│   ├── models/                 # Mongoose Complaint schema
│   ├── routes/                 # Express API routes
│   ├── services/               # AI scoring & initial seeds
│   ├── middleware/             # Validation & Auth middleware
│   ├── utils/                  # Helper utilities
│   ├── uploads/                # Proof images directory
│   ├── server.js               # Entrypoint & health check
│   └── package.json
│
├── .gitignore
├── README.md
└── package.json
```

---

## ⚡ Quick Start

### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 2. Start Frontend Client
```bash
cd client
npm install
npm run dev
# Vite runs on http://localhost:5173
```

---

## 🎯 Verification Checklist

- [x] **Frontend starts successfully** on `http://localhost:5173`
- [x] **Backend starts successfully** on `http://localhost:5000`
- [x] **`GET /api/health` returns status: "ok"** with timestamp and DB status
- [x] **MongoDB connection works** with graceful in-memory fallback for offline environments
- [x] **Full Citizen ➔ Admin ➔ Worker ➔ Resolution Proof flow** verified
