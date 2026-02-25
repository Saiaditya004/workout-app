import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db.js';
import { signToken, verifyToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password, name, role, trainerId } = req.body;

    if (!email || !password || !name || !role) {
      res.status(400).json({ error: 'email, password, name, and role are required' });
      return;
    }

    if (!['trainer', 'trainee'].includes(role)) {
      res.status(400).json({ error: 'role must be trainer or trainee' });
      return;
    }

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const id = crypto.randomUUID();
    const hashedPassword = bcrypt.hashSync(password, 10);

    let resolvedTrainerId: string | null = null;
    let inviteCode: string | null = null;

    if (role === 'trainer') {
      // Generate a unique 6-char invite code for trainers
      inviteCode = crypto.randomUUID().slice(0, 6).toUpperCase();
    }

    if (role === 'trainee') {
      const { inviteCode: code } = req.body;
      if (!code) {
        res.status(400).json({ error: 'Invite code is required for trainees' });
        return;
      }
      const trainer = db.prepare(
        'SELECT id FROM users WHERE invite_code = ? AND role = ?'
      ).get(code.toUpperCase(), 'trainer') as any;
      if (!trainer) {
        res.status(400).json({ error: 'Invalid invite code' });
        return;
      }
      resolvedTrainerId = trainer.id;
    }

    db.prepare(
      'INSERT INTO users (id, email, password, name, role, trainer_id, invite_code) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, email.toLowerCase(), hashedPassword, name, role, resolvedTrainerId, inviteCode);

    // Create streak record for trainees
    if (role === 'trainee') {
      db.prepare('INSERT INTO streaks (trainee_id, current_streak, longest_streak) VALUES (?, 0, 0)').run(id);
    }

    const token = signToken({ userId: id, role });
    const user = { id, email, name, role, trainerId: resolvedTrainerId, inviteCode };

    res.status(201).json({ token, user });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const user = db.prepare(
      'SELECT id, email, password, name, role, trainer_id as trainerId, invite_code as inviteCode FROM users WHERE email = ?'
    ).get(email.toLowerCase()) as any;

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role });
    const { password: _, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response) => {
  // This is called with auth middleware from the main router
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const payload = verifyToken(header.slice(7));

    const user = db.prepare(
      'SELECT id, email, name, role, trainer_id as trainerId, invite_code as inviteCode FROM users WHERE id = ?'
    ).get(payload.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
