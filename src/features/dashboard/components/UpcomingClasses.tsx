import { ArrowRight, Clock3, MapPin, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { upcomingClasses } from '@/data/dashboard'

export function UpcomingClasses() {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-400/10 p-5 sm:px-6">
        <SectionHeading
          title="Upcoming classes"
          description="Your next scheduled coaching sessions"
          action={
            <Link
              to="/batches"
              className="mt-0.5 inline-flex items-center gap-1.5 rounded-md text-[11px] font-medium text-gold-300 transition-colors hover:text-gold-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
              View schedule
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          }
        />
      </div>

      <div className="px-5 sm:px-6">
        {upcomingClasses.map((classItem) => (
          <article
            key={classItem.id}
            className="flex gap-4 border-b border-slate-400/[0.08] py-5 last:border-b-0"
          >
            <div
              className={`flex h-[58px] w-[52px] shrink-0 flex-col items-center justify-center rounded-xl border ${
                classItem.isToday
                  ? 'border-gold-400/25 bg-gold-400/10'
                  : 'border-slate-400/10 bg-white/[0.025]'
              }`}
            >
              <span className={`text-[10px] font-medium ${classItem.isToday ? 'text-gold-300' : 'text-slate-500'}`}>
                {classItem.dayLabel}
              </span>
              <span className={`mt-1 text-xs font-semibold ${classItem.isToday ? 'text-gold-200' : 'text-slate-200'}`}>
                {classItem.dateLabel}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[13px] font-semibold text-slate-100">{classItem.topic}</h3>
                {classItem.isToday && <Badge variant="gold">Next class</Badge>}
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 truncate text-[11px] text-slate-400">
                <MapPin size={12} className="shrink-0 text-slate-600" aria-hidden="true" />
                <span className="truncate">{classItem.institution}</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 size={12} aria-hidden="true" />
                  {classItem.time} · {classItem.duration}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UsersRound size={12} aria-hidden="true" />
                  {classItem.studentCount} students
                </span>
              </div>
              <p className="mt-2 text-[10px] font-medium text-slate-500">{classItem.batch}</p>
            </div>
          </article>
        ))}
      </div>
    </Card>
  )
}
