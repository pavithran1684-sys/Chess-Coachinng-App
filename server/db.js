import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'

const schema = `
  CREATE TABLE IF NOT EXISTS coaches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Chess Coach & Mentor',
    bio TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS institutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age BETWEEN 3 AND 100),
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    school_name TEXT,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('coach', 'student')),
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(role, user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS concept_institutions (
    concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    PRIMARY KEY (concept_id, institution_id)
  );

  CREATE TABLE IF NOT EXISTS concept_completions (
    concept_id INTEGER NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    completed_at TEXT NOT NULL,
    PRIMARY KEY (concept_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tournament_date TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 1),
    total_rounds INTEGER NOT NULL CHECK (total_rounds >= 1),
    score REAL NOT NULL CHECK (score >= 0),
    performance_level TEXT NOT NULL CHECK (performance_level IN ('Poor', 'Average', 'Good', 'Excellent')),
    coach_remarks TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tournaments_student ON tournaments(student_id, tournament_date, id);

  CREATE TABLE IF NOT EXISTS class_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_date TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_notes_institution ON class_notes(institution_id, class_date DESC);

  CREATE TABLE IF NOT EXISTS homework (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    due_date TEXT NOT NULL,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_homework_institution ON homework(institution_id, due_date);

  CREATE TABLE IF NOT EXISTS homework_completions (
    homework_id INTEGER NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    completed_at TEXT NOT NULL,
    PRIMARY KEY (homework_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS class_calendar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_date TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    completed_at TEXT,
    created_at TEXT NOT NULL,
    UNIQUE (institution_id, class_date)
  );
  CREATE INDEX IF NOT EXISTS idx_calendar_date ON class_calendar(class_date);
`

export function now() {
  return new Date().toISOString()
}

export function createDatabase(options = {}) {
  const databasePath = options.databasePath || process.env.DATABASE_PATH || path.resolve('data/chessdesk.db')
  const uploadDir = path.resolve(options.uploadDir || process.env.UPLOAD_DIR || 'data/uploads')
  const production = options.production ?? process.env.NODE_ENV === 'production'

  if (databasePath !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true })
  fs.mkdirSync(uploadDir, { recursive: true })

  const db = new Database(databasePath)
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  if (databasePath !== ':memory:') db.pragma('journal_mode = WAL')
  db.exec(schema)

  const existingCoach = db.prepare('SELECT id FROM coaches ORDER BY id LIMIT 1').get()
  if (!existingCoach) {
    const email = String(options.coachEmail || process.env.COACH_EMAIL || (production ? '' : 'coach@chessdesk.local')).trim().toLowerCase()
    const password = String(options.coachPassword || process.env.COACH_PASSWORD || (production ? '' : 'Coach@123'))
    const name = String(options.coachName || process.env.COACH_NAME || 'Chess Coach').trim()

    if (!email || !password) {
      db.close()
      throw new Error('COACH_EMAIL and COACH_PASSWORD are required to create the initial production coach account.')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      db.close()
      throw new Error('COACH_EMAIL must be a valid email address.')
    }
    if (password.length < (production ? 12 : 8) || Buffer.byteLength(password) > 72) {
      db.close()
      throw new Error(`COACH_PASSWORD must be at least ${production ? 12 : 8} characters and no more than 72 UTF-8 bytes.`)
    }

    db.prepare(`
      INSERT INTO coaches (name, email, password_hash, title, bio, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name || 'Chess Coach',
      email,
      bcrypt.hashSync(password, 12),
      'Chess Coach & Mentor',
      'I help students build strong chess fundamentals, think independently, and grow in confidence through structured lessons and thoughtful feedback.',
      now(),
    )
  }

  return { db, uploadDir }
}
