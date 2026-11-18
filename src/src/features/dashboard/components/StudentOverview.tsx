import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { studentOverview } from '@/data/dashboard'
import type { StudentStanding } from '@/types/dashboard'

function standingVariant(standing: StudentStanding) {
  if (standing === 'On track') return 'success'
  if (standing === 'Needs attention') return 'danger'
  return 'warning'
}

function attendanceColor(attendance: number) {
  if (attendance >= 90) return 'text-emerald-300'
  if (attendance < 80) return 'text-rose-300'
  return 'text-slate-200'
}

export function StudentOverview() {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-400/10 p-5 sm:px-6">
        <SectionHeading
          title="Student overview"
          description="A quick view of learning progress, attendance, and current focus areas"
          action={
            <Link
              to="/students"
              className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-md text-[11px] font-medium text-gold-300 transition-colors hover:text-gold-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
              View all students
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          }
        />
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-400/10 bg-white/[0.015] text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-600">
              <th scope="col" className="px-6 py-3.5">Student</th>
              <th scope="col" className="px-4 py-3.5">Institution / Batch</th>
              <th scope="col" className="px-4 py-3.5">Current focus</th>
              <th scope="col" className="px-4 py-3.5">Attendance</th>
              <th scope="col" className="px-4 py-3.5">Learning progress</th>
              <th scope="col" className="px-6 py-3.5">Standing</th>
            </tr>
          </thead>
          <tbody>
            {studentOverview.map((student) => (
              <tr key={student.id} className="border-b border-slate-400/[0.08] transition-colors last:border-b-0 hover:bg-white/[0.018]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar initials={student.initials} name={student.name} />
                    <div>
                      <p className="whitespace-nowrap text-xs font-semibold text-slate-200">{student.name}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{student.level}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="max-w-[190px] truncate text-[11px] text-slate-300">{student.institution}</p>
                  <p className="mt-1 text-[10px] text-slate-600">{student.batch}</p>
                </td>
                <td className="px-4 py-4 text-[11px] text-slate-400">{student.focusArea}</td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-semibold ${attendanceColor(student.attendance)}`}>
                    {student.attendance}%
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex min-w-[120px] items-center gap-3">
                    <ProgressBar
                      value={student.progress}
                      label={`${student.name} learning progress`}
                      tone={student.standing === 'Needs attention' ? 'rose' : 'gold'}
                    />
                    <span className="w-7 text-right text-[10px] font-medium text-slate-400">{student.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={standingVariant(student.standing)}>{student.standing}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-400/[0.08] md:hidden">
        {studentOverview.map((student) => (
          <article key={student.id} className="p-5">
            <div className="flex items-start gap-3">
              <Avatar initials={student.initials} name={student.name} />
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-semibold text-slate-200">{student.name}</h3>
                <p className="mt-1 text-[10px] text-slate-500">{student.level} · {student.batch}</p>
              </div>
              <Badge variant={standingVariant(student.standing)}>{student.standing}</Badge>
            </div>
            <p className="mt-4 truncate text-[11px] text-slate-400">{student.institution}</p>
            <p className="mt-1.5 text-[10px] text-slate-600">Focus: {student.focusArea}</p>
            <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-5">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-600">Attendance</p>
                <p className={`mt-1 text-xs font-semibold ${attendanceColor(student.attendance)}`}>
                  {student.attendance}%
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-600">
                  <span>Learning progress</span>
                  <span className="font-semibold text-slate-400">{student.progress}%</span>
                </div>
                <ProgressBar
                  value={student.progress}
                  label={`${student.name} learning progress`}
                  tone={student.standing === 'Needs attention' ? 'rose' : 'gold'}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </Card>
  )
}
