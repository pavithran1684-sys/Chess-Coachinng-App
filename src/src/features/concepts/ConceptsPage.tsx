import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { BrainCircuit, Building2, Edit3, Plus, Trash2 } from 'lucide-react'
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
import type { Concept, Institution } from '@/types'

export function ConceptsPage() {
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Concept | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [institutionIds, setInstitutionIds] = useState<number[]>([])
  const [deleting, setDeleting] = useState<Concept | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    try { const [conceptData, institutionData] = await Promise.all([api<Concept[]>('/api/concepts'), api<Institution[]>('/api/institutions')]); setConcepts(conceptData); setInstitutions(institutionData) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load concepts.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const open = (concept?: Concept) => { setSelected(concept ?? null); setName(concept?.name ?? ''); setDescription(concept?.description ?? ''); setInstitutionIds(concept?.institutionIds ?? []); setError(null); setModalOpen(true) }
  const toggleInstitution = (id: number) => setInstitutionIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null)
    try {
      const path = selected ? `/api/concepts/${selected.id}` : '/api/concepts'
      await api(path, { method: selected ? 'PUT' : 'POST', body: JSON.stringify({ name, description, institutionIds }) })
      setSuccess(selected ? 'Concept updated successfully.' : 'Concept created and assigned successfully.')
      setModalOpen(false); await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save concept.') }
    finally { setSaving(false) }
  }
  const remove = async () => { if (!deleting) return; setSaving(true); try { await api(`/api/concepts/${deleting.id}`, { method: 'DELETE' }); setSuccess('Concept deleted successfully.'); setDeleting(null); await load() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete concept.'); setDeleting(null) } finally { setSaving(false) } }

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Learning" title="Concepts" description="Create chess concepts once and assign them to one or more institutions." action={<Button onClick={() => open()} disabled={institutions.length === 0}><Plus size={15} />Add concept</Button>} />
      <Feedback message={error} /><Feedback message={success} tone="success" />
      {loading ? <Card><LoadingState label="Loading concepts…" /></Card> : concepts.length === 0 ? <Card><EmptyState icon={BrainCircuit} title="No concepts yet" description="Create a concept and assign it to institutions. Students will see it automatically in their dashboard." /></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{concepts.map((concept) => <Card key={concept.id} className="flex flex-col p-5"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300"><BrainCircuit size={18} /></span><div className="flex gap-1"><button onClick={() => open(concept)} className="rounded-lg p-2 text-slate-500 hover:text-white" aria-label={`Edit ${concept.name}`}><Edit3 size={15} /></button><button onClick={() => setDeleting(concept)} className="rounded-lg p-2 text-slate-500 hover:text-rose-300" aria-label={`Delete ${concept.name}`}><Trash2 size={15} /></button></div></div><h2 className="mt-4 text-sm font-semibold text-white">{concept.name}</h2><p className="mt-2 flex-1 text-xs leading-5 text-slate-400">{concept.description}</p><div className="mt-5 border-t border-slate-400/10 pt-4"><p className="mb-2 flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-600"><Building2 size={11} />Assigned institutions</p><div className="flex flex-wrap gap-1.5">{concept.institutionNames.map((name) => <Badge key={name} variant="neutral">{name}</Badge>)}</div><p className="mt-3 text-[10px] text-slate-500">{concept.completedCount} of {concept.assignedStudentCount} assigned {concept.assignedStudentCount === 1 ? 'student' : 'students'} completed</p></div></Card>)}</div>}
      {modalOpen && <Modal wide title={selected ? 'Edit concept' : 'Add concept'} description="Assignments automatically apply to every student in the selected institutions." onClose={() => setModalOpen(false)}><form onSubmit={save}><Feedback message={error} /><label className={labelClass}>Concept name<input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="e.g. Opening Principles" autoFocus /></label><label className={`${labelClass} mt-4`}>Concept description<textarea className={`${inputClass} min-h-24 resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="What should students understand or practise?" /></label><fieldset className="mt-5"><legend className="text-xs font-medium text-slate-300">Assign to institutions</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{institutions.map((institution) => <label key={institution.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-xs ${institutionIds.includes(institution.id) ? 'border-gold-400/30 bg-gold-400/[0.07] text-gold-200' : 'border-slate-400/10 bg-white/[0.02] text-slate-400'}`}><input type="checkbox" checked={institutionIds.includes(institution.id)} onChange={() => toggleInstitution(institution.id)} className="accent-[#d5b274]" />{institution.name}</label>)}</div></fieldset><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit" loading={saving} disabled={institutionIds.length === 0}>{selected ? 'Save changes' : 'Create concept'}</Button></div></form></Modal>}
      {deleting && <ConfirmDialog title={`Delete ${deleting.name}?`} description="This removes the concept, institution assignments, and student completion records." onClose={() => setDeleting(null)} onConfirm={() => void remove()} loading={saving} />}
    </div>
  )
}
