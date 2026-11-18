import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { CalendarDays, ClipboardCheck, Edit3, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Feedback } from '@/components/ui/Feedback'
import { LoadingState } from '@/components/ui/LoadingState'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { api } from '@/lib/api'
import { inputClass, labelClass } from '@/lib/styles'
import type { Homework, Institution } from '@/types'

export function HomeworkPage() {
  const [homework, setHomework] = useState<Homework[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Homework | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', instructions: '', dueDate: '', institutionId: '' })
  const [deleting, setDeleting] = useState<Homework | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const load = useCallback(async () => { try { const [items, institutionData] = await Promise.all([api<Homework[]>('/api/homework'), api<Institution[]>('/api/institutions')]); setHomework(items); setInstitutions(institutionData) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load homework.') } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  const openForm = (item?: Homework) => { setSelected(item ?? null); setForm(item ? { title: item.title, instructions: item.instructions, dueDate: item.dueDate, institutionId: String(item.institutionId) } : { title: '', instructions: '', dueDate: '', institutionId: '' }); setError(null); setOpen(true) }
  const save = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(null); try { await api(selected ? `/api/homework/${selected.id}` : '/api/homework', { method: selected ? 'PUT' : 'POST', body: JSON.stringify({ ...form, institutionId: Number(form.institutionId), published: true }) }); setSuccess(selected ? 'Homework updated successfully.' : 'Homework published successfully.'); setOpen(false); await load() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save homework.') } finally { setSaving(false) } }
  const remove = async () => { if (!deleting) return; setSaving(true); try { await api(`/api/homework/${deleting.id}`, { method: 'DELETE' }); setSuccess('Homework deleted successfully.'); setDeleting(null); await load() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete homework.'); setDeleting(null) } finally { setSaving(false) } }
  return <div className="page-enter"><PageHeader eyebrow="Learning" title="Homework" description="Publish homework once for every student in the selected institution." action={<Button onClick={() => openForm()} disabled={institutions.length === 0}><Plus size={15} />Create homework</Button>} /><Feedback message={error} /><Feedback message={success} tone="success" />{loading ? <Card><LoadingState label="Loading homework…" /></Card> : homework.length === 0 ? <Card><EmptyState icon={ClipboardCheck} title="No homework assigned" description="Create homework with clear instructions and a due date for an institution." /></Card> : <div className="space-y-4">{homework.map((item) => <Card key={item.id} className="p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-white">{item.title}</h2><Badge variant="success">Published</Badge></div><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-400">{item.instructions}</p><div className="mt-4 flex flex-wrap gap-4 text-[10px] text-slate-500"><span className="flex items-center gap-1.5"><CalendarDays size={13} />Due {new Date(`${item.dueDate}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span><span>{item.institutionName}</span></div></div><div className="flex gap-1"><button onClick={() => openForm(item)} className="rounded-lg p-2 text-slate-500 hover:text-white" aria-label={`Edit ${item.title}`}><Edit3 size={16} /></button><button onClick={() => setDeleting(item)} className="rounded-lg p-2 text-slate-500 hover:text-rose-300" aria-label={`Delete ${item.title}`}><Trash2 size={16} /></button></div></div></Card>)}</div>}{open && <Modal wide title={selected ? 'Edit homework' : 'Create homework'} description="Published homework appears automatically for all students in the institution." onClose={() => setOpen(false)}><form onSubmit={save}><Feedback message={error} /><label className={labelClass}>Homework title<input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus /></label><label className={`${labelClass} mt-4`}>Instructions / Description<textarea className={`${inputClass} min-h-28 resize-y`} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} required /></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className={labelClass}>Due date<input type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required /></label><label className={labelClass}>Institution<select className={inputClass} value={form.institutionId} onChange={(e) => setForm({ ...form, institutionId: e.target.value })} required><option value="">Select institution</option>{institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}</select></label></div><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={saving}>{selected ? 'Save changes' : 'Publish homework'}</Button></div></form></Modal>}{deleting && <ConfirmDialog title={`Delete ${deleting.title}?`} description="This removes the homework and all associated student completion records." onClose={() => setDeleting(null)} onConfirm={() => void remove()} loading={saving} />}</div>
}
