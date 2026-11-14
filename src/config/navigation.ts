import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BrainCircuit,
  Building2,
  CalendarCheck2,
  ClipboardList,
  LayoutDashboard,
  Layers3,
  NotebookPen,
  Settings2,
  UsersRound,
} from 'lucide-react'

export type NavigationSection = 'Overview' | 'Management' | 'Coaching' | 'Insights' | 'Workspace'

export interface NavigationItem {
  label: string
  path: string
  icon: LucideIcon
  section: NavigationSection
  description: string
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    section: 'Overview',
    description: 'Your coaching practice at a glance.',
  },
  {
    label: 'Students',
    path: '/students',
    icon: UsersRound,
    section: 'Management',
    description: 'Manage student profiles and their learning journeys.',
  },
  {
    label: 'Institutions',
    path: '/institutions',
    icon: Building2,
    section: 'Management',
    description: 'Organize the schools and institutions you work with.',
  },
  {
    label: 'Batches',
    path: '/batches',
    icon: Layers3,
    section: 'Management',
    description: 'Keep student groups, levels, and schedules organized.',
  },
  {
    label: 'Concept Tracking',
    path: '/concept-tracking',
    icon: BrainCircuit,
    section: 'Coaching',
    description: 'Track chess concepts taught and each student’s understanding.',
  },
  {
    label: 'Attendance',
    path: '/attendance',
    icon: CalendarCheck2,
    section: 'Coaching',
    description: 'Record attendance and follow participation over time.',
  },
  {
    label: 'Performance Analysis',
    path: '/performance-analysis',
    icon: BarChart3,
    section: 'Coaching',
    description: 'Identify strengths, weaknesses, and meaningful learning trends.',
  },
  {
    label: 'Class Notes',
    path: '/class-notes',
    icon: NotebookPen,
    section: 'Coaching',
    description: 'Keep a useful record of lessons, observations, and next steps.',
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: ClipboardList,
    section: 'Insights',
    description: 'Prepare clear individual student performance reports.',
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings2,
    section: 'Workspace',
    description: 'Manage your workspace preferences and coaching profile.',
  },
]

export const navigationSections: NavigationSection[] = [
  'Overview',
  'Management',
  'Coaching',
  'Insights',
]
