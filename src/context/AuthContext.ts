import { createContext, useContext } from 'react'
import type { AuthUser, UserRole } from '@/types'

export interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  coachSetupRequired: boolean
  login: (role: UserRole, identifier: string, password: string) => Promise<AuthUser>
  setup: (name: string, email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
