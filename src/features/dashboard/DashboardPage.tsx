import { useEffect, useState } from 'react'
import { Building2, UsersRound } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Feedback } from '@/components/ui/Feedback'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { ClassCalendar } from './ClassCalendar'

interface Summary { totalStudents: number; totalInstitutions: number }

export function DashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Summary>('/api/dashboard').then(setSummary).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load dashboard.'))
  }, [])

  return (
    <div className="page-enter space-y-6">
      <PageHeader eyebrow="Coach dashboard" title={`Welcome back, ${user?.name ?? 'Coach'}.`} description="Manage your institutions and keep each scheduled class on track." />
      <Feedback message={error} />
      {!summary ? <LoadingState label="Loading overview…" /> : (
        <section className="grid gap-4 sm:grid-cols-2" aria-label="Coaching overview">
          <Card className="flex items-center gap-4 p-5 sm:p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-400/20 bg-gold-400/10 text-gold-300"><UsersRound size={20} /></span><div><p className="text-xs font-medium text-slate-400">Total Students</p><p className="mt-1 font-display text-3xl font-semibold tracking-tight text-white">{summary.totalStudents}</p><p className="mt-1 text-[10px] text-slate-600">Live student records</p></div></Card>
          <Card className="flex items-center gap-4 p-5 sm:p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300"><Building2 size={20} /></span><div><p className="text-xs font-medium text-slate-400">Total Institutions</p><p className="mt-1 font-display text-3xl font-semibold tracking-tight text-white">{summary.totalInstitutions}</p><p className="mt-1 text-[10px] text-slate-600">Live institution records</p></div></Card>
        </section>
      )}
      <ClassCalendar />
    </div>
  )
}
