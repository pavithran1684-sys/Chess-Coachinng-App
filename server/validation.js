export function text(value, label, { min = 1, max = 5000, optional = false } = {}) {
  if (optional && (value === undefined || value === null)) return ''
  if (typeof value !== 'string') throw httpError(400, `${label} is required.`)
  const result = value.trim()
  if (!optional && result.length < min) throw httpError(400, `${label} must be at least ${min} characters.`)
  if (optional && result && result.length < min) throw httpError(400, `${label} must be at least ${min} characters.`)
  if (result.length > max) throw httpError(400, `${label} must be no more than ${max} characters.`)
  return result
}

export function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const result = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(result) || result < min || result > max) {
    throw httpError(400, `${label} must be a whole number between ${min} and ${max}.`)
  }
  return result
}

export function number(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const result = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(result) || result < min || result > max) {
    throw httpError(400, `${label} must be a number between ${min} and ${max}.`)
  }
  return result
}

export function id(value, label = 'Record') {
  return integer(value, `${label} ID`, { min: 1, max: Number.MAX_SAFE_INTEGER })
}

export function date(value, label = 'Date') {
  const result = text(value, label, { min: 10, max: 10 })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) throw httpError(400, `${label} must use YYYY-MM-DD format.`)
  const parsed = new Date(`${result}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) {
    throw httpError(400, `${label} is not a valid calendar date.`)
  }
  return result
}

export function month(value) {
  const result = text(value, 'Month', { min: 7, max: 7 })
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(result)) throw httpError(400, 'Month must use YYYY-MM format.')
  return result
}

export function password(value, label = 'Password') {
  const result = text(value, label, { min: 8, max: 128 })
  if (Buffer.byteLength(result) > 72) throw httpError(400, `${label} must be no more than 72 UTF-8 bytes.`)
  return result
}

export function email(value) {
  const result = text(value, 'Email', { min: 3, max: 254 }).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw httpError(400, 'Enter a valid email address.')
  return result
}

export function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

export function institutionExists(db, institutionId) {
  return Boolean(db.prepare('SELECT id FROM institutions WHERE id = ?').get(institutionId))
}
