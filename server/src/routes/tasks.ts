import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import { trainerOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/tasks — get tasks for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user!;

    if (role === 'trainer') {
      // Trainer sees all tasks they created
      const { rows: tasks } = await pool.query(
        'SELECT id, title, target_count as "targetCount", type FROM tasks WHERE created_by = $1 ORDER BY created_at DESC',
        [userId]
      );

      const result = [];
      for (const t of tasks) {
        const { rows: assignments } = await pool.query(
          `SELECT ta.trainee_id as "traineeId", ta.progress, ta.completed, u.name
           FROM task_assignments ta
           JOIN users u ON u.id = ta.trainee_id
           WHERE ta.task_id = $1`,
          [t.id]
        );
        result.push({ ...t, assignments });
      }

      res.json(result);
    } else {
      // Trainee sees tasks assigned to them
      const { rows } = await pool.query(
        `SELECT t.id, t.title, t.target_count as "targetCount", t.type,
                ta.progress, ta.completed
         FROM tasks t
         JOIN task_assignments ta ON ta.task_id = t.id
         WHERE ta.trainee_id = $1
         ORDER BY t.created_at DESC`,
        [userId]
      );

      res.json(rows);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/trainee/:traineeId — get a specific trainee's tasks
router.get('/trainee/:traineeId', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.title, t.target_count as "targetCount", t.type,
              ta.progress, ta.completed
       FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id
       WHERE ta.trainee_id = $1
       ORDER BY t.created_at DESC`,
      [req.params.traineeId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks — create task (trainer only)
router.post('/', trainerOnly, async (req: Request, res: Response) => {
  try {
    const { title, targetCount, assignAll } = req.body;
    const trainerId = req.user!.userId;

    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const taskId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO tasks (id, title, target_count, type, created_by) VALUES ($1, $2, $3, $4, $5)',
      [taskId, title, targetCount || 3, 'weekly', trainerId]
    );

    // Assign to trainees
    if (assignAll) {
      const { rows: trainees } = await pool.query(
        'SELECT id FROM users WHERE trainer_id = $1 AND role = $2',
        [trainerId, 'trainee']
      );

      for (const t of trainees) {
        await pool.query(
          'INSERT INTO task_assignments (task_id, trainee_id, progress, completed) VALUES ($1, $2, 0, 0)',
          [taskId, t.id]
        );
      }
    }

    res.status(201).json({ id: taskId, message: 'Task created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:taskId/progress — increment progress for current trainee
router.put('/:taskId/progress', async (req: Request, res: Response) => {
  try {
    const traineeId = req.user!.userId;
    const taskId = req.params.taskId;

    const { rows: assignmentRows } = await pool.query(
      'SELECT * FROM task_assignments WHERE task_id = $1 AND trainee_id = $2',
      [taskId, traineeId]
    );

    if (assignmentRows.length === 0) {
      res.status(404).json({ error: 'Task assignment not found' });
      return;
    }

    const assignment = assignmentRows[0];
    const { rows: taskRows } = await pool.query('SELECT target_count FROM tasks WHERE id = $1', [taskId]);
    const task = taskRows[0];
    const newProgress = assignment.progress + 1;
    const completed = newProgress >= task.target_count ? 1 : 0;

    await pool.query(
      'UPDATE task_assignments SET progress = $1, completed = $2 WHERE task_id = $3 AND trainee_id = $4',
      [newProgress, completed, taskId, traineeId]
    );

    // If just completed, update streak
    if (completed && !assignment.completed) {
      const { rows: streakRows } = await pool.query('SELECT * FROM streaks WHERE trainee_id = $1', [traineeId]);
      if (streakRows.length > 0) {
        const streak = streakRows[0];
        const newCurrent = streak.current_streak + 1;
        const newLongest = Math.max(streak.longest_streak, newCurrent);
        await pool.query(
          'UPDATE streaks SET current_streak = $1, longest_streak = $2 WHERE trainee_id = $3',
          [newCurrent, newLongest, traineeId]
        );
      }
    }

    res.json({ progress: newProgress, completed: !!completed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
