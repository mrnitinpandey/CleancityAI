# CleanCity AI — Backend API Server

REST API and Database Service for CleanCity AI Municipal System.

## Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB / Mongoose (with automated in-memory fallback)
- **Deployment**: Vercel Serverless Functions (`@vercel/node`) / Standalone Node

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` based on `.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://... (optional)
```

### 3. Run Locally
```bash
npm run dev
```
Runs at `http://localhost:5000` with API health check at `/api/health`.
