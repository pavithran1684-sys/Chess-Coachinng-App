import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { parseAuthUserResponse, requireAuthUserFromResponse } from '@/lib/auth'
import type { AuthUser, UserRole } from '@/types'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [coachSetupRequired, setCoachSetupRequired] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    const sessionRequest = api<unknown>('/api/auth/me')
      .then((result) => parseAuthUserResponse(result))
      .catch(() => null)
    const statusRequest = api<{ coachSetupRequired?: unknown } | null>('/api/auth/status')
      .then((result) => result?.coachSetupRequired === true)
      .catch(() => false)

    void Promise.all([sessionRequest, statusRequest])
      .then(([restoredUser, setupRequired]) => {
        if (!active) return
        setUser(restoredUser)
        setCoachSetupRequired(setupRequired)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener('chessdesk:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('chessdesk:unauthorized', handleUnauthorized)
  }, [])

  const login = useCallback(async (role: UserRole, identifier: string, password: string) => {
    try {
      const result = await api<unknown>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ role, identifier, password }),
      })
      const authenticatedUser = requireAuthUserFromResponse(result)
      if (authenticatedUser.role !== role) throw new Error('The account role does not match the selected login option.')
      setUser(authenticatedUser)
      return authenticatedUser
    } catch (reason) {
      if (role === 'coach' && reason instanceof ApiError && reason.status === 409) setCoachSetupRequired(true)
      throw reason
    }
  }, [])

  const setup = useCallback(async (name: string, email: string, password: string) => {
    try {
      const result = await api<unknown>('/api/auth/setup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      })
      const authenticatedUser = requireAuthUserFromResponse(result)
      if (authenticatedUser.role !== 'coach') throw new Error('The initial account was not returned as a coach account.')
      setUser(authenticatedUser)
      setCoachSetupRequired(false)
      return authenticatedUser
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) setCoachSetupRequired(false)
      throw reason
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const value = useMemo(
    () => ({ user, isLoading, coachSetupRequired, login, setup, logout }),
    [user, isLoading, coachSetupRequired, login, setup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
