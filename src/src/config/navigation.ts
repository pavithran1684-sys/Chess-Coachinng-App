import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BrainCircuit,
  Building2,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  UsersRound,
} from 'lucide-react'

export interface NavigationItem {
  label: string
  path: string
  icon: LucideIcon
  description: string
}

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, description: 'Institution overview and class calendar.' },
  { label: 'Students', path: '/students', icon: UsersRound, description: 'Manage student records and login accounts.' },
  { label: 'Institutions', path: '/institutions', icon: Building2, description: 'Manage coaching institutions and student assignments.' },
  { label: 'Concepts', path: '/concepts', icon: BrainCircuit, description: 'Create and assign chess concepts by institution.' },
  { label: 'Performance Analysis', path: '/performance-analysis', icon: BarChart3, description: 'Record and review student tournament performance.' },
  { label: 'Class Notes', path: '/class-notes', icon: NotebookPen, description: 'Upload and share learning materials by institution.' },
  { label: 'Homework', path: '/homework', icon: ClipboardCheck, description: 'Publish institution-wise homework.' },
  { label: 'Coaching', path: '/coaching', icon: GraduationCap, description: 'Manage the mentor profile shared with students.' },
]
