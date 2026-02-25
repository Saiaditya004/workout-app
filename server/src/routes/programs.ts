import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { trainerOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/programs — list programs (scoped to trainer's own programs)
router.get('/', (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;

    // Trainers see only their own programs; trainees see their trainer's programs
    let programs: any[];
    if (role === 'trainer') {
      programs = db.prepare('SELECT * FROM programs WHERE created_by = ? ORDER BY created_at DESC').all(userId) as any[];
    } else {
      // Get the trainee's trainer, then their programs
      const trainee = db.prepare('SELECT trainer_id FROM users WHERE id = ?').get(userId) as any;
      if (trainee?.trainer_id) {
        programs = db.prepare('SELECT * FROM programs WHERE created_by = ? ORDER BY created_at DESC').all(trainee.trainer_id) as any[];
      } else {
        programs = [];
      }
    }

    // Attach workouts + exercises to each program
    const result = programs.map((p) => {
      const workouts = db.prepare(
        'SELECT * FROM workouts WHERE program_id = ? ORDER BY sort_order'
      ).all(p.id) as any[];

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        createdBy: p.created_by,
        workouts: workouts.map((w) => {
          const exercises = db.prepare(
            'SELECT id, name, sets, target_reps as targetReps, target_weight as targetWeight FROM exercises WHERE workout_id = ? ORDER BY sort_order'
          ).all(w.id);
          return { id: w.id, name: w.name, exercises };
        }),
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/programs — create program (trainer only)
router.post('/', trainerOnly, (req: Request, res: Response) => {
  try {
    const { name, description, workouts } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const programId = crypto.randomUUID();
    db.prepare(
      'INSERT INTO programs (id, name, description, created_by) VALUES (?, ?, ?, ?)'
    ).run(programId, name, description || '', req.user!.userId);

    // Insert workouts + exercises
    if (Array.isArray(workouts)) {
      const insertWorkout = db.prepare(
        'INSERT INTO workouts (id, program_id, name, sort_order) VALUES (?, ?, ?, ?)'
      );
      const insertExercise = db.prepare(
        'INSERT INTO exercises (id, workout_id, name, sets, target_reps, target_weight, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );

      workouts.forEach((w: any, wIdx: number) => {
        const workoutId = crypto.randomUUID();
        insertWorkout.run(workoutId, programId, w.name || `Workout ${wIdx + 1}`, wIdx);

        if (Array.isArray(w.exercises)) {
          w.exercises.forEach((ex: any, eIdx: number) => {
            insertExercise.run(
              crypto.randomUUID(),
              workoutId,
              ex.name || `Exercise ${eIdx + 1}`,
              ex.sets || 3,
              ex.targetReps || 10,
              ex.targetWeight || 0,
              eIdx
            );
          });
        }
      });
    }

    res.status(201).json({ id: programId, message: 'Program created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/programs/assign — assign trainee to program  
router.put('/assign', trainerOnly, (req: Request, res: Response) => {
  try {
    const { traineeId, programId } = req.body;
    if (!traineeId || !programId) {
      res.status(400).json({ error: 'traineeId and programId are required' });
      return;
    }

    // Upsert
    db.prepare(
      `INSERT INTO trainee_assignments (trainee_id, program_id)
       VALUES (?, ?)
       ON CONFLICT(trainee_id) DO UPDATE SET program_id = excluded.program_id, assigned_at = datetime('now')`
    ).run(traineeId, programId);

    res.json({ message: 'Program assigned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/programs/assigned/:traineeId — get trainee's assigned program
router.get('/assigned/:traineeId', (req: Request, res: Response) => {
  try {
    const assignment = db.prepare(
      'SELECT program_id FROM trainee_assignments WHERE trainee_id = ?'
    ).get(req.params.traineeId) as any;

    if (!assignment) {
      res.json(null);
      return;
    }

    // Return full program
    const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(assignment.program_id) as any;
    if (!program) {
      res.json(null);
      return;
    }

    const workouts = db.prepare(
      'SELECT * FROM workouts WHERE program_id = ? ORDER BY sort_order'
    ).all(program.id) as any[];

    const result = {
      id: program.id,
      name: program.name,
      description: program.description,
      workouts: workouts.map((w) => {
        const exercises = db.prepare(
          'SELECT id, name, sets, target_reps as targetReps, target_weight as targetWeight FROM exercises WHERE workout_id = ? ORDER BY sort_order'
        ).all(w.id);
        return { id: w.id, name: w.name, exercises };
      }),
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
