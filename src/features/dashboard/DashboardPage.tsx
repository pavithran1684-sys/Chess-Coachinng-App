import { CalendarDays } from 'lucide-react'
import { dashboardSummary } from '@/data/dashboard'
import { DashboardStats } from './components/DashboardStats'
import { RecentActivity } from './components/RecentActivity'
import { StudentOverview } from './components/StudentOverview'
import { UpcomingClasses } from './components/UpcomingClasses'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="page-enter space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-px w-5 bg-gold-400" aria-hidden="true" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-300">Dashboard overview</p>
          </div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.04em] text-white sm:text-[30px]">
            {getGreeting()}, Coach<span className="text-gold-400">.</span>
          </h1>
          <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-[13px]">
            Here’s what’s happening across your coaching practice.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2.5 rounded-xl border border-slate-400/10 bg-white/[0.025] px-3.5 py-2.5 text-[11px] font-medium text-slate-400">
          <CalendarDays size={15} className="text-gold-400" aria-hidden="true" />
          {formattedDate}
        </div>
      </section>

      <DashboardStats summary={dashboardSummary} />

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]" aria-label="Schedule and activity">
        <UpcomingClasses />
        <RecentActivity />
      </section>

      <StudentOverview />
    </div>
  )
}
