import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import { authMiddleware } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import programRoutes from './routes/programs.js';
import workoutRoutes from './routes/workouts.js';
import taskRoutes from './routes/tasks.js';
import leaderboardRoutes from './routes/leaderboard.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/programs', authMiddleware, programRoutes);
app.use('/api/workouts', authMiddleware, workoutRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/leaderboard', authMiddleware, leaderboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Bind port FIRST so Render detects it, then init DB
app.listen(PORT, async () => {
  console.log(`\nFitCoach API running on port ${PORT}`);
  console.log(`   Health check: /api/health\n`);
  try {
    await initDb();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
});
