import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Building2, Edit3, Plus, Trash2, UsersRound } from 'lucide-react'
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
import type { Institution } from '@/types'

export function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Institution | null>(null)
  const [name, setName] = useState('')
  const [deleting, setDeleting] = useState<Institution | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    try { setInstitutions(await api<Institution[]>('/api/institutions')) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load institutions.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const openAdd = () => { setSelected(null); setName(''); setError(null); setModal('add') }
  const openEdit = (institution: Institution) => { setSelected(institution); setName(institution.name); setError(null); setModal('edit') }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true); setError(null); setSuccess(null)
    try {
      if (modal === 'edit' && selected) {
        await api(`/api/institutions/${selected.id}`, { method: 'PUT', body: JSON.stringify({ name }) })
        setSuccess('Institution updated successfully.')
      } else {
        await api('/api/institutions', { method: 'POST', body: JSON.stringify({ name }) })
        setSuccess('Institution added successfully.')
      }
      setModal(null)
      await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save institution.') }
    finally { setSaving(false) }
  }

  const remove = async () => {
    if (!deleting) return
    setSaving(true); setError(null)
    try {
      await api(`/api/institutions/${deleting.id}`, { method: 'DELETE' })
      setSuccess(`${deleting.name} deleted successfully.`)
      setDeleting(null)
      await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete institution.'); setDeleting(null) }
    finally { setSaving(false) }
  }

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Management" title="Institutions" description="Maintain the institutions connected to your students and learning materials." action={<Button onClick={openAdd}><Plus size={15} />Add institution</Button>} />
      <Feedback message={error} /><Feedback message={success} tone="success" />
      {loading ? <Card><LoadingState label="Loading institutions…" /></Card> : institutions.length === 0 ? <Card><EmptyState icon={Building2} title="No institutions yet" description="Add your first institution to begin assigning students, concepts, notes, and homework." /></Card> : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Institution records">
          {institutions.map((institution) => (
            <Card key={institution.id} className="p-5">
              <div className="flex items-start justify-between gap-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300"><Building2 size={18} /></span><div className="flex gap-1"><button onClick={() => openEdit(institution)} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white" aria-label={`Edit ${institution.name}`}><Edit3 size={15} /></button><button onClick={() => setDeleting(institution)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-400/5 hover:text-rose-300" aria-label={`Delete ${institution.name}`}><Trash2 size={15} /></button></div></div>
              <h2 className="mt-5 text-sm font-semibold text-slate-100">{institution.name}</h2>
              <div className="mt-4 flex items-center gap-2 border-t border-slate-400/10 pt-4 text-xs text-slate-400"><UsersRound size={14} className="text-slate-600" /><span>{institution.studentCount} {institution.studentCount === 1 ? 'student' : 'students'}</span></div>
            </Card>
          ))}
        </section>
      )}
      {modal && <Modal title={modal === 'add' ? 'Add institution' : 'Edit institution'} description="Institution names are available automatically in all assignment dropdowns." onClose={() => setModal(null)}><form onSubmit={save}><Feedback message={error} /><label className={labelClass}>Institution name<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} placeholder="e.g. Alpha and Omega" autoFocus /></label><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={saving}>{modal === 'add' ? 'Add institution' : 'Save changes'}</Button></div></form></Modal>}
      {deleting && <ConfirmDialog title={`Delete ${deleting.name}?`} description={deleting.studentCount > 0 ? 'This institution has assigned students. Reassign those students before deleting it.' : 'This permanently removes the institution and its class calendar records.'} onClose={() => setDeleting(null)} onConfirm={() => void remove()} loading={saving} />}
    </div>
  )
}
