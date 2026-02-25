import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { trainerOnly } from '../middleware/auth.js';

const router = Router();

// GET /api/tasks — get tasks for current user
router.get('/', (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user!;

    if (role === 'trainer') {
      // Trainer sees all tasks they created
      const tasks = db.prepare(
        'SELECT id, title, target_count as targetCount, type FROM tasks WHERE created_by = ? ORDER BY created_at DESC'
      ).all(userId) as any[];

      const result = tasks.map((t) => {
        const assignments = db.prepare(
          `SELECT ta.trainee_id as traineeId, ta.progress, ta.completed, u.name
           FROM task_assignments ta
           JOIN users u ON u.id = ta.trainee_id
           WHERE ta.task_id = ?`
        ).all(t.id);
        return { ...t, assignments };
      });

      res.json(result);
    } else {
      // Trainee sees tasks assigned to them
      const tasks = db.prepare(
        `SELECT t.id, t.title, t.target_count as targetCount, t.type,
                ta.progress, ta.completed
         FROM tasks t
         JOIN task_assignments ta ON ta.task_id = t.id
         WHERE ta.trainee_id = ?
         ORDER BY t.created_at DESC`
      ).all(userId);

      res.json(tasks);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/trainee/:traineeId — get a specific trainee's tasks
router.get('/trainee/:traineeId', (req: Request, res: Response) => {
  try {
    const tasks = db.prepare(
      `SELECT t.id, t.title, t.target_count as targetCount, t.type,
              ta.progress, ta.completed
       FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id
       WHERE ta.trainee_id = ?
       ORDER BY t.created_at DESC`
    ).all(req.params.traineeId);

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks — create task (trainer only)
router.post('/', trainerOnly, (req: Request, res: Response) => {
  try {
    const { title, targetCount, assignAll } = req.body;
    const trainerId = req.user!.userId;

    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const taskId = crypto.randomUUID();
    db.prepare(
      'INSERT INTO tasks (id, title, target_count, type, created_by) VALUES (?, ?, ?, ?, ?)'
    ).run(taskId, title, targetCount || 3, 'weekly', trainerId);

    // Assign to trainees
    if (assignAll) {
      const trainees = db.prepare(
        'SELECT id FROM users WHERE trainer_id = ? AND role = ?'
      ).all(trainerId, 'trainee') as any[];

      const insert = db.prepare(
        'INSERT INTO task_assignments (task_id, trainee_id, progress, completed) VALUES (?, ?, 0, 0)'
      );

      trainees.forEach((t) => insert.run(taskId, t.id));
    }

    res.status(201).json({ id: taskId, message: 'Task created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:taskId/progress — increment progress for current trainee
router.put('/:taskId/progress', (req: Request, res: Response) => {
  try {
    const traineeId = req.user!.userId;
    const taskId = req.params.taskId;

    const assignment = db.prepare(
      'SELECT * FROM task_assignments WHERE task_id = ? AND trainee_id = ?'
    ).get(taskId, traineeId) as any;

    if (!assignment) {
      res.status(404).json({ error: 'Task assignment not found' });
      return;
    }

    const task = db.prepare('SELECT target_count FROM tasks WHERE id = ?').get(taskId) as any;
    const newProgress = assignment.progress + 1;
    const completed = newProgress >= task.target_count ? 1 : 0;

    db.prepare(
      'UPDATE task_assignments SET progress = ?, completed = ? WHERE task_id = ? AND trainee_id = ?'
    ).run(newProgress, completed, taskId, traineeId);

    // If just completed, update streak
    if (completed && !assignment.completed) {
      const streak = db.prepare('SELECT * FROM streaks WHERE trainee_id = ?').get(traineeId) as any;
      if (streak) {
        const newCurrent = streak.current_streak + 1;
        const newLongest = Math.max(streak.longest_streak, newCurrent);
        db.prepare(
          'UPDATE streaks SET current_streak = ?, longest_streak = ? WHERE trainee_id = ?'
        ).run(newCurrent, newLongest, traineeId);
      }
    }

    res.json({ progress: newProgress, completed: !!completed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
