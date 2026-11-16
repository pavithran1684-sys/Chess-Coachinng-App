import { useEffect, useState } from 'react'
import { ArrowLeft, BrainCircuit, Check, CheckCircle2, Circle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Feedback } from '@/components/ui/Feedback'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { api } from '@/lib/api'

interface StudentConcept {
  id: number
  name: string
  description: string
  institutionId: number
  institutionName: string
  createdAt: string
  completed: boolean
  completedAt: string | null
}

export function StudentConceptsPage() {
  const [concepts, setConcepts] = useState<StudentConcept[] | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<StudentConcept[]>('/api/my/concepts').then(setConcepts).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load your concepts.'))
  }, [])

  const toggle = async (concept: StudentConcept) => {
    setUpdating(concept.id)
    setError(null)
    try {
      const result = await api<{ completed: boolean; completedAt: string | null }>(`/api/my/concepts/${concept.id}/completion`, { method: 'PUT', body: JSON.stringify({ completed: !concept.completed }) })
      setConcepts((current) => current?.map((item) => item.id === concept.id ? { ...item, ...result } : item) ?? null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update concept completion.')
    } finally { setUpdating(null) }
  }

  const completedCount = concepts?.filter((concept) => concept.completed).length ?? 0
  return <div className="page-enter">
    <PageHeader eyebrow="Your learning" title="Concepts Completed" description={concepts?.length ? `${completedCount} of ${concepts.length} assigned concepts completed. Track your own progress below.` : 'View concepts assigned to your institution and track your completion.'} action={<Link to="/student" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-gold-300"><ArrowLeft size={14} />Dashboard</Link>} />
    <Feedback message={error} />
    {!concepts && !error ? <Card><LoadingState label="Loading your concepts…" /></Card> : concepts?.length === 0 ? <Card><EmptyState icon={BrainCircuit} title="No concepts assigned yet" description="Concepts assigned to your institution will appear here automatically." /></Card> : (
      <div className="space-y-4">{concepts?.map((concept) => <Card key={concept.id} className={`p-5 sm:p-6 ${concept.completed ? 'border-emerald-400/15' : ''}`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${concept.completed ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-sky-400/20 bg-sky-400/10 text-sky-300'}`}>{concept.completed ? <CheckCircle2 size={19} /> : <BrainCircuit size={19} />}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-white">{concept.name}</h2><Badge variant={concept.completed ? 'success' : 'neutral'}>{concept.completed ? 'Completed' : 'In progress'}</Badge></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-400">{concept.description}</p><p className="mt-3 text-[10px] text-slate-600">{concept.institutionName}</p></div></div>
          <Button variant={concept.completed ? 'secondary' : 'primary'} loading={updating === concept.id} onClick={() => void toggle(concept)} className="shrink-0">{concept.completed ? <><Check size={14} />Completed</> : <><Circle size={14} />Mark as completed</>}</Button>
        </div>
        {concept.completed && <p className="mt-4 border-t border-emerald-400/10 pt-3 text-[10px] text-emerald-300/70">Click Completed again if you need to mark this concept as in progress.</p>}
      </Card>)}</div>
    )}
  </div>
}
