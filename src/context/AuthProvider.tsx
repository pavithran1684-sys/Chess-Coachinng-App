import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import type { AuthUser, UserRole } from '@/types'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    api<{ user: AuthUser | null }>('/api/auth/me')
      .then((result) => {
        if (active) setUser(result.user)
      })
      .catch(() => {
        if (active) setUser(null)
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
    const result = await api<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role, identifier, password }),
    })
    setUser(result.user)
    return result.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
