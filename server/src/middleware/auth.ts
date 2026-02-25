import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface AuthPayload {
  userId: string;
  role: 'trainer' | 'trainee';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

const secret: string = JWT_SECRET;

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, secret) as AuthPayload;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  try {
    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function trainerOnly(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'trainer') {
    res.status(403).json({ error: 'Trainer access required' });
    return;
  }
  next();
}
