import { Router, Request, Response } from 'express';
import db from '../db.js';
import { trainerOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/users — trainer gets their trainees
router.get('/', (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;

    if (role === 'trainer') {
      const trainees = db.prepare(
        `SELECT u.id, u.email, u.name, u.role, u.trainer_id as trainerId,
                COALESCE(s.current_streak, 0) as currentStreak,
                COALESCE(s.longest_streak, 0) as longestStreak
         FROM users u
         LEFT JOIN streaks s ON s.trainee_id = u.id
         WHERE u.trainer_id = ?`
      ).all(userId);
      res.json(trainees);
    } else {
      // Trainee can see themselves
      const user = db.prepare(
        'SELECT id, email, name, role, trainer_id as trainerId FROM users WHERE id = ?'
      ).get(userId);
      res.json([user]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const user = db.prepare(
      `SELECT u.id, u.email, u.name, u.role, u.trainer_id as trainerId,
              COALESCE(s.current_streak, 0) as currentStreak,
              COALESCE(s.longest_streak, 0) as longestStreak
       FROM users u
       LEFT JOIN streaks s ON s.trainee_id = u.id
       WHERE u.id = ?`
    ).get(req.params.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
