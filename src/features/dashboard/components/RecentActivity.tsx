import type { LucideIcon } from 'lucide-react'
import { BarChart3, CalendarCheck2, NotebookPen, UserPlus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { recentActivities } from '@/data/dashboard'
import type { ActivityType } from '@/types/dashboard'

const activityIcons: Record<ActivityType, LucideIcon> = {
  attendance: CalendarCheck2,
  note: NotebookPen,
  performance: BarChart3,
  student: UserPlus,
}

const activityColors: Record<ActivityType, string> = {
  attendance: 'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300',
  note: 'border-violet-400/15 bg-violet-400/[0.08] text-violet-300',
  performance: 'border-sky-400/15 bg-sky-400/[0.08] text-sky-300',
  student: 'border-gold-400/15 bg-gold-400/[0.08] text-gold-300',
}

export function RecentActivity() {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-400/10 p-5 sm:px-6">
        <SectionHeading title="Recent activity" description="Latest updates across your workspace" />
      </div>
      <div className="px-5 sm:px-6">
        {recentActivities.map((activity) => {
          const Icon = activityIcons[activity.type]

          return (
            <article
              key={activity.id}
              className="flex gap-3 border-b border-slate-400/[0.08] py-[21px] last:border-b-0"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${activityColors[activity.type]}`}>
                <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-semibold text-slate-200">{activity.title}</h3>
                  <time className="shrink-0 text-[9px] leading-4 text-slate-600">{activity.time}</time>
                </div>
                <p className="mt-1.5 text-[11px] leading-5 text-slate-500">{activity.detail}</p>
              </div>
            </article>
          )
        })}
      </div>
      <div className="mx-5 mb-5 rounded-xl border border-slate-400/10 bg-white/[0.02] px-4 py-3 sm:mx-6 sm:mb-6">
        <p className="text-[10px] leading-4 text-slate-500">
          Activity is stored here as demonstration data for the Phase 1 preview.
        </p>
      </div>
    </Card>
  )
}
