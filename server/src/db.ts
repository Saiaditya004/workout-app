import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'fitcoach.db');

const db: DatabaseType = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('trainer', 'trainee')),
      trainer_id TEXT,
      invite_code TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (trainer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sets INTEGER NOT NULL DEFAULT 3,
      target_reps INTEGER NOT NULL DEFAULT 10,
      target_weight REAL NOT NULL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trainee_assignments (
      trainee_id TEXT NOT NULL,
      program_id TEXT NOT NULL,
      assigned_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (trainee_id),
      FOREIGN KEY (trainee_id) REFERENCES users(id),
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      trainee_id TEXT NOT NULL,
      workout_id TEXT NOT NULL,
      completed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (trainee_id) REFERENCES users(id),
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    );

    CREATE TABLE IF NOT EXISTS exercise_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_log_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      set_index INTEGER NOT NULL,
      reps INTEGER NOT NULL DEFAULT 0,
      weight REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      target_count INTEGER NOT NULL DEFAULT 3,
      type TEXT NOT NULL DEFAULT 'weekly',
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
      task_id TEXT NOT NULL,
      trainee_id TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (task_id, trainee_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (trainee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS streaks (
      trainee_id TEXT PRIMARY KEY,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (trainee_id) REFERENCES users(id)
    );
  `);

  // Migration: add invite_code column if missing (for existing databases)
  const columns = db.prepare("PRAGMA table_info(users)").all() as any[];
  if (!columns.find((c: any) => c.name === 'invite_code')) {
    db.exec('ALTER TABLE users ADD COLUMN invite_code TEXT');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code)');
  }
}

export default db;
