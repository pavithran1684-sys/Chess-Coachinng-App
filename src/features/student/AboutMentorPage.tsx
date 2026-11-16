import { useEffect, useState } from 'react'
import { GraduationCap, Mail } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Feedback } from '@/components/ui/Feedback'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { api } from '@/lib/api'
import type { CoachProfile } from '@/types'

export function AboutMentorPage() {
  const [mentor, setMentor] = useState<CoachProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    api<CoachProfile>('/api/my/mentor').then(setMentor).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load mentor details.'))
  }, [])
  return <div className="page-enter"><PageHeader eyebrow="Your coach" title="About Mentor" description="Learn more about the coach guiding your chess development." /><Feedback message={error} />{!mentor && !error ? <Card><LoadingState label="Loading mentor profile…" /></Card> : mentor && <Card className="max-w-3xl overflow-hidden"><div className="h-1 bg-gradient-to-r from-gold-400/70 via-gold-400/20 to-transparent" /><div className="p-6 sm:p-8"><div className="flex flex-col gap-5 border-b border-slate-400/10 pb-7 sm:flex-row sm:items-center"><span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gold-400/20 bg-gold-400/10 text-gold-300"><GraduationCap size={29} /></span><div><h2 className="font-display text-xl font-semibold tracking-tight text-white">{mentor.name}</h2><p className="mt-1.5 text-xs font-medium text-gold-300">{mentor.title}</p></div></div><div className="py-7"><h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Professional introduction</h3><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{mentor.bio}</p></div><a href={`mailto:${mentor.email}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-400/15 bg-white/[0.025] px-4 py-3 text-xs font-medium text-slate-300 transition-colors hover:border-gold-400/25 hover:text-gold-300"><Mail size={15} />{mentor.email}</a></div></Card>}</div>
}
