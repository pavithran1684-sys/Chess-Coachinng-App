export type StudentStanding = 'On track' | 'Steady' | 'Needs attention'

export interface StudentOverview {
  id: string
  name: string
  initials: string
  level: string
  institution: string
  batch: string
  attendance: number
  progress: number
  standing: StudentStanding
  focusArea: string
}

export interface UpcomingClass {
  id: string
  dateLabel: string
  dayLabel: string
  time: string
  duration: string
  institution: string
  batch: string
  topic: string
  studentCount: number
  isToday?: boolean
}

export type ActivityType = 'attendance' | 'note' | 'performance' | 'student'

export interface RecentActivity {
  id: string
  type: ActivityType
  title: string
  detail: string
  time: string
}

export interface DashboardSummary {
  totalStudents: number
  totalInstitutions: number
  classesConducted: number
  todayAttendance: number
  studentsPresent: number
  studentsExpected: number
  studentsNeedingImprovement: number
  upcomingClasses: number
}
