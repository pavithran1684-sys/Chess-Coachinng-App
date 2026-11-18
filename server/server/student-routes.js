import { Router } from 'express'
import { requireRole } from './auth.js'
import { now } from './db.js'
import { tournamentDto } from './coach-routes.js'
import { httpError, id } from './validation.js'

export function createStudentRouter(db) {
  const router = Router()
  router.use(requireRole('student'))

  router.get('/dashboard', (req, res) => {
    const studentId = req.user.id
    const institutionId = req.user.institutionId
    const notes = db.prepare('SELECT COUNT(*) AS count FROM class_notes WHERE institution_id = ?').get(institutionId).count
    const conceptsTotal = db.prepare(`
      SELECT COUNT(*) AS count FROM concept_institutions ci
      JOIN students s ON s.institution_id = ci.institution_id WHERE s.id = ?
    `).get(studentId).count
    const conceptsCompleted = db.prepare(`
      SELECT COUNT(*) AS count FROM concept_completions cc
      JOIN concepts c ON c.id = cc.concept_id
      JOIN concept_institutions ci ON ci.concept_id = c.id
      JOIN students s ON s.id = cc.student_id AND s.institution_id = ci.institution_id
      WHERE cc.student_id = ?
    `).get(studentId).count
    const homeworkTotal = db.prepare(`
      SELECT COUNT(*) AS count FROM homework h JOIN students s ON s.institution_id = h.institution_id
      WHERE s.id = ? AND h.published = 1
    `).get(studentId).count
    const homeworkCompleted = db.prepare(`
      SELECT COUNT(*) AS count FROM homework_completions hc
      JOIN homework h ON h.id = hc.homework_id AND h.published = 1
      JOIN students s ON s.id = hc.student_id AND s.institution_id = h.institution_id
      WHERE hc.student_id = ?
    `).get(studentId).count
    const achievements = db.prepare('SELECT COUNT(*) AS count FROM tournaments WHERE student_id = ?').get(studentId).count
    res.json({
      notes,
      conceptsTotal,
      conceptsCompleted,
      homeworkPending: Math.max(0, homeworkTotal - homeworkCompleted),
      homeworkTotal,
      achievements,
    })
  })

  router.get('/notes', (req, res) => {
    const rows = db.prepare(`
      SELECT n.id, n.title, n.description, n.institution_id, i.name AS institution_name,
             n.class_date, n.original_filename, n.mime_type, n.file_size, n.uploaded_at
      FROM class_notes n JOIN institutions i ON i.id = n.institution_id
      JOIN students s ON s.institution_id = n.institution_id
      WHERE s.id = ? ORDER BY n.class_date DESC, n.id DESC
    `).all(req.user.id)
    res.json(rows.map((row) => ({
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
    })))
  })

  router.get('/concepts', (req, res) => {
    const rows = db.prepare(`
      SELECT c.id, c.name, c.description, c.created_at, i.id AS institution_id,
             i.name AS institution_name, cc.completed_at
      FROM concepts c
      JOIN concept_institutions ci ON ci.concept_id = c.id
      JOIN students s ON s.institution_id = ci.institution_id
      JOIN institutions i ON i.id = s.institution_id
      LEFT JOIN concept_completions cc ON cc.concept_id = c.id AND cc.student_id = s.id
      WHERE s.id = ? ORDER BY CASE WHEN cc.completed_at IS NULL THEN 0 ELSE 1 END, c.created_at DESC, c.id DESC
    `).all(req.user.id)
    res.json(rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      institutionId: row.institution_id,
      institutionName: row.institution_name,
      createdAt: row.created_at,
      completed: Boolean(row.completed_at),
      completedAt: row.completed_at,
    })))
  })

  router.put('/concepts/:id/completion', (req, res) => {
    const conceptId = id(req.params.id, 'Concept')
    if (typeof req.body?.completed !== 'boolean') throw httpError(400, 'Completed must be true or false.')
    const assigned = db.prepare(`
      SELECT 1 FROM concept_institutions ci JOIN students s ON s.institution_id = ci.institution_id
      WHERE s.id = ? AND ci.concept_id = ?
    `).get(req.user.id, conceptId)
    if (!assigned) throw httpError(404, 'Assigned concept not found.')

    const completedAt = req.body.completed ? now() : null
    if (req.body.completed) {
      db.prepare(`
        INSERT INTO concept_completions (concept_id, student_id, completed_at) VALUES (?, ?, ?)
        ON CONFLICT(concept_id, student_id) DO UPDATE SET completed_at = excluded.completed_at
      `).run(conceptId, req.user.id, completedAt)
    } else {
      db.prepare('DELETE FROM concept_completions WHERE concept_id = ? AND student_id = ?').run(conceptId, req.user.id)
    }
    res.json({ completed: req.body.completed, completedAt })
  })

  router.get('/homework', (req, res) => {
    const rows = db.prepare(`
      SELECT h.id, h.title, h.instructions, h.due_date, h.institution_id,
             i.name AS institution_name, h.published, h.created_at, hc.completed_at
      FROM homework h
      JOIN students s ON s.institution_id = h.institution_id
      JOIN institutions i ON i.id = h.institution_id
      LEFT JOIN homework_completions hc ON hc.homework_id = h.id AND hc.student_id = s.id
      WHERE s.id = ? AND h.published = 1
      ORDER BY CASE WHEN hc.completed_at IS NULL THEN 0 ELSE 1 END, h.due_date, h.id DESC
    `).all(req.user.id)
    res.json(rows.map((row) => ({
      id: row.id,
      title: row.title,
      instructions: row.instructions,
      dueDate: row.due_date,
      institutionId: row.institution_id,
      institutionName: row.institution_name,
      published: Boolean(row.published),
      createdAt: row.created_at,
      completed: Boolean(row.completed_at),
      completedAt: row.completed_at,
    })))
  })

  router.put('/homework/:id/completion', (req, res) => {
    const homeworkId = id(req.params.id, 'Homework')
    if (typeof req.body?.completed !== 'boolean') throw httpError(400, 'Completed must be true or false.')
    const assigned = db.prepare(`
      SELECT 1 FROM homework h JOIN students s ON s.institution_id = h.institution_id
      WHERE s.id = ? AND h.id = ? AND h.published = 1
    `).get(req.user.id, homeworkId)
    if (!assigned) throw httpError(404, 'Assigned homework not found.')

    const completedAt = req.body.completed ? now() : null
    if (req.body.completed) {
      db.prepare(`
        INSERT INTO homework_completions (homework_id, student_id, completed_at) VALUES (?, ?, ?)
        ON CONFLICT(homework_id, student_id) DO UPDATE SET completed_at = excluded.completed_at
      `).run(homeworkId, req.user.id, completedAt)
    } else {
      db.prepare('DELETE FROM homework_completions WHERE homework_id = ? AND student_id = ?').run(homeworkId, req.user.id)
    }
    res.json({ completed: req.body.completed, completedAt })
  })

  router.get('/tournaments', (req, res) => {
    const rows = db.prepare('SELECT * FROM tournaments WHERE student_id = ? ORDER BY tournament_date DESC, id DESC').all(req.user.id)
    res.json(rows.map(tournamentDto))
  })

  router.get('/mentor', (_req, res) => {
    res.json(db.prepare('SELECT name, title, bio, email FROM coaches ORDER BY id LIMIT 1').get())
  })

  return router
}
