import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/leaderboard
router.get('/', (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;

    // Scope leaderboard to the trainer's trainees only
    let trainerId: string;
    if (role === 'trainer') {
      trainerId = userId;
    } else {
      const trainee = db.prepare('SELECT trainer_id FROM users WHERE id = ?').get(userId) as any;
      trainerId = trainee?.trainer_id || userId;
    }

    const entries = db.prepare(
      `SELECT u.id as traineeId, u.name,
              COALESCE(s.current_streak, 0) as currentStreak,
              COALESCE(s.longest_streak, 0) as longestStreak,
              (SELECT COUNT(*) FROM workout_logs wl
               WHERE wl.trainee_id = u.id
               AND wl.completed_at >= datetime('now', '-7 days')
              ) as workoutsThisWeek
       FROM users u
       LEFT JOIN streaks s ON s.trainee_id = u.id
       WHERE u.role = 'trainee' AND u.trainer_id = ?
       ORDER BY COALESCE(s.current_streak, 0) DESC`
    ).all(trainerId);

    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaderboard/streak/:traineeId
router.get('/streak/:traineeId', (req: Request, res: Response) => {
  try {
    const streak = db.prepare(
      'SELECT trainee_id as traineeId, current_streak as currentStreak, longest_streak as longestStreak FROM streaks WHERE trainee_id = ?'
    ).get(req.params.traineeId);

    res.json(streak || { traineeId: req.params.traineeId, currentStreak: 0, longestStreak: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
