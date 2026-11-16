import { createContext, useContext } from 'react'
import type { AuthUser, UserRole } from '@/types'

export interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (role: UserRole, identifier: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
