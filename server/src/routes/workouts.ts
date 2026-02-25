import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../db.js';

const router = Router();

// GET /api/workouts/:workoutId — get a single workout with exercises
router.get('/:workoutId', async (req: Request, res: Response) => {
  try {
    const { rows: workoutRows } = await pool.query('SELECT * FROM workouts WHERE id = $1', [req.params.workoutId]);
    if (workoutRows.length === 0) {
      res.status(404).json({ error: 'Workout not found' });
      return;
    }

    const workout = workoutRows[0];
    const { rows: exercises } = await pool.query(
      'SELECT id, name, sets, target_reps as "targetReps", target_weight as "targetWeight" FROM exercises WHERE workout_id = $1 ORDER BY sort_order',
      [workout.id]
    );

    res.json({ id: workout.id, name: workout.name, programId: workout.program_id, exercises });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/workouts/log — log a completed workout
router.post('/log', async (req: Request, res: Response) => {
  try {
    const { workoutId, exercisesLogged } = req.body;
    const traineeId = req.user!.userId;

    if (!workoutId) {
      res.status(400).json({ error: 'workoutId is required' });
      return;
    }

    const logId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO workout_logs (id, trainee_id, workout_id) VALUES ($1, $2, $3)',
      [logId, traineeId, workoutId]
    );

    // Insert exercise logs
    if (Array.isArray(exercisesLogged)) {
      for (const exLog of exercisesLogged) {
        if (Array.isArray(exLog.sets)) {
          for (let idx = 0; idx < exLog.sets.length; idx++) {
            const s = exLog.sets[idx];
            await pool.query(
              'INSERT INTO exercise_logs (workout_log_id, exercise_id, set_index, reps, weight) VALUES ($1, $2, $3, $4, $5)',
              [logId, exLog.exerciseId, idx, s.reps || 0, s.weight || 0]
            );
          }
        }
      }
    }

    res.status(201).json({ id: logId, message: 'Workout logged' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workouts/logs/:traineeId — get workout logs for a trainee
router.get('/logs/:traineeId', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT wl.id, wl.trainee_id as "traineeId", wl.workout_id as "workoutId",
              wl.completed_at as "completedAt", w.name as "workoutName"
       FROM workout_logs wl
       LEFT JOIN workouts w ON w.id = wl.workout_id
       WHERE wl.trainee_id = $1
       ORDER BY wl.completed_at DESC`,
      [req.params.traineeId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
