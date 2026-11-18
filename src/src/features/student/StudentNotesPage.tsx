import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Download, ExternalLink, FileText, Image, NotebookPen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Feedback } from '@/components/ui/Feedback'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { api } from '@/lib/api'
import { formatDate, formatFileSize } from '@/lib/format'
import type { ClassNote } from '@/types'

export function StudentNotesPage() {
  const [notes, setNotes] = useState<ClassNote[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<ClassNote[]>('/api/my/notes').then(setNotes).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load your notes.'))
  }, [])

  const groups = notes?.reduce<Record<string, ClassNote[]>>((result, note) => {
    result[note.classDate] = [...(result[note.classDate] ?? []), note]
    return result
  }, {}) ?? {}

  return <div className="page-enter">
    <PageHeader eyebrow="Learning resources" title="My Notes" description="Open or download class materials shared with your institution." action={<Link to="/student" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-gold-300"><ArrowLeft size={14} />Dashboard</Link>} />
    <Feedback message={error} />
    {!notes && !error ? <Card><LoadingState label="Loading your class notes…" /></Card> : notes?.length === 0 ? <Card><EmptyState icon={NotebookPen} title="No notes shared yet" description="When your coach shares class notes with your institution, they will appear here automatically." /></Card> : (
      <div className="space-y-7">{Object.entries(groups).map(([classDate, items]) => <section key={classDate}>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-300"><CalendarDays size={14} className="text-gold-300" />{formatDate(classDate, { weekday: 'long' })}<span className="font-normal text-slate-600">· {items.length} {items.length === 1 ? 'note' : 'notes'}</span></h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((note) => {
          const isImage = note.mimeType.startsWith('image/')
          const Icon = isImage ? Image : FileText
          return <Card key={note.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300"><Icon size={18} /></span><Badge variant="neutral">{note.mimeType === 'application/pdf' ? 'PDF' : isImage ? 'Image' : 'Document'}</Badge></div>
            <h3 className="mt-4 text-sm font-semibold text-white">{note.title}</h3>
            <p className="mt-2 flex-1 whitespace-pre-wrap text-xs leading-5 text-slate-400">{note.description}</p>
            <p className="mt-4 truncate text-[10px] text-slate-600" title={note.originalFilename}>{note.originalFilename} · {formatFileSize(note.fileSize)}</p>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-400/10 pt-4">
              <a href={`/api/notes/${note.id}/file`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gold-400/20 bg-gold-400/[0.07] px-3 py-2 text-[10px] font-medium text-gold-300 hover:bg-gold-400/[0.12]"><ExternalLink size={12} />{isImage ? 'View image' : note.mimeType === 'application/pdf' ? 'Open PDF' : 'Open file'}</a>
              <a href={`/api/notes/${note.id}/file?download=1`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-400/15 px-3 py-2 text-[10px] font-medium text-slate-300 hover:bg-white/5"><Download size={12} />Download</a>
            </div>
          </Card>
        })}</div>
      </section>)}</div>
    )}
  </div>
}
