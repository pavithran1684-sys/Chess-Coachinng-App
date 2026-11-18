import { Navigate, Outlet } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'

export function ProtectedRoute({ role }: { role: UserRole }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950" role="status">
        <LoaderCircle className="animate-spin text-gold-400" size={28} aria-label="Loading ChessDesk" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) {
    return <Navigate to={user.role === 'coach' ? '/dashboard' : '/student'} replace />
  }

  return <Outlet />
}
