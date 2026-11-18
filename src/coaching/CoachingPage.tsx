import { useEffect, useState, type FormEvent } from 'react'
import { GraduationCap, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Feedback } from '@/components/ui/Feedback'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { api } from '@/lib/api'
import { inputClass, labelClass } from '@/lib/styles'
import type { CoachProfile } from '@/types'

export function CoachingPage() {
  const [profile, setProfile] = useState<CoachProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  useEffect(() => { api<CoachProfile>('/api/coaching/profile').then(setProfile).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load coach profile.')) }, [])
  const save = async (event: FormEvent) => { event.preventDefault(); if (!profile) return; setSaving(true); setError(null); try { const updated = await api<CoachProfile>('/api/coaching/profile', { method: 'PUT', body: JSON.stringify(profile) }); setProfile(updated); setSuccess('Mentor profile updated. Students will see these details in About Mentor.') } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save profile.') } finally { setSaving(false) } }
  return <div className="page-enter"><PageHeader eyebrow="Workspace" title="Coaching" description="Manage the professional mentor introduction shared with your students." /><Feedback message={error} /><Feedback message={success} tone="success" /><Card className="max-w-3xl p-5 sm:p-7">{!profile ? <LoadingState label="Loading coach profile…" /> : <form onSubmit={save}><div className="mb-6 flex items-center gap-3 border-b border-slate-400/10 pb-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-400/20 bg-gold-400/10 text-gold-300"><GraduationCap size={20} /></span><div><h2 className="text-sm font-semibold text-white">About Mentor</h2><p className="mt-1 text-xs text-slate-500">Public coaching profile for enrolled students</p></div></div><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Coach name<input className={inputClass} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></label><label className={labelClass}>Professional title<input className={inputClass} value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} required placeholder="Chess Coach & Mentor" /></label></div><label className={`${labelClass} mt-4`}>Contact email<input type="email" className={inputClass} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required /></label><label className={`${labelClass} mt-4`}>Professional introduction<textarea className={`${inputClass} min-h-36 resize-y`} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} required placeholder="Introduce your coaching approach and experience." /></label><Button type="submit" loading={saving} className="mt-6"><Save size={14} />Save mentor profile</Button></form>}</Card></div>
}
