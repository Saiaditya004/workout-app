import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import { trainerOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/programs — list programs (scoped to trainer's own programs)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;

    // Trainers see only their own programs; trainees see their trainer's programs
    let programs: any[];
    if (role === 'trainer') {
      const { rows } = await pool.query('SELECT * FROM programs WHERE created_by = $1 ORDER BY created_at DESC', [userId]);
      programs = rows;
    } else {
      const { rows: traineeRows } = await pool.query('SELECT trainer_id FROM users WHERE id = $1', [userId]);
      if (traineeRows[0]?.trainer_id) {
        const { rows } = await pool.query('SELECT * FROM programs WHERE created_by = $1 ORDER BY created_at DESC', [traineeRows[0].trainer_id]);
        programs = rows;
      } else {
        programs = [];
      }
    }

    // Attach workouts + exercises to each program
    const result = [];
    for (const p of programs) {
      const { rows: workouts } = await pool.query(
        'SELECT * FROM workouts WHERE program_id = $1 ORDER BY sort_order', [p.id]
      );

      const workoutsWithExercises = [];
      for (const w of workouts) {
        const { rows: exercises } = await pool.query(
          'SELECT id, name, sets, target_reps as "targetReps", target_weight as "targetWeight" FROM exercises WHERE workout_id = $1 ORDER BY sort_order',
          [w.id]
        );
        workoutsWithExercises.push({ id: w.id, name: w.name, exercises });
      }

      result.push({
        id: p.id,
        name: p.name,
        description: p.description,
        createdBy: p.created_by,
        workouts: workoutsWithExercises,
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/programs — create program (trainer only)
router.post('/', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { name, description, workouts } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const programId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO programs (id, name, description, created_by) VALUES ($1, $2, $3, $4)',
      [programId, name, description || '', req.user!.userId]
    );

    // Insert workouts + exercises
    if (Array.isArray(workouts)) {
      for (let wIdx = 0; wIdx < workouts.length; wIdx++) {
        const w = workouts[wIdx];
        const workoutId = crypto.randomUUID();
        await pool.query(
          'INSERT INTO workouts (id, program_id, name, sort_order) VALUES ($1, $2, $3, $4)',
          [workoutId, programId, w.name || `Workout ${wIdx + 1}`, wIdx]
        );

        if (Array.isArray(w.exercises)) {
          for (let eIdx = 0; eIdx < w.exercises.length; eIdx++) {
            const ex = w.exercises[eIdx];
            await pool.query(
              'INSERT INTO exercises (id, workout_id, name, sets, target_reps, target_weight, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7)',
              [crypto.randomUUID(), workoutId, ex.name || `Exercise ${eIdx + 1}`, ex.sets || 3, ex.targetReps || 10, ex.targetWeight || 0, eIdx]
            );
          }
        }
      }
    }

    res.status(201).json({ id: programId, message: 'Program created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/programs/assign — assign trainee to program  
router.put('/assign', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { traineeId, programId } = req.body;
    if (!traineeId || !programId) {
      res.status(400).json({ error: 'traineeId and programId are required' });
      return;
    }

    // Upsert
    await pool.query(
      `INSERT INTO trainee_assignments (trainee_id, program_id)
       VALUES ($1, $2)
       ON CONFLICT(trainee_id) DO UPDATE SET program_id = EXCLUDED.program_id, assigned_at = NOW()`,
      [traineeId, programId]
    );

    res.json({ message: 'Program assigned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/programs/assigned/:traineeId — get trainee's assigned program
router.get('/assigned/:traineeId', async (req: Request, res: Response) => {
  try {
    const { rows: assignmentRows } = await pool.query(
      'SELECT program_id FROM trainee_assignments WHERE trainee_id = $1',
      [req.params.traineeId]
    );

    if (assignmentRows.length === 0) {
      res.json(null);
      return;
    }

    const { rows: programRows } = await pool.query(
      'SELECT * FROM programs WHERE id = $1', [assignmentRows[0].program_id]
    );
    if (programRows.length === 0) {
      res.json(null);
      return;
    }

    const program = programRows[0];
    const { rows: workouts } = await pool.query(
      'SELECT * FROM workouts WHERE program_id = $1 ORDER BY sort_order', [program.id]
    );

    const workoutsWithExercises = [];
    for (const w of workouts) {
      const { rows: exercises } = await pool.query(
        'SELECT id, name, sets, target_reps as "targetReps", target_weight as "targetWeight" FROM exercises WHERE workout_id = $1 ORDER BY sort_order',
        [w.id]
      );
      workoutsWithExercises.push({ id: w.id, name: w.name, exercises });
    }

    const result = {
      id: program.id,
      name: program.name,
      description: program.description,
      workouts: workoutsWithExercises,
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
