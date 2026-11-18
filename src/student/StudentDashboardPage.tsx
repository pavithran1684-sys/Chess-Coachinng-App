import { useEffect, useState } from 'react'
import { ArrowUpRight, BrainCircuit, ClipboardCheck, NotebookPen, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Feedback } from '@/components/ui/Feedback'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface StudentSummary {
  notes: number
  conceptsTotal: number
  conceptsCompleted: number
  homeworkPending: number
  homeworkTotal: number
  achievements: number
}

export function StudentDashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<StudentSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<StudentSummary>('/api/my/dashboard').then(setSummary).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load your dashboard.'))
  }, [])

  const cards = [
    { title: 'My Notes', path: '/student/notes', icon: NotebookPen, value: summary?.notes ?? 0, detail: summary?.notes === 1 ? 'Available class note' : 'Available class notes', color: 'text-violet-300 border-violet-400/20 bg-violet-400/10' },
    { title: 'Concepts Completed', path: '/student/concepts', icon: BrainCircuit, value: `${summary?.conceptsCompleted ?? 0}/${summary?.conceptsTotal ?? 0}`, detail: 'Concepts completed', color: 'text-sky-300 border-sky-400/20 bg-sky-400/10' },
    { title: 'Homework', path: '/student/homework', icon: ClipboardCheck, value: summary?.homeworkPending ?? 0, detail: `Pending of ${summary?.homeworkTotal ?? 0} assigned`, color: 'text-amber-300 border-amber-400/20 bg-amber-400/10' },
    { title: 'My Achievements', path: '/student/achievements', icon: Trophy, value: summary?.achievements ?? 0, detail: summary?.achievements === 1 ? 'Tournament record' : 'Tournament records', color: 'text-gold-300 border-gold-400/20 bg-gold-400/10' },
  ]

  return (
    <div className="page-enter">
      <div className="mb-7">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-300">Student dashboard</p>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">Welcome, {user?.name}!</h1>
        <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm">Continue your learning at {user?.institutionName}.</p>
      </div>
      <Feedback message={error} />
      {!summary && !error ? <Card><LoadingState label="Loading your learning space…" /></Card> : summary && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Student learning sections">
          {cards.map((card) => {
            const Icon = card.icon
            return <Link key={card.path} to={card.path} className="surface-card group rounded-2xl p-5 transition-colors hover:border-gold-400/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:p-6">
              <div className="flex items-start justify-between gap-4"><span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${card.color}`}><Icon size={20} /></span><ArrowUpRight size={16} className="text-slate-600 transition-colors group-hover:text-gold-300" /></div>
              <p className="mt-6 font-display text-3xl font-semibold tracking-tight text-white">{card.value}</p>
              <h2 className="mt-3 text-sm font-semibold text-slate-200">{card.title}</h2>
              <p className="mt-1.5 text-[10px] text-slate-500">{card.detail}</p>
            </Link>
          })}
        </section>
      )}
    </div>
  )
}
