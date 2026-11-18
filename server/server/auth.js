import crypto from 'node:crypto'
import { now } from './db.js'

export const SESSION_COOKIE = 'chessdesk_session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function publicCoach(row) {
  return { id: row.id, role: 'coach', name: row.name, email: row.email }
}

export function publicStudent(row) {
  return {
    id: row.id,
    role: 'student',
    name: row.name,
    username: row.username,
    institutionId: row.institution_id,
    institutionName: row.institution_name,
  }
}

export function createSession(db, res, role, userId, production) {
  const token = crypto.randomBytes(32).toString('base64url')
  const createdAt = now()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(createdAt)
  db.prepare('INSERT INTO sessions (token_hash, role, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(hashToken(token), role, userId, expiresAt, createdAt)
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_MS,
  })
}

export function destroySession(db, req, res, production) {
  const token = req.cookies?.[SESSION_COOKIE]
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token))
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: production, sameSite: 'lax', path: '/' })
}

export function sessionMiddleware(db) {
  return (req, _res, next) => {
    req.user = null
    const token = req.cookies?.[SESSION_COOKIE]
    if (!token) return next()

    const session = db.prepare('SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?').get(hashToken(token), now())
    if (!session) return next()

    if (session.role === 'coach') {
      const coach = db.prepare('SELECT id, name, email FROM coaches WHERE id = ?').get(session.user_id)
      if (coach) req.user = publicCoach(coach)
    } else if (session.role === 'student') {
      const student = db.prepare(`
        SELECT s.id, s.name, s.username, s.institution_id, i.name AS institution_name
        FROM students s JOIN institutions i ON i.id = s.institution_id
        WHERE s.id = ?
      `).get(session.user_id)
      if (student) req.user = publicStudent(student)
    }

    next()
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' })
  next()
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' })
    if (req.user.role !== role) return res.status(403).json({ error: 'You do not have permission to access this resource.' })
    next()
  }
}
