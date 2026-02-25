import { Router, Request, Response } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/leaderboard
router.get('/', async (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;

    // Scope leaderboard to the trainer's trainees only
    let trainerId: string;
    if (role === 'trainer') {
      trainerId = userId;
    } else {
      const { rows } = await pool.query('SELECT trainer_id FROM users WHERE id = $1', [userId]);
      trainerId = rows[0]?.trainer_id || userId;
    }

    const { rows: entries } = await pool.query(
      `SELECT u.id as "traineeId", u.name,
              COALESCE(s.current_streak, 0) as "currentStreak",
              COALESCE(s.longest_streak, 0) as "longestStreak",
              (SELECT COUNT(*) FROM workout_logs wl
               WHERE wl.trainee_id = u.id
               AND wl.completed_at >= NOW() - INTERVAL '7 days'
              ) as "workoutsThisWeek"
       FROM users u
       LEFT JOIN streaks s ON s.trainee_id = u.id
       WHERE u.role = 'trainee' AND u.trainer_id = $1
       ORDER BY COALESCE(s.current_streak, 0) DESC`,
      [trainerId]
    );

    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaderboard/streak/:traineeId
router.get('/streak/:traineeId', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT trainee_id as "traineeId", current_streak as "currentStreak", longest_streak as "longestStreak" FROM streaks WHERE trainee_id = $1',
      [req.params.traineeId]
    );

    res.json(rows[0] || { traineeId: req.params.traineeId, currentStreak: 0, longestStreak: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
