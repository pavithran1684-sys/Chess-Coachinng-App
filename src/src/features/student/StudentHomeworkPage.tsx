import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Check, CheckCircle2, ClipboardCheck, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Feedback } from '@/components/ui/Feedback'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import type { Homework } from '@/types'

function todayKey() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export function StudentHomeworkPage() {
  const [homework, setHomework] = useState<Homework[] | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Homework[]>('/api/my/homework').then(setHomework).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load your homework.'))
  }, [])

  const toggle = async (item: Homework) => {
    setUpdating(item.id)
    setError(null)
    try {
      const result = await api<{ completed: boolean; completedAt: string | null }>(`/api/my/homework/${item.id}/completion`, { method: 'PUT', body: JSON.stringify({ completed: !item.completed }) })
      setHomework((current) => current?.map((entry) => entry.id === item.id ? { ...entry, ...result } : entry) ?? null)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update homework status.') }
    finally { setUpdating(null) }
  }

  const pending = homework?.filter((item) => !item.completed).length ?? 0
  return <div className="page-enter">
    <PageHeader eyebrow="Your practice" title="Homework" description={homework?.length ? `${pending} pending and ${homework.length - pending} completed assignments.` : 'Read instructions, check due dates, and track your completed work.'} action={<Link to="/student" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-gold-300"><ArrowLeft size={14} />Dashboard</Link>} />
    <Feedback message={error} />
    {!homework && !error ? <Card><LoadingState label="Loading your homework…" /></Card> : homework?.length === 0 ? <Card><EmptyState icon={ClipboardCheck} title="No homework assigned" description="Published homework for your institution will appear here automatically." /></Card> : (
      <div className="space-y-4">{homework?.map((item) => {
        const completed = Boolean(item.completed)
        const overdue = !completed && item.dueDate < todayKey()
        return <Card key={item.id} className={`p-5 sm:p-6 ${completed ? 'border-emerald-400/15' : ''}`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={completed ? 'text-emerald-300' : 'text-gold-300'}>{completed ? <CheckCircle2 size={18} /> : <ClipboardCheck size={18} />}</span><h2 className="text-sm font-semibold text-white">{item.title}</h2><Badge variant={completed ? 'success' : overdue ? 'danger' : 'warning'}>{completed ? 'Completed' : overdue ? 'Overdue' : 'Pending'}</Badge></div><p className="mt-4 whitespace-pre-wrap text-xs leading-6 text-slate-400">{item.instructions}</p><div className="mt-4 flex flex-wrap gap-4 text-[10px] text-slate-500"><span className="flex items-center gap-1.5"><CalendarDays size={13} />Due {formatDate(item.dueDate)}</span><span>{item.institutionName}</span></div></div>
            <Button variant={completed ? 'secondary' : 'primary'} loading={updating === item.id} onClick={() => void toggle(item)} className="shrink-0">{completed ? <><Check size={14} />Completed</> : <><Clock3 size={14} />Mark as completed</>}</Button>
          </div>
        </Card>
      })}</div>
    )}
  </div>
}
