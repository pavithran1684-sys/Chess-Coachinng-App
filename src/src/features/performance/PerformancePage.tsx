import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { BarChart3, Plus, Trophy, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Feedback } from '@/components/ui/Feedback'
import { LoadingState } from '@/components/ui/LoadingState'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { TournamentPerformance } from '@/components/TournamentPerformance'
import { api } from '@/lib/api'
import { inputClass, labelClass } from '@/lib/styles'
import type { PerformanceLevel, Student, Tournament } from '@/types'

const emptyForm = { name: '', tournamentDate: '', position: '', totalRounds: '', score: '', performanceLevel: 'Good' as PerformanceLevel, coachRemarks: '' }

export function PerformancePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [selected, setSelected] = useState<Student | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => { api<Student[]>('/api/students').then(setStudents).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load students.')).finally(() => setLoading(false)) }, [])
  const selectStudent = useCallback(async (student: Student) => {
    setSelected(student); setRecordsLoading(true); setError(null)
    try { setTournaments(await api<Tournament[]>(`/api/students/${student.id}/tournaments`)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load performance records.') }
    finally { setRecordsLoading(false) }
  }, [])

  const addTournament = async (event: FormEvent) => {
    event.preventDefault(); if (!selected) return; setSaving(true); setError(null)
    try {
      await api(`/api/students/${selected.id}/tournaments`, { method: 'POST', body: JSON.stringify({ ...form, position: Number(form.position), totalRounds: Number(form.totalRounds), score: Number(form.score) }) })
      setOpen(false); setForm(emptyForm); setSuccess(`Tournament added to ${selected.name}’s achievements.`); await selectStudent(selected)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to add tournament.') }
    finally { setSaving(false) }
  }

  return <div className="page-enter"><PageHeader eyebrow="Student progress" title="Performance Analysis" description="Select a student to review tournament history and add verified performance records." action={selected ? <Button onClick={() => { setForm(emptyForm); setError(null); setOpen(true) }}><Plus size={15} />Add Tournament</Button> : undefined} /><Feedback message={error} /><Feedback message={success} tone="success" />{loading ? <Card><LoadingState label="Loading students…" /></Card> : students.length === 0 ? <Card><EmptyState icon={UserRound} title="No student profiles" description="Add students first to begin recording tournament performance." /></Card> : <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]"><Card className="overflow-hidden"><div className="border-b border-slate-400/10 px-5 py-4"><h2 className="text-xs font-semibold text-slate-200">All students</h2><p className="mt-1 text-[10px] text-slate-500">{students.length} records</p></div><div className="max-h-[650px] overflow-y-auto p-2">{students.map((student) => <button key={student.id} onClick={() => void selectStudent(student)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${selected?.id === student.id ? 'bg-gold-400/[0.09] ring-1 ring-gold-400/20' : 'hover:bg-white/[0.025]'}`}><Avatar initials={student.name.split(' ').map((part) => part[0]).slice(0, 2).join('')} name={student.name} /><span className="min-w-0"><span className={`block truncate text-xs font-semibold ${selected?.id === student.id ? 'text-gold-200' : 'text-slate-200'}`}>{student.name}</span><span className="mt-1 block truncate text-[10px] text-slate-500">{student.institutionName}</span></span></button>)}</div></Card><div>{!selected ? <Card><EmptyState icon={BarChart3} title="Select a student" description="Choose a student from the list to view their tournament timeline and performance graph." /></Card> : <><div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-400/20 bg-gold-400/10 text-gold-300"><Trophy size={18} /></span><div><h2 className="font-display text-lg font-semibold text-white">{selected.name}</h2><p className="mt-1 text-xs text-slate-500">{selected.institutionName}</p></div></div>{recordsLoading ? <Card><LoadingState label="Loading tournament history…" /></Card> : <TournamentPerformance tournaments={tournaments} />}</>}</div></div>}{open && selected && <Modal wide title="Add Tournament" description={`Record an actual tournament result for ${selected.name}. It will appear in their My Achievements section.`} onClose={() => setOpen(false)}><form onSubmit={addTournament}><Feedback message={error} /><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Tournament name<input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus /></label><label className={labelClass}>Tournament date<input type="date" className={inputClass} value={form.tournamentDate} onChange={(e) => setForm({ ...form, tournamentDate: e.target.value })} required /></label></div><div className="mt-4 grid gap-4 sm:grid-cols-3"><label className={labelClass}>Position / Rank<input type="number" min="1" className={inputClass} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required /></label><label className={labelClass}>Total rounds<input type="number" min="1" step="1" className={inputClass} value={form.totalRounds} onChange={(e) => setForm({ ...form, totalRounds: e.target.value })} required /></label><label className={labelClass}>Score<input type="number" min="0" step="0.5" className={inputClass} value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} required /></label></div><label className={`${labelClass} mt-4`}>Performance level<select className={inputClass} value={form.performanceLevel} onChange={(e) => setForm({ ...form, performanceLevel: e.target.value as PerformanceLevel })}>{['Poor', 'Average', 'Good', 'Excellent'].map((level) => <option key={level}>{level}</option>)}</select></label><label className={`${labelClass} mt-4`}>Coach remarks<textarea className={`${inputClass} min-h-24 resize-y`} value={form.coachRemarks} onChange={(e) => setForm({ ...form, coachRemarks: e.target.value })} placeholder="Observations, strengths, and next steps" /></label><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={saving}>Add tournament</Button></div></form></Modal>}</div>
}
