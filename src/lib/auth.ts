import type { AuthUser } from '@/types'

/** Parse untrusted API data before any caller reads or redirects by role. */
export function parseAuthUser(value: unknown): AuthUser | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Record<string, unknown>
  if (!Number.isInteger(candidate.id) || Number(candidate.id) < 1) return null
  if (typeof candidate.name !== 'string' || !candidate.name.trim()) return null

  const base = { id: candidate.id as number, name: candidate.name }
  if (candidate.role === 'coach') {
    if (typeof candidate.email !== 'string' || !candidate.email) return null
    return { ...base, role: 'coach', email: candidate.email }
  }

  if (candidate.role === 'student') {
    if (typeof candidate.username !== 'string' || !candidate.username) return null
    if (!Number.isInteger(candidate.institutionId) || Number(candidate.institutionId) < 1) return null
    return {
      ...base,
      role: 'student',
      username: candidate.username,
      institutionId: candidate.institutionId as number,
      institutionName: typeof candidate.institutionName === 'string' ? candidate.institutionName : undefined,
    }
  }

  return null
}

export function requireAuthUser(value: unknown): AuthUser {
  const user = parseAuthUser(value)
  if (!user) throw new Error('ChessDesk received an incomplete account response. Please try signing in again.')
  return user
}
