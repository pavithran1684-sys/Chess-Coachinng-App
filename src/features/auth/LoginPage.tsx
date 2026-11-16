import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, GraduationCap, LoaderCircle, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { Brand } from '@/components/layout/Brand'
import { Button } from '@/components/ui/Button'
import { Feedback } from '@/components/ui/Feedback'
import { useAuth } from '@/context/AuthContext'
import { inputClass, labelClass } from '@/lib/styles'
import type { UserRole } from '@/types'

export function LoginPage() {
  const { user, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<UserRole>('coach')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-navy-950"><LoaderCircle className="animate-spin text-gold-400" size={28} /></div>
  }
  if (user) return <Navigate to={user.role === 'coach' ? '/dashboard' : '/student'} replace />

  const selectRole = (nextRole: UserRole) => {
    setRole(nextRole)
    setIdentifier('')
    setPassword('')
    setError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const authenticatedUser = await login(role, identifier.trim(), password)
      navigate(authenticatedUser.role === 'coach' ? '/dashboard' : '/student', { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy-950 text-slate-100">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[700px] -translate-x-1/2 rounded-full bg-gold-400/[0.035] blur-3xl" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <Brand />
        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1fr_480px] lg:gap-20">
          <section className="hidden lg:block">
            <div className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-300">
              <span className="h-px w-7 bg-gold-400" /> One workspace. Every student journey.
            </div>
            <h1 className="max-w-xl font-display text-5xl font-semibold leading-[1.12] tracking-[-0.05em] text-white">
              Thoughtful coaching.<br />Clearer progress.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
              Manage institutions, share learning materials, and follow every student’s chess development from one focused workspace.
            </p>
            <div className="mt-8 flex items-center gap-3 text-xs text-slate-500">
              <ShieldCheck size={17} className="text-gold-400" />
              Secure, role-based access for coaches and students
            </div>
          </section>

          <section className="surface-card mx-auto w-full max-w-[480px] rounded-3xl p-5 sm:p-7">
            <div className="mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-300">Welcome to ChessDesk</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white">Choose how to sign in</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">Select your role to open your workspace.</p>
            </div>

            <div className="grid grid-cols-2 gap-3" role="group" aria-label="Select account type">
              <button
                type="button"
                onClick={() => selectRole('coach')}
                aria-pressed={role === 'coach'}
                className={`rounded-2xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${role === 'coach' ? 'border-gold-400/45 bg-gold-400/[0.09]' : 'border-slate-400/12 bg-white/[0.02] hover:border-slate-400/25'}`}
              >
                <GraduationCap size={21} className={role === 'coach' ? 'text-gold-300' : 'text-slate-500'} />
                <span className={`mt-3 block text-sm font-semibold ${role === 'coach' ? 'text-gold-200' : 'text-slate-300'}`}>Coach / Admin</span>
                <span className="mt-1 block text-[10px] text-slate-500">Manage coaching</span>
              </button>
              <button
                type="button"
                onClick={() => selectRole('student')}
                aria-pressed={role === 'student'}
                className={`rounded-2xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${role === 'student' ? 'border-gold-400/45 bg-gold-400/[0.09]' : 'border-slate-400/12 bg-white/[0.02] hover:border-slate-400/25'}`}
              >
                <UserRound size={21} className={role === 'student' ? 'text-gold-300' : 'text-slate-500'} />
                <span className={`mt-3 block text-sm font-semibold ${role === 'student' ? 'text-gold-200' : 'text-slate-300'}`}>Student</span>
                <span className="mt-1 block text-[10px] text-slate-500">View learning</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-7">
              <div className="mb-5 flex items-center gap-2">
                <span className="h-px flex-1 bg-slate-400/10" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{role === 'coach' ? 'Coach login' : 'Student login'}</span>
                <span className="h-px flex-1 bg-slate-400/10" />
              </div>
              <Feedback message={error} />
              <label className={labelClass}>
                {role === 'coach' ? 'Username / Email' : 'Student Name / Username'}
                <input
                  className={inputClass}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                  autoComplete="username"
                  placeholder={role === 'coach' ? 'coach@chessdesk.local' : 'Your student username'}
                />
              </label>
              <label className={`${labelClass} mt-4`}>
                Password
                <input
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
              </label>
              <Button type="submit" loading={submitting} className="mt-6 w-full">
                <LockKeyhole size={15} />
                Sign in as {role === 'coach' ? 'Coach' : 'Student'}
                {!submitting && <ArrowRight size={14} />}
              </Button>
            </form>
          </section>
        </div>
        <p className="text-center text-[10px] text-slate-600">ChessDesk · A focused workspace for chess education</p>
      </div>
    </main>
  )
}
