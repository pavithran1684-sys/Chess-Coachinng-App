import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { Router } from 'express'
import { requireRole } from './auth.js'
import { now } from './db.js'
import {
  asyncRoute,
  date,
  email,
  httpError,
  id,
  institutionExists,
  integer,
  month,
  number,
  password,
  text,
} from './validation.js'

const allowedFiles = new Map([
  ['.pdf', ['application/pdf']],
  ['.png', ['image/png']],
  ['.jpg', ['image/jpeg', 'image/jpg']],
  ['.jpeg', ['image/jpeg', 'image/jpg']],
  ['.webp', ['image/webp']],
  ['.gif', ['image/gif']],
  ['.txt', ['text/plain']],
  ['.doc', ['application/msword']],
  ['.docx', ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']],
  ['.ppt', ['application/vnd.ms-powerpoint']],
  ['.pptx', ['application/vnd.openxmlformats-officedocument.presentationml.presentation']],
])

const institutionSelect = `
  SELECT i.id, i.name, i.created_at, COUNT(s.id) AS student_count
  FROM institutions i LEFT JOIN students s ON s.institution_id = i.id
`
const studentSelect = `
  SELECT s.id, s.name, s.age, s.institution_id, i.name AS institution_name,
         s.school_name, s.username, s.created_at
  FROM students s JOIN institutions i ON i.id = s.institution_id
`

function institutionDto(row) {
  return { id: row.id, name: row.name, studentCount: row.student_count, createdAt: row.created_at }
}

function studentDto(row) {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    institutionId: row.institution_id,
    institutionName: row.institution_name,
    schoolName: row.school_name,
    username: row.username,
    createdAt: row.created_at,
  }
}

function conceptDto(db, row) {
  const institutions = db.prepare(`
    SELECT i.id, i.name FROM concept_institutions ci
    JOIN institutions i ON i.id = ci.institution_id
    WHERE ci.concept_id = ? ORDER BY i.name
  `).all(row.id)
  const assignedStudentCount = db.prepare(`
    SELECT COUNT(*) AS count FROM students s
    JOIN concept_institutions ci ON ci.institution_id = s.institution_id
    WHERE ci.concept_id = ?
  `).get(row.id).count
  const completedCount = db.prepare(`
    SELECT COUNT(*) AS count FROM concept_completions cc
    JOIN students s ON s.id = cc.student_id
    JOIN concept_institutions ci ON ci.concept_id = cc.concept_id AND ci.institution_id = s.institution_id
    WHERE cc.concept_id = ?
  `).get(row.id).count
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    institutionIds: institutions.map((item) => item.id),
    institutionNames: institutions.map((item) => item.name),
    assignedStudentCount,
    completedCount,
    createdAt: row.created_at,
  }
}

function noteDto(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    institutionId: row.institution_id,
    institutionName: row.institution_name,
    classDate: row.class_date,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    uploadedAt: row.uploaded_at,
  }
}

function homeworkDto(row) {
  return {
    id: row.id,
    title: row.title,
    instructions: row.instructions,
    dueDate: row.due_date,
    institutionId: row.institution_id,
    institutionName: row.institution_name,
    published: Boolean(row.published),
    createdAt: row.created_at,
  }
}

export function tournamentDto(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    name: row.name,
    tournamentDate: row.tournament_date,
    position: row.position,
    totalRounds: row.total_rounds,
    score: row.score,
    performanceLevel: row.performance_level,
    coachRemarks: row.coach_remarks,
    createdAt: row.created_at,
  }
}

function calendarDto(row) {
  return {
    id: row.id,
    institutionId: row.institution_id,
    institutionName: row.institution_name,
    classDate: row.class_date,
    completed: Boolean(row.completed),
    completedAt: row.completed_at,
  }
}

function uniqueUsername(db, name) {
  const base = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '').slice(0, 48) || 'student'
  let candidate = base
  let suffix = 2
  while (db.prepare('SELECT 1 FROM students WHERE username = ? COLLATE NOCASE').get(candidate)) {
    candidate = `${base}.${suffix}`
    suffix += 1
  }
  return candidate
}

function requireInstitution(db, value) {
  const institutionId = id(value, 'Institution')
  if (!institutionExists(db, institutionId)) throw httpError(400, 'Select a valid institution.')
  return institutionId
}

