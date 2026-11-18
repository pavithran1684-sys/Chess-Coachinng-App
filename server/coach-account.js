import bcrypt from 'bcryptjs'
import { email, httpError, password, text } from './validation.js'

const defaultTitle = 'Chess Coach & Mentor'
const defaultBio = 'I help students build strong chess fundamentals, think independently, and grow in confidence through structured lessons and thoughtful feedback.'

export function createInitialCoach(db, values = {}) {
  if (db.prepare('SELECT id FROM coaches ORDER BY id LIMIT 1').get()) {
    throw httpError(409, 'Coach setup has already been completed. Sign in with the existing coach account.')
  }

  const name = text(values.name, 'Coach name', { min: 2, max: 120 })
  const coachEmail = email(values.email)
  const coachPassword = password(values.password, 'Coach password')
  if (coachPassword.length < 12) throw httpError(400, 'Coach password must be at least 12 characters.')

  const passwordHash = bcrypt.hashSync(coachPassword, 12)
  const create = db.transaction(() => {
    // Recheck inside an immediate transaction so simultaneous setup requests
    // cannot create more than one initial administrator.
    if (db.prepare('SELECT id FROM coaches ORDER BY id LIMIT 1').get()) {
      throw httpError(409, 'Coach setup has already been completed. Sign in with the existing coach account.')
    }
    const result = db.prepare(`
      INSERT INTO coaches (name, email, password_hash, title, bio, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, coachEmail, passwordHash, defaultTitle, defaultBio, new Date().toISOString())
    return db.prepare('SELECT * FROM coaches WHERE id = ?').get(result.lastInsertRowid)
  })

  return create.immediate()
}
