# CleanCity AI — Frontend Web App

Smart Municipal Cleanliness & Garbage Complaint Management System for Kanpur Nagar Nigam.

## Features
- **Multi-Role Portal**: Citizen, Admin, and Field Worker portals.
- **Strict Photo Requirement**: Live camera snapshot stream & smartphone camera upload.
- **Gamification & Karma Points**: Citizen Swachh karma badges & worker leaderboard (+150 pts/task).
- **OTP Verification**: Mobile and Email 6-digit verification engine.
- **Admin Command Telemetry**: Live incident triage, crew dispatch, user audit log, and .CSV exports.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` based on `.env.example`:
```env
VITE_API_URL=http://localhost:5000
```
*(On Vercel, set `VITE_API_URL` to your deployed backend URL)*

### 3. Run Locally
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```
Build output is generated inside `dist/`.