function getNote(db, noteId) {
  return db.prepare(`
    SELECT n.*, i.name AS institution_name FROM class_notes n
    JOIN institutions i ON i.id = n.institution_id WHERE n.id = ?
  `).get(noteId)
}

export function createCoachRouter(db, uploadDir) {
  const router = Router()
  router.use(requireRole('coach'))

  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDir),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase()
      callback(null, `${crypto.randomUUID()}${extension}`)
    },
  })
  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 10 },
    fileFilter: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase()
      const mimeTypes = allowedFiles.get(extension)
      if (!mimeTypes || !mimeTypes.includes(file.mimetype)) {
        return callback(httpError(415, 'Upload a PDF, PNG, JPG, WEBP, GIF, TXT, DOC, DOCX, PPT, or PPTX file.'))
      }
      callback(null, true)
    },
  })

  router.get('/dashboard', (_req, res) => {
    res.json({
      totalStudents: db.prepare('SELECT COUNT(*) AS count FROM students').get().count,
      totalInstitutions: db.prepare('SELECT COUNT(*) AS count FROM institutions').get().count,
    })
  })

  router.get('/institutions', (_req, res) => {
    const rows = db.prepare(`${institutionSelect} GROUP BY i.id ORDER BY i.name`).all()
    res.json(rows.map(institutionDto))
  })

  router.post('/institutions', (req, res) => {
    const name = text(req.body?.name, 'Institution name', { min: 2, max: 120 })
    if (db.prepare('SELECT 1 FROM institutions WHERE name = ? COLLATE NOCASE').get(name)) {
      throw httpError(409, 'An institution with this name already exists.')
    }
    const result = db.prepare('INSERT INTO institutions (name, created_at) VALUES (?, ?)').run(name, now())
    const row = db.prepare(`${institutionSelect} WHERE i.id = ? GROUP BY i.id`).get(result.lastInsertRowid)
    res.status(201).json(institutionDto(row))
  })

  router.put('/institutions/:id', (req, res) => {
    const institutionId = id(req.params.id, 'Institution')
    const name = text(req.body?.name, 'Institution name', { min: 2, max: 120 })
    if (!institutionExists(db, institutionId)) throw httpError(404, 'Institution not found.')
    if (db.prepare('SELECT 1 FROM institutions WHERE name = ? COLLATE NOCASE AND id <> ?').get(name, institutionId)) {
      throw httpError(409, 'An institution with this name already exists.')
    }
    db.prepare('UPDATE institutions SET name = ? WHERE id = ?').run(name, institutionId)
    const row = db.prepare(`${institutionSelect} WHERE i.id = ? GROUP BY i.id`).get(institutionId)
    res.json(institutionDto(row))
  })

  router.delete('/institutions/:id', asyncRoute(async (req, res) => {
    const institutionId = id(req.params.id, 'Institution')
    if (!institutionExists(db, institutionId)) throw httpError(404, 'Institution not found.')
    const studentCount = db.prepare('SELECT COUNT(*) AS count FROM students WHERE institution_id = ?').get(institutionId).count
    if (studentCount > 0) throw httpError(409, 'Reassign or remove this institution’s students before deleting it.')
    const files = db.prepare('SELECT stored_filename FROM class_notes WHERE institution_id = ?').all(institutionId)
    db.prepare('DELETE FROM institutions WHERE id = ?').run(institutionId)
    await Promise.all(files.map((file) => fs.promises.unlink(path.join(uploadDir, file.stored_filename)).catch(() => {})))
    res.status(204).end()
  }))

  router.get('/students', (_req, res) => {
    res.json(db.prepare(`${studentSelect} ORDER BY s.name, s.id`).all().map(studentDto))
  })

  router.post('/students', (req, res) => {
    const name = text(req.body?.name, 'Student name', { min: 2, max: 120 })
    const age = integer(req.body?.age, 'Age', { min: 3, max: 100 })
    const institutionId = requireInstitution(db, req.body?.institutionId)
    const schoolName = text(req.body?.schoolName, 'School name', { min: 2, max: 160, optional: true }) || null
    const studentPassword = password(req.body?.password, 'Initial password')

    const created = db.transaction(() => {
      const username = uniqueUsername(db, name)
      const result = db.prepare(`
        INSERT INTO students (name, age, institution_id, school_name, username, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name, age, institutionId, schoolName, username, bcrypt.hashSync(studentPassword, 12), now())
      return db.prepare(`${studentSelect} WHERE s.id = ?`).get(result.lastInsertRowid)
    })()
    res.status(201).json(studentDto(created))
  })

  router.put('/students/:id', (req, res) => {
    const studentId = id(req.params.id, 'Student')
    const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId)
    if (!existing) throw httpError(404, 'Student not found.')
    const name = text(req.body?.name, 'Student name', { min: 2, max: 120 })
    const age = integer(req.body?.age, 'Age', { min: 3, max: 100 })
    const institutionId = requireInstitution(db, req.body?.institutionId)
    const schoolName = text(req.body?.schoolName, 'School name', { min: 2, max: 160, optional: true }) || null

    db.transaction(() => {
      db.prepare('UPDATE students SET name = ?, age = ?, institution_id = ?, school_name = ? WHERE id = ?')
        .run(name, age, institutionId, schoolName, studentId)
      if (existing.institution_id !== institutionId) {
        db.prepare('DELETE FROM concept_completions WHERE student_id = ?').run(studentId)
        db.prepare('DELETE FROM homework_completions WHERE student_id = ?').run(studentId)
      }
    })()
    res.json(studentDto(db.prepare(`${studentSelect} WHERE s.id = ?`).get(studentId)))
  })

  router.put('/students/:id/password', (req, res) => {
    const studentId = id(req.params.id, 'Student')
    if (!db.prepare('SELECT 1 FROM students WHERE id = ?').get(studentId)) throw httpError(404, 'Student not found.')
    const newPassword = password(req.body?.password, 'New password')
    db.transaction(() => {
      db.prepare('UPDATE students SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 12), studentId)
      db.prepare("DELETE FROM sessions WHERE role = 'student' AND user_id = ?").run(studentId)
    })()
    res.json({ message: 'Password reset successfully. Existing student sessions have been revoked.' })
  })

  router.delete('/students/:id', (req, res) => {
    const studentId = id(req.params.id, 'Student')
    if (!db.prepare('SELECT 1 FROM students WHERE id = ?').get(studentId)) throw httpError(404, 'Student not found.')
    db.transaction(() => {
      db.prepare("DELETE FROM sessions WHERE role = 'student' AND user_id = ?").run(studentId)
      db.prepare('DELETE FROM students WHERE id = ?').run(studentId)
    })()
    res.status(204).end()
  })

  router.get('/concepts', (_req, res) => {
    res.json(db.prepare('SELECT * FROM concepts ORDER BY created_at DESC, id DESC').all().map((row) => conceptDto(db, row)))
  })

  function saveConcept(req, existingId = null) {
    const name = text(req.body?.name, 'Concept name', { min: 2, max: 160 })
    const description = text(req.body?.description, 'Concept description', { min: 2, max: 5000 })
    if (!Array.isArray(req.body?.institutionIds) || req.body.institutionIds.length === 0) {
      throw httpError(400, 'Select at least one institution.')
    }
    const institutionIds = [...new Set(req.body.institutionIds.map((value) => requireInstitution(db, value)))]
    if (db.prepare('SELECT 1 FROM concepts WHERE name = ? COLLATE NOCASE AND id <> ?').get(name, existingId ?? -1)) {
      throw httpError(409, 'A concept with this name already exists.')
    }

    return db.transaction(() => {
      let conceptId = existingId
      if (conceptId) {
        if (!db.prepare('SELECT 1 FROM concepts WHERE id = ?').get(conceptId)) throw httpError(404, 'Concept not found.')
        db.prepare('UPDATE concepts SET name = ?, description = ? WHERE id = ?').run(name, description, conceptId)
        db.prepare('DELETE FROM concept_institutions WHERE concept_id = ?').run(conceptId)
      } else {
        conceptId = Number(db.prepare('INSERT INTO concepts (name, description, created_at) VALUES (?, ?, ?)').run(name, description, now()).lastInsertRowid)
      }
      const assign = db.prepare('INSERT INTO concept_institutions (concept_id, institution_id) VALUES (?, ?)')
      institutionIds.forEach((institutionId) => assign.run(conceptId, institutionId))
      db.prepare(`
        DELETE FROM concept_completions WHERE concept_id = ? AND student_id NOT IN (
          SELECT s.id FROM students s JOIN concept_institutions ci ON ci.institution_id = s.institution_id
          WHERE ci.concept_id = ?
        )
      `).run(conceptId, conceptId)
      return conceptDto(db, db.prepare('SELECT * FROM concepts WHERE id = ?').get(conceptId))
    })()
  }

  router.post('/concepts', (req, res) => res.status(201).json(saveConcept(req)))
  router.put('/concepts/:id', (req, res) => res.json(saveConcept(req, id(req.params.id, 'Concept'))))
  router.delete('/concepts/:id', (req, res) => {
    const conceptId = id(req.params.id, 'Concept')
    if (!db.prepare('SELECT 1 FROM concepts WHERE id = ?').get(conceptId)) throw httpError(404, 'Concept not found.')
    db.prepare('DELETE FROM concepts WHERE id = ?').run(conceptId)
    res.status(204).end()
  })

  router.get('/students/:id/tournaments', (req, res) => {
    const studentId = id(req.params.id, 'Student')
    if (!db.prepare('SELECT 1 FROM students WHERE id = ?').get(studentId)) throw httpError(404, 'Student not found.')
    const rows = db.prepare('SELECT * FROM tournaments WHERE student_id = ? ORDER BY tournament_date DESC, id DESC').all(studentId)
    res.json(rows.map(tournamentDto))
  })

  router.post('/students/:id/tournaments', (req, res) => {
    const studentId = id(req.params.id, 'Student')
    if (!db.prepare('SELECT 1 FROM students WHERE id = ?').get(studentId)) throw httpError(404, 'Student not found.')
    const name = text(req.body?.name, 'Tournament name', { min: 2, max: 180 })
    const tournamentDate = date(req.body?.tournamentDate, 'Tournament date')
    const position = integer(req.body?.position, 'Position / Rank', { min: 1, max: 100000 })
    const totalRounds = integer(req.body?.totalRounds, 'Total rounds', { min: 1, max: 100 })
    const score = number(req.body?.score, 'Score', { min: 0, max: totalRounds })
    const levels = ['Poor', 'Average', 'Good', 'Excellent']
    if (!levels.includes(req.body?.performanceLevel)) throw httpError(400, 'Select a valid performance level.')
    const coachRemarks = text(req.body?.coachRemarks, 'Coach remarks', { max: 3000, optional: true }) || null
    const result = db.prepare(`
      INSERT INTO tournaments (student_id, name, tournament_date, position, total_rounds, score, performance_level, coach_remarks, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(studentId, name, tournamentDate, position, totalRounds, score, req.body.performanceLevel, coachRemarks, now())
    res.status(201).json(tournamentDto(db.prepare('SELECT * FROM tournaments WHERE id = ?').get(result.lastInsertRowid)))
  })

  router.get('/notes', (_req, res) => {
    const rows = db.prepare(`
      SELECT n.*, i.name AS institution_name FROM class_notes n
      JOIN institutions i ON i.id = n.institution_id ORDER BY n.class_date DESC, n.id DESC
    `).all()
    res.json(rows.map(noteDto))
  })

  router.post('/notes', upload.single('file'), asyncRoute(async (req, res) => {
    try {
      const title = text(req.body?.title, 'Note title', { min: 2, max: 180 })
      const description = text(req.body?.description, 'Description', { min: 2, max: 5000 })
      const institutionId = requireInstitution(db, req.body?.institutionId)
      const classDate = date(req.body?.classDate, 'Class date')
      if (!req.file) throw httpError(400, 'Choose a file to upload.')
      const result = db.prepare(`
        INSERT INTO class_notes (title, description, institution_id, class_date, original_filename, stored_filename, mime_type, file_size, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(title, description, institutionId, classDate, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, now())
      res.status(201).json(noteDto(getNote(db, result.lastInsertRowid)))
    } catch (error) {
      if (req.file) await fs.promises.unlink(req.file.path).catch(() => {})
      throw error
    }
  }))

  router.put('/notes/:id', upload.single('file'), asyncRoute(async (req, res) => {
    const noteId = id(req.params.id, 'Class note')
    const existing = getNote(db, noteId)
    try {
      if (!existing) throw httpError(404, 'Class note not found.')
      const title = text(req.body?.title, 'Note title', { min: 2, max: 180 })
      const description = text(req.body?.description, 'Description', { min: 2, max: 5000 })
      const institutionId = requireInstitution(db, req.body?.institutionId)
      const classDate = date(req.body?.classDate, 'Class date')
      db.prepare(`
        UPDATE class_notes SET title = ?, description = ?, institution_id = ?, class_date = ?,
          original_filename = ?, stored_filename = ?, mime_type = ?, file_size = ? WHERE id = ?
      `).run(
        title,
        description,
        institutionId,
        classDate,
        req.file?.originalname ?? existing.original_filename,
        req.file?.filename ?? existing.stored_filename,
        req.file?.mimetype ?? existing.mime_type,
        req.file?.size ?? existing.file_size,
        noteId,
      )
      if (req.file) await fs.promises.unlink(path.join(uploadDir, existing.stored_filename)).catch(() => {})
      res.json(noteDto(getNote(db, noteId)))
    } catch (error) {
      if (req.file) await fs.promises.unlink(req.file.path).catch(() => {})
      throw error
    }
  }))

  router.delete('/notes/:id', asyncRoute(async (req, res) => {
    const noteId = id(req.params.id, 'Class note')
    const existing = getNote(db, noteId)
    if (!existing) throw httpError(404, 'Class note not found.')
    db.prepare('DELETE FROM class_notes WHERE id = ?').run(noteId)
    await fs.promises.unlink(path.join(uploadDir, existing.stored_filename)).catch(() => {})
    res.status(204).end()
  }))

  router.get('/homework', (_req, res) => {
    const rows = db.prepare(`
      SELECT h.*, i.name AS institution_name FROM homework h
      JOIN institutions i ON i.id = h.institution_id ORDER BY h.due_date DESC, h.id DESC
    `).all()
    res.json(rows.map(homeworkDto))
  })

  function saveHomework(req, homeworkId = null) {
    const title = text(req.body?.title, 'Homework title', { min: 2, max: 180 })
    const instructions = text(req.body?.instructions, 'Instructions', { min: 2, max: 5000 })
    const dueDate = date(req.body?.dueDate, 'Due date')
    const institutionId = requireInstitution(db, req.body?.institutionId)
    const published = req.body?.published === undefined ? true : req.body.published
    if (typeof published !== 'boolean') throw httpError(400, 'Published must be true or false.')

    if (homeworkId) {
      const existing = db.prepare('SELECT * FROM homework WHERE id = ?').get(homeworkId)
      if (!existing) throw httpError(404, 'Homework not found.')
      db.transaction(() => {
        db.prepare('UPDATE homework SET title = ?, instructions = ?, due_date = ?, institution_id = ?, published = ? WHERE id = ?')
          .run(title, instructions, dueDate, institutionId, published ? 1 : 0, homeworkId)
        if (existing.institution_id !== institutionId || (existing.published && !published)) {
          db.prepare('DELETE FROM homework_completions WHERE homework_id = ?').run(homeworkId)
        }
      })()
    } else {
      homeworkId = Number(db.prepare(`
        INSERT INTO homework (title, instructions, due_date, institution_id, published, created_at) VALUES (?, ?, ?, ?, ?, ?)
      `).run(title, instructions, dueDate, institutionId, published ? 1 : 0, now()).lastInsertRowid)
    }
    return db.prepare(`
      SELECT h.*, i.name AS institution_name FROM homework h JOIN institutions i ON i.id = h.institution_id WHERE h.id = ?
    `).get(homeworkId)
  }

  router.post('/homework', (req, res) => res.status(201).json(homeworkDto(saveHomework(req))))
  router.put('/homework/:id', (req, res) => res.json(homeworkDto(saveHomework(req, id(req.params.id, 'Homework')))))
  router.delete('/homework/:id', (req, res) => {
    const homeworkId = id(req.params.id, 'Homework')
    if (!db.prepare('SELECT 1 FROM homework WHERE id = ?').get(homeworkId)) throw httpError(404, 'Homework not found.')
    db.prepare('DELETE FROM homework WHERE id = ?').run(homeworkId)
    res.status(204).end()
  })

  router.get('/calendar', (req, res) => {
    const selectedMonth = month(req.query.month)
    const rows = db.prepare(`
      SELECT c.*, i.name AS institution_name FROM class_calendar c
      JOIN institutions i ON i.id = c.institution_id
      WHERE substr(c.class_date, 1, 7) = ? ORDER BY c.class_date, i.name
    `).all(selectedMonth)
    res.json(rows.map(calendarDto))
  })

  router.post('/calendar', (req, res) => {
    const institutionId = requireInstitution(db, req.body?.institutionId)
    const classDate = date(req.body?.classDate, 'Class date')
    if (db.prepare('SELECT 1 FROM class_calendar WHERE institution_id = ? AND class_date = ?').get(institutionId, classDate)) {
      throw httpError(409, 'This institution already has a class scheduled on that date.')
    }
    const result = db.prepare('INSERT INTO class_calendar (institution_id, class_date, created_at) VALUES (?, ?, ?)')
      .run(institutionId, classDate, now())
    const row = db.prepare(`
      SELECT c.*, i.name AS institution_name FROM class_calendar c JOIN institutions i ON i.id = c.institution_id WHERE c.id = ?
    `).get(result.lastInsertRowid)
    res.status(201).json(calendarDto(row))
  })

  router.put('/calendar/:id/completion', (req, res) => {
    const classId = id(req.params.id, 'Class')
    if (typeof req.body?.completed !== 'boolean') throw httpError(400, 'Completed must be true or false.')
    if (!db.prepare('SELECT 1 FROM class_calendar WHERE id = ?').get(classId)) throw httpError(404, 'Scheduled class not found.')
    db.prepare('UPDATE class_calendar SET completed = ?, completed_at = ? WHERE id = ?')
      .run(req.body.completed ? 1 : 0, req.body.completed ? now() : null, classId)
    const row = db.prepare(`
      SELECT c.*, i.name AS institution_name FROM class_calendar c JOIN institutions i ON i.id = c.institution_id WHERE c.id = ?
    `).get(classId)
    res.json(calendarDto(row))
  })

  router.delete('/calendar/:id', (req, res) => {
    const classId = id(req.params.id, 'Class')
    if (!db.prepare('SELECT 1 FROM class_calendar WHERE id = ?').get(classId)) throw httpError(404, 'Scheduled class not found.')
    db.prepare('DELETE FROM class_calendar WHERE id = ?').run(classId)
    res.status(204).end()
  })

  router.get('/coaching/profile', (_req, res) => {
    const coach = db.prepare('SELECT name, title, bio, email FROM coaches ORDER BY id LIMIT 1').get()
    res.json(coach)
  })

  router.put('/coaching/profile', (req, res) => {
    const coach = db.prepare('SELECT id FROM coaches ORDER BY id LIMIT 1').get()
    const name = text(req.body?.name, 'Coach name', { min: 2, max: 120 })
    const title = text(req.body?.title, 'Professional title', { min: 2, max: 160 })
    const bio = text(req.body?.bio, 'Professional introduction', { min: 2, max: 5000 })
    const contactEmail = email(req.body?.email)
    db.prepare('UPDATE coaches SET name = ?, title = ?, bio = ?, email = ? WHERE id = ?')
      .run(name, title, bio, contactEmail, coach.id)
    res.json(db.prepare('SELECT name, title, bio, email FROM coaches WHERE id = ?').get(coach.id))
  })

  return router
}

export function createNotesFileHandler(db, uploadDir) {
  return asyncRoute(async (req, res) => {
    const noteId = id(req.params.id, 'Class note')
    const note = getNote(db, noteId)
    if (!note || (req.user.role === 'student' && note.institution_id !== req.user.institutionId)) {
      throw httpError(404, 'Class note not found.')
    }
    const safeStoredName = path.basename(note.stored_filename)
    if (safeStoredName !== note.stored_filename) throw httpError(404, 'Class note file not found.')
    const filePath = path.join(uploadDir, safeStoredName)
    try {
      await fs.promises.access(filePath, fs.constants.R_OK)
    } catch {
      throw httpError(404, 'Class note file not found.')
    }
    const fallback = note.original_filename.replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/["\\]/g, '_').slice(0, 180) || 'class-note'
    const disposition = req.query.download === '1' ? 'attachment' : 'inline'
    res.set({
      'Content-Type': note.mime_type,
      'Content-Length': String(note.file_size),
      'Content-Disposition': `${disposition}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(note.original_filename)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    })
    res.sendFile(filePath, (error) => {
      if (!error) return
      if (res.headersSent) return res.destroy()
      res.status(error.statusCode || 404).json({ error: 'Class note file not found.' })
    })
  })
}
