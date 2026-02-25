import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../db.js';

const router = Router();

// GET /api/workouts/:workoutId — get a single workout with exercises
router.get('/:workoutId', (req: Request, res: Response) => {
  try {
    const workout = db.prepare('SELECT * FROM workouts WHERE id = ?').get(req.params.workoutId) as any;
    if (!workout) {
      res.status(404).json({ error: 'Workout not found' });
      return;
    }

    const exercises = db.prepare(
      'SELECT id, name, sets, target_reps as targetReps, target_weight as targetWeight FROM exercises WHERE workout_id = ? ORDER BY sort_order'
    ).all(workout.id);

    res.json({ id: workout.id, name: workout.name, programId: workout.program_id, exercises });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/workouts/log — log a completed workout
router.post('/log', (req: Request, res: Response) => {
  try {
    const { workoutId, exercisesLogged } = req.body;
    const traineeId = req.user!.userId;

    if (!workoutId) {
      res.status(400).json({ error: 'workoutId is required' });
      return;
    }

    const logId = crypto.randomUUID();
    db.prepare(
      'INSERT INTO workout_logs (id, trainee_id, workout_id) VALUES (?, ?, ?)'
    ).run(logId, traineeId, workoutId);

    // Insert exercise logs
    if (Array.isArray(exercisesLogged)) {
      const insertExLog = db.prepare(
        'INSERT INTO exercise_logs (workout_log_id, exercise_id, set_index, reps, weight) VALUES (?, ?, ?, ?, ?)'
      );
      exercisesLogged.forEach((exLog: any) => {
        if (Array.isArray(exLog.sets)) {
          exLog.sets.forEach((s: any, idx: number) => {
            insertExLog.run(logId, exLog.exerciseId, idx, s.reps || 0, s.weight || 0);
          });
        }
      });
    }

    res.status(201).json({ id: logId, message: 'Workout logged' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workouts/logs/:traineeId — get workout logs for a trainee
router.get('/logs/:traineeId', (req: Request, res: Response) => {
  try {
    const logs = db.prepare(
      `SELECT wl.id, wl.trainee_id as traineeId, wl.workout_id as workoutId,
              wl.completed_at as completedAt, w.name as workoutName
       FROM workout_logs wl
       LEFT JOIN workouts w ON w.id = wl.workout_id
       WHERE wl.trainee_id = ?
       ORDER BY wl.completed_at DESC`
    ).all(req.params.traineeId);

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
