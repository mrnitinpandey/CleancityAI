import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware with 50MB payload limit for high-res smartphone photos (base64)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Health Check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'in-memory-fallback';
  res.json({
    status: 'ok',
    message: 'CleanCity AI Backend is healthy and running',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api', apiRoutes);

// Connect DB & Start Server (for local standalone execution)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`[CleanCity Server] Running on http://localhost:${PORT}`);
    });
  });
} else {
  // Connect DB on serverless invocation
  connectDB();
}

export default app;
