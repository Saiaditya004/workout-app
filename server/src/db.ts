import pg from 'pg';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();

// Force ALL DNS lookups to IPv4 — Render cannot reach Supabase over IPv6
dns.setDefaultResultOrder('ipv4first');
const origLookup = dns.lookup.bind(dns);
(dns as any).lookup = (hostname: string, options: any, cb: any) => {
  if (typeof options === 'function') {
    cb = options;
    options = { family: 4 };
  } else {
    options = { ...options, family: 4 };
  }
  return origLookup(hostname, options, cb);
};

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
});

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('trainer', 'trainee')),
        trainer_id TEXT REFERENCES users(id),
        invite_code TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS programs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY,
        program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sets INTEGER NOT NULL DEFAULT 3,
        target_reps INTEGER NOT NULL DEFAULT 10,
        target_weight DOUBLE PRECISION NOT NULL DEFAULT 0,
        sort_order INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS trainee_assignments (
        trainee_id TEXT PRIMARY KEY REFERENCES users(id),
        program_id TEXT NOT NULL REFERENCES programs(id),
        assigned_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workout_logs (
        id TEXT PRIMARY KEY,
        trainee_id TEXT NOT NULL REFERENCES users(id),
        workout_id TEXT NOT NULL REFERENCES workouts(id),
        completed_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS exercise_logs (
        id SERIAL PRIMARY KEY,
        workout_log_id TEXT NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
        exercise_id TEXT NOT NULL REFERENCES exercises(id),
        set_index INTEGER NOT NULL,
        reps INTEGER NOT NULL DEFAULT 0,
        weight DOUBLE PRECISION NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        target_count INTEGER NOT NULL DEFAULT 3,
        type TEXT NOT NULL DEFAULT 'weekly',
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS task_assignments (
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        trainee_id TEXT NOT NULL REFERENCES users(id),
        progress INTEGER NOT NULL DEFAULT 0,
        completed INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (task_id, trainee_id)
      );

      CREATE TABLE IF NOT EXISTS streaks (
        trainee_id TEXT PRIMARY KEY REFERENCES users(id),
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0
      );
    `);
  } finally {
    client.release();
  }
}

export default pool;
