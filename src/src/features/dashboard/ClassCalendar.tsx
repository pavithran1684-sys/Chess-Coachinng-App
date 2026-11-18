import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Circle, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Feedback } from '@/components/ui/Feedback'
import { LoadingState } from '@/components/ui/LoadingState'
import { api } from '@/lib/api'
import { inputClass, labelClass } from '@/lib/styles'
import type { CalendarClass, Institution } from '@/types'

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function ClassCalendar() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [classes, setClasses] = useState<CalendarClass[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()))
  const [institutionId, setInstitutionId] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [classData, institutionData] = await Promise.all([
        api<CalendarClass[]>(`/api/calendar?month=${monthKey(month)}`),
        api<Institution[]>('/api/institutions'),
      ])
      setClasses(classData)
      setInstitutions(institutionData)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load calendar.')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { void load() }, [load])

  const visibleClasses = useMemo(() => classes.filter((item) => {
    const completed = Boolean(item.completed)
    return filter === 'all' || (filter === 'completed' ? completed : !completed)
  }), [classes, filter])

  const selectedClasses = visibleClasses.filter((item) => item.classDate === selectedDate)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const firstWeekday = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7
  const cells = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstWeekday + 1
    return day > 0 && day <= daysInMonth ? day : null
  })

  const addClass = async () => {
    if (!institutionId) return
    setSaving(true)
    setError(null)
    try {
      await api('/api/calendar', { method: 'POST', body: JSON.stringify({ institutionId: Number(institutionId), classDate: selectedDate }) })
      setInstitutionId('')
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to add class.')
    } finally { setSaving(false) }
  }

  const toggleClass = async (item: CalendarClass) => {
    setError(null)
    try {
      await api(`/api/calendar/${item.id}/completion`, { method: 'PUT', body: JSON.stringify({ completed: !item.completed }) })
      await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update class.') }
  }

  const deleteClass = async (id: number) => {
    try {
      await api(`/api/calendar/${id}`, { method: 'DELETE' })
      await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to remove class.') }
  }

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1)
    setMonth(nextMonth)
    setSelectedDate(dateKey(nextMonth.getFullYear(), nextMonth.getMonth(), 1))
  }

  return (
    <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]" aria-label="Institution class calendar">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-400/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="font-display text-base font-semibold text-white">Institution class calendar</h2><p className="mt-1 text-xs text-slate-500">Schedule classes and track completion by institution.</p></div>
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="rounded-lg border border-slate-400/10 p-2 text-slate-400 hover:bg-white/5" aria-label="Previous month"><ChevronLeft size={17} /></button>
            <p className="min-w-36 text-center text-xs font-semibold text-slate-200">{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
            <button onClick={() => changeMonth(1)} className="rounded-lg border border-slate-400/10 p-2 text-slate-400 hover:bg-white/5" aria-label="Next month"><ChevronRight size={17} /></button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-5 pt-4 sm:px-6">
          <div className="flex rounded-lg border border-slate-400/10 bg-navy-950/50 p-1">
            {(['all', 'pending', 'completed'] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={`rounded-md px-3 py-1.5 text-[10px] font-medium capitalize ${filter === value ? 'bg-white/[0.07] text-slate-100' : 'text-slate-500'}`}>{value}</button>)}
          </div>
          <div className="hidden items-center gap-3 text-[9px] text-slate-500 sm:flex"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-400/60" />Completed</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-slate-500" />Pending</span></div>
        </div>
        {loading ? <LoadingState label="Loading calendar…" /> : (
          <div className="p-3 sm:p-5">
            <div className="grid grid-cols-7 text-center text-[9px] font-semibold uppercase tracking-wider text-slate-600">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day} className="py-2">{day}</span>)}</div>
            <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-slate-400/10">
              {cells.map((day, index) => {
                const key = day ? dateKey(month.getFullYear(), month.getMonth(), day) : ''
                const dayClasses = day ? visibleClasses.filter((item) => item.classDate === key) : []
                const allComplete = dayClasses.length > 0 && dayClasses.every((item) => Boolean(item.completed))
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={!day}
                    onClick={() => day && setSelectedDate(key)}
                    className={`relative min-h-20 border-b border-r border-slate-400/[0.08] p-1.5 text-left align-top transition-colors last:border-r-0 sm:min-h-24 sm:p-2 ${day ? 'hover:bg-white/[0.025]' : 'bg-white/[0.01]'} ${selectedDate === key ? 'bg-gold-400/[0.055] ring-1 ring-inset ring-gold-400/30' : ''} ${allComplete ? 'bg-emerald-400/[0.045]' : ''}`}
                  >
                    {day && <><span className={`text-[10px] font-medium ${selectedDate === key ? 'text-gold-300' : 'text-slate-400'}`}>{day}</span><div className="mt-1.5 space-y-1">{dayClasses.slice(0, 2).map((item) => <span key={item.id} className={`flex items-center gap-1 truncate rounded px-1 py-1 text-[8px] leading-3 ${item.completed ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-400/[0.07] text-slate-400'}`} title={`${item.institutionName} — ${item.completed ? 'Completed' : 'Pending'}`}>{item.completed && <Check size={8} className="shrink-0" />}<span className="truncate">{item.institutionName}</span></span>)}{dayClasses.length > 2 && <span className="block px-1 text-[8px] text-slate-600">+{dayClasses.length - 2} more</span>}</div></>}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold-400/20 bg-gold-400/10 text-gold-300"><CalendarDays size={17} /></span><div><p className="text-[10px] uppercase tracking-wider text-slate-500">Selected date</p><h3 className="mt-1 text-sm font-semibold text-white">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</h3></div></div>
        <Feedback message={error} />
        <div className="mt-5 space-y-3">
          {selectedClasses.length === 0 && <p className="rounded-xl border border-dashed border-slate-400/15 px-4 py-5 text-center text-[11px] leading-5 text-slate-500">No {filter === 'all' ? '' : filter} classes scheduled for this date.</p>}
          {selectedClasses.map((item) => (
            <div key={item.id} className={`rounded-xl border p-3 ${item.completed ? 'border-emerald-400/20 bg-emerald-400/[0.055]' : 'border-slate-400/10 bg-white/[0.02]'}`}>
              <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-medium text-slate-200">{item.institutionName}</p><p className={`mt-1 text-[10px] ${item.completed ? 'text-emerald-300' : 'text-slate-500'}`}>{item.completed ? 'Completed' : 'Pending'}</p></div><button onClick={() => void deleteClass(item.id)} className="rounded-md p-1.5 text-slate-600 hover:text-rose-300" aria-label={`Remove ${item.institutionName} class`}><Trash2 size={13} /></button></div>
              <Button variant={item.completed ? 'secondary' : 'primary'} onClick={() => void toggleClass(item)} className="mt-3 min-h-8 w-full px-3 py-1.5 text-[10px]">{item.completed ? <><Circle size={12} />Mark as pending</> : <><Check size={12} />Mark as completed</>}</Button>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-slate-400/10 pt-5">
          <label className={labelClass}>Schedule institution class<select className={inputClass} value={institutionId} onChange={(event) => setInstitutionId(event.target.value)}><option value="">Select institution</option>{institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}</select></label>
          <Button onClick={() => void addClass()} disabled={!institutionId} loading={saving} className="mt-3 w-full"><Plus size={14} />Add class</Button>
          {institutions.length === 0 && <p className="mt-3 text-[10px] leading-4 text-slate-500">Add an institution first to schedule a class.</p>}
        </div>
      </Card>
    </section>
  )
}
