import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import express from 'express'
import multer from 'multer'
import {
  createSession,
  destroySession,
  publicCoach,
  publicStudent,
  requireAuth,
  sessionMiddleware,
} from './auth.js'
import { createCoachRouter, createNotesFileHandler } from './coach-routes.js'
import { createDatabase } from './db.js'
import { createStudentRouter } from './student-routes.js'
import { httpError } from './validation.js'

export function createApp(options = {}) {
  const production = options.production ?? process.env.NODE_ENV === 'production'
  const { db, uploadDir } = createDatabase({ ...options, production })
  const app = express()
  const dummyHash = bcrypt.hashSync('not-a-valid-account-password', 12)

  app.disable('x-powered-by')
  if (production) app.set('trust proxy', 1)
  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'same-origin',
    })
    next()
  })
  app.use(express.json({ limit: '100kb' }))
  app.use(express.urlencoded({ extended: false, limit: '100kb' }))
  app.use(cookieParser())
  app.use(sessionMiddleware(db))

  const api = express.Router()
  api.get('/health', (_req, res) => res.json({ status: 'ok' }))

  api.post('/auth/login', (req, res) => {
    const role = req.body?.role
    const identifier = typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : ''
    const candidatePassword = typeof req.body?.password === 'string' ? req.body.password.trim() : ''
    if (role !== 'coach' && role !== 'student') throw httpError(400, 'Select coach or student login.')
    if (!identifier || identifier.length > 160 || !candidatePassword || candidatePassword.length > 128) {
      throw httpError(401, 'Invalid login details. Please try again.')
    }

    let account
    let user
    if (role === 'coach') {
      account = db.prepare('SELECT * FROM coaches WHERE email = ? COLLATE NOCASE').get(identifier)
      if (account) user = publicCoach(account)
    } else {
      account = db.prepare('SELECT * FROM students WHERE username = ? COLLATE NOCASE').get(identifier)
      if (!account) {
        const matches = db.prepare('SELECT * FROM students WHERE name = ? COLLATE NOCASE').all(identifier)
        if (matches.length === 1) account = matches[0]
        if (matches.length > 1) throw httpError(401, 'More than one student has this name. Use your unique username to sign in.')
      }
      if (account) {
        user = publicStudent({
          ...account,
          institution_name: db.prepare('SELECT name FROM institutions WHERE id = ?').get(account.institution_id)?.name,
        })
      }
    }

    const valid = bcrypt.compareSync(candidatePassword, account?.password_hash ?? dummyHash)
    if (!account || !valid) throw httpError(401, 'Invalid login details. Please try again.')

    destroySession(db, req, res, production)
    createSession(db, res, role, account.id, production)
    res.json({ user })
  })

  api.post('/auth/logout', (req, res) => {
    destroySession(db, req, res, production)
    res.status(204).end()
  })
  api.get('/auth/me', (req, res) => res.json({ user: req.user }))

  api.get('/notes/:id/file', requireAuth, createNotesFileHandler(db, uploadDir))
  api.use('/my', createStudentRouter(db))
  api.use(createCoachRouter(db, uploadDir))

  api.use((_req, res) => res.status(404).json({ error: 'API endpoint not found.' }))
  api.use((error, _req, res, next) => {
    if (res.headersSent) return next(error)
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE' ? 'The uploaded file must be 10 MB or smaller.' : 'Unable to process the uploaded file.'
      return res.status(400).json({ error: message })
    }
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return res.status(400).json({ error: 'The request body contains invalid JSON.' })
    }
    const status = Number.isInteger(error.status) ? error.status : 500
    if (status >= 500) console.error('ChessDesk API error:', error)
    res.status(status).json({ error: status >= 500 ? 'An unexpected server error occurred.' : error.message })
  })
  app.use('/api', api)

  if (production) {
    const distDir = path.resolve(options.distDir || 'dist')
    app.use(express.static(distDir, { index: false, maxAge: '1h' }))
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next()
      const indexFile = path.join(distDir, 'index.html')
      if (!fs.existsSync(indexFile)) return res.status(503).send('ChessDesk has not been built yet. Run npm run build first.')
      res.sendFile(indexFile)
    })
  }

  return {
    app,
    db,
    uploadDir,
    close: () => db.close(),
  }
}
