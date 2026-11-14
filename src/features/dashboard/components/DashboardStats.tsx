import {
  Building2,
  CalendarCheck2,
  CalendarDays,
  NotebookPen,
  UserRoundSearch,
  UsersRound,
} from 'lucide-react'
import { StatCard, type StatAccent } from '@/components/ui/StatCard'
import type { DashboardSummary } from '@/types/dashboard'

interface DashboardStatsProps {
  summary: DashboardSummary
}

export function DashboardStats({ summary }: DashboardStatsProps) {
  const stats = [
    {
      label: 'Total Students',
      value: summary.totalStudents,
      description: 'Across all active batches',
      icon: UsersRound,
      path: '/students',
      accent: 'gold' as StatAccent,
    },
    {
      label: 'Total Institutions',
      value: summary.totalInstitutions,
      description: 'Active coaching locations',
      icon: Building2,
      path: '/institutions',
      accent: 'blue' as StatAccent,
    },
    {
      label: 'Classes Conducted',
      value: summary.classesConducted,
      description: 'This academic year',
      icon: NotebookPen,
      path: '/class-notes',
      accent: 'violet' as StatAccent,
    },
    {
      label: "Today’s Attendance",
      value: `${summary.todayAttendance}%`,
      description: `${summary.studentsPresent} of ${summary.studentsExpected} students present`,
      icon: CalendarCheck2,
      path: '/attendance',
      accent: 'green' as StatAccent,
    },
    {
      label: 'Needing Improvement',
      value: summary.studentsNeedingImprovement,
      description: 'Students needing focused support',
      icon: UserRoundSearch,
      path: '/performance-analysis',
      accent: 'rose' as StatAccent,
    },
    {
      label: 'Upcoming Classes',
      value: summary.upcomingClasses,
      description: 'Scheduled for the next 7 days',
      icon: CalendarDays,
      path: '/batches',
      accent: 'amber' as StatAccent,
    },
  ]

  return (
    <section aria-label="Coaching summary">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}
