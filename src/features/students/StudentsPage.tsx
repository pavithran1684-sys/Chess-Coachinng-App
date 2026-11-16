import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Edit3, KeyRound, Plus, Trash2, UsersRound } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
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
import type { Institution, Student } from '@/types'

const emptyForm = { name: '', age: '', institutionId: '', schoolName: '', password: '' }

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | 'password' | null>(null)
  const [selected, setSelected] = useState<Student | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleting, setDeleting] = useState<Student | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [studentData, institutionData] = await Promise.all([api<Student[]>('/api/students'), api<Institution[]>('/api/institutions')])
      setStudents(studentData); setInstitutions(institutionData)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load students.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const openAdd = () => { setSelected(null); setForm(emptyForm); setError(null); setModal('add') }
  const openEdit = (student: Student) => { setSelected(student); setForm({ name: student.name, age: String(student.age), institutionId: String(student.institutionId), schoolName: student.schoolName ?? '', password: '' }); setError(null); setModal('edit') }
  const update = (field: keyof typeof emptyForm, value: string) => setForm((current) => ({ ...current, [field]: value }))

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null); setSuccess(null)
    try {
      if (modal === 'password' && selected) {
        await api(`/api/students/${selected.id}/password`, { method: 'PUT', body: JSON.stringify({ password: form.password }) })
        setSuccess(`Password reset successfully for ${selected.name}.`)
      } else if (modal === 'edit' && selected) {
        await api(`/api/students/${selected.id}`, { method: 'PUT', body: JSON.stringify({ ...form, age: Number(form.age), institutionId: Number(form.institutionId) }) })
        setSuccess('Student record updated successfully.')
      } else {
        const created = await api<Student>('/api/students', { method: 'POST', body: JSON.stringify({ ...form, age: Number(form.age), institutionId: Number(form.institutionId) }) })
        setSuccess(`${created.name} added successfully. Student username: ${created.username}`)
      }
      setModal(null); setForm(emptyForm); await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save student.') }
    finally { setSaving(false) }
  }

  const remove = async () => {
    if (!deleting) return
    setSaving(true)
    try { await api(`/api/students/${deleting.id}`, { method: 'DELETE' }); setSuccess(`${deleting.name} deleted successfully.`); setDeleting(null); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete student.'); setDeleting(null) }
    finally { setSaving(false) }
  }

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Management" title="Students" description="Manage student records, institution assignments, and secure login accounts." action={<Button onClick={openAdd} disabled={institutions.length === 0}><Plus size={15} />Add student</Button>} />
      <Feedback message={error} /><Feedback message={success} tone="success" />
      {institutions.length === 0 && !loading && <p className="mb-5 text-xs text-amber-300">Add an institution before creating student accounts.</p>}
      {loading ? <Card><LoadingState label="Loading students…" /></Card> : students.length === 0 ? <Card><EmptyState icon={UsersRound} title="No students yet" description="Add a student and assign them to an institution to begin sharing concepts, notes, and homework." /></Card> : (
        <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-slate-400/10 bg-white/[0.015] text-[9px] uppercase tracking-[0.13em] text-slate-600"><th className="px-6 py-4">Student</th><th className="px-4 py-4">Username</th><th className="px-4 py-4">Institution</th><th className="px-4 py-4">Age</th><th className="px-4 py-4">School name</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody>{students.map((student) => <tr key={student.id} className="border-b border-slate-400/[0.08] last:border-0 hover:bg-white/[0.015]"><td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar initials={student.name.split(' ').map((part) => part[0]).slice(0, 2).join('')} name={student.name} /><span className="text-xs font-semibold text-slate-200">{student.name}</span></div></td><td className="px-4 py-4"><Badge variant="neutral">{student.username}</Badge></td><td className="px-4 py-4 text-xs text-slate-300">{student.institutionName}</td><td className="px-4 py-4 text-xs text-slate-400">{student.age}</td><td className="px-4 py-4 text-xs text-slate-500">{student.schoolName || '—'}</td><td className="px-6 py-4"><div className="flex justify-end gap-1"><button onClick={() => { setSelected(student); setForm({ ...emptyForm }); setModal('password') }} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-gold-300" aria-label={`Reset password for ${student.name}`}><KeyRound size={15} /></button><button onClick={() => openEdit(student)} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white" aria-label={`Edit ${student.name}`}><Edit3 size={15} /></button><button onClick={() => setDeleting(student)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-400/5 hover:text-rose-300" aria-label={`Delete ${student.name}`}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div></Card>
      )}
      {modal && <Modal title={modal === 'add' ? 'Add student' : modal === 'edit' ? 'Edit student' : 'Reset student password'} description={modal === 'password' ? `Set a new secure password for ${selected?.name}. Their existing sessions will be revoked.` : 'A unique student username is generated automatically when the account is created.'} onClose={() => setModal(null)}><form onSubmit={save}><Feedback message={error} />{modal !== 'password' ? <><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Student name<input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} required minLength={2} autoFocus /></label><label className={labelClass}>Age<input type="number" min="3" max="100" className={inputClass} value={form.age} onChange={(e) => update('age', e.target.value)} required /></label></div><label className={`${labelClass} mt-4`}>Institution<select className={inputClass} value={form.institutionId} onChange={(e) => update('institutionId', e.target.value)} required><option value="">Select institution</option>{institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}</select></label><label className={`${labelClass} mt-4`}>School name <span className="font-normal text-slate-600">(optional)</span><input className={inputClass} value={form.schoolName} onChange={(e) => update('schoolName', e.target.value)} placeholder="Additional descriptive information" /></label></> : null}{modal !== 'edit' && <label className={`${labelClass} ${modal !== 'password' ? 'mt-4' : ''}`}>{modal === 'password' ? 'New password' : 'Initial password'}<input type="password" className={inputClass} value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" /></label>}<div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={saving}>{modal === 'add' ? 'Add student' : modal === 'edit' ? 'Save changes' : 'Reset password'}</Button></div></form></Modal>}
      {deleting && <ConfirmDialog title={`Delete ${deleting.name}?`} description="This permanently removes the student account, tournament records, and completion history. This action cannot be undone." onClose={() => setDeleting(null)} onConfirm={() => void remove()} loading={saving} />}
    </div>
  )
}
