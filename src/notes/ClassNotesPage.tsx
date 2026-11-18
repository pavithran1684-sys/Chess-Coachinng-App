import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { CalendarDays, Download, Edit3, ExternalLink, FileText, Image, NotebookPen, Plus, Trash2 } from 'lucide-react'
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
import type { ClassNote, Institution } from '@/types'

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ClassNotesPage() {
  const [notes, setNotes] = useState<ClassNote[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ClassNote | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', institutionId: '', classDate: '' })
  const [file, setFile] = useState<File | null>(null)
  const [deleting, setDeleting] = useState<ClassNote | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const load = useCallback(async () => { try { const [noteData, institutionData] = await Promise.all([api<ClassNote[]>('/api/notes'), api<Institution[]>('/api/institutions')]); setNotes(noteData); setInstitutions(institutionData) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load notes.') } finally { setLoading(false) } }, [])
  useEffect(() => { void load() }, [load])
  const openForm = (note?: ClassNote) => { setSelected(note ?? null); setForm(note ? { title: note.title, description: note.description, institutionId: String(note.institutionId), classDate: note.classDate } : { title: '', description: '', institutionId: '', classDate: '' }); setFile(null); setError(null); setOpen(true) }
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null)
    const body = new FormData(); body.append('title', form.title); body.append('description', form.description); body.append('institutionId', form.institutionId); body.append('classDate', form.classDate); if (file) body.append('file', file)
    try { await api(selected ? `/api/notes/${selected.id}` : '/api/notes', { method: selected ? 'PUT' : 'POST', body }); setSuccess(selected ? 'Class note updated successfully.' : 'Class note uploaded and shared successfully.'); setOpen(false); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save class note.') }
    finally { setSaving(false) }
  }
  const remove = async () => { if (!deleting) return; setSaving(true); try { await api(`/api/notes/${deleting.id}`, { method: 'DELETE' }); setSuccess('Class note deleted successfully.'); setDeleting(null); await load() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete class note.'); setDeleting(null) } finally { setSaving(false) } }
  return <div className="page-enter"><PageHeader eyebrow="Learning resources" title="Class Notes" description="Upload a file once and share it automatically with an entire institution." action={<Button onClick={() => openForm()} disabled={institutions.length === 0}><Plus size={15} />Upload notes</Button>} /><Feedback message={error} /><Feedback message={success} tone="success" />{loading ? <Card><LoadingState label="Loading class notes…" /></Card> : notes.length === 0 ? <Card><EmptyState icon={NotebookPen} title="No class notes uploaded" description="Upload a PDF, image, or document and assign it to an institution." /></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{notes.map((note) => { const isImage = note.mimeType.startsWith('image/'); const Icon = isImage ? Image : FileText; return <Card key={note.id} className="flex flex-col p-5"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300"><Icon size={18} /></span><div className="flex gap-1"><button onClick={() => openForm(note)} className="rounded-lg p-2 text-slate-500 hover:text-white" aria-label={`Edit ${note.title}`}><Edit3 size={15} /></button><button onClick={() => setDeleting(note)} className="rounded-lg p-2 text-slate-500 hover:text-rose-300" aria-label={`Delete ${note.title}`}><Trash2 size={15} /></button></div></div><h2 className="mt-4 text-sm font-semibold text-white">{note.title}</h2><p className="mt-2 line-clamp-3 flex-1 text-xs leading-5 text-slate-400">{note.description}</p><div className="mt-4 space-y-2 text-[10px] text-slate-500"><Badge variant="neutral">{note.institutionName}</Badge><p className="flex items-center gap-1.5"><CalendarDays size={12} />{new Date(`${note.classDate}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p><p className="truncate">{note.originalFilename} · {fileSize(note.fileSize)}</p></div><div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-400/10 pt-4"><a href={`/api/notes/${note.id}/file`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-400/15 px-3 py-2 text-[10px] font-medium text-slate-300 hover:bg-white/5"><ExternalLink size={12} />Open</a><a href={`/api/notes/${note.id}/file?download=1`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-400/15 px-3 py-2 text-[10px] font-medium text-slate-300 hover:bg-white/5"><Download size={12} />Download</a></div></Card>})}</div>}{open && <Modal wide title={selected ? 'Edit class note' : 'Upload class notes'} description="The file is accessible only to coaches and students in the assigned institution." onClose={() => setOpen(false)}><form onSubmit={save}><Feedback message={error} /><label className={labelClass}>Note title<input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus /></label><label className={`${labelClass} mt-4`}>Description<textarea className={`${inputClass} min-h-24 resize-y`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className={labelClass}>Institution<select className={inputClass} value={form.institutionId} onChange={(e) => setForm({ ...form, institutionId: e.target.value })} required><option value="">Select institution</option>{institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}</select></label><label className={labelClass}>Class date<input type="date" className={inputClass} value={form.classDate} onChange={(e) => setForm({ ...form, classDate: e.target.value })} required /></label></div><label className={`${labelClass} mt-4`}>{selected ? 'Replace file (optional)' : 'File upload'}<input type="file" className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-gold-400/10 file:px-3 file:py-1.5 file:text-xs file:text-gold-300`} onChange={(e) => setFile(e.target.files?.[0] ?? null)} required={!selected} accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.txt,.ppt,.pptx" /><span className="mt-2 block text-[10px] font-normal text-slate-600">PDF, images, or common documents. Maximum 10 MB.</span></label><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={saving} disabled={!selected && !file}>{selected ? 'Save changes' : 'Upload and share'}</Button></div></form></Modal>}{deleting && <ConfirmDialog title={`Delete ${deleting.title}?`} description="This permanently removes the uploaded file and revokes student access." onClose={() => setDeleting(null)} onConfirm={() => void remove()} loading={saving} />}</div>
}
