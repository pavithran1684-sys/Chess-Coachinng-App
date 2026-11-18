export type UserRole = 'coach' | 'student'

export interface AuthUser {
  id: number
  role: UserRole
  name: string
  email?: string
  username?: string
  institutionId?: number
  institutionName?: string
}

export interface Institution {
  id: number
  name: string
  studentCount: number
  createdAt: string
}

export interface Student {
  id: number
  name: string
  age: number
  institutionId: number
  institutionName: string
  schoolName: string | null
  username: string
  createdAt: string
}

export interface Concept {
  id: number
  name: string
  description: string
  institutionIds: number[]
  institutionNames: string[]
  assignedStudentCount: number
  completedCount: number
  createdAt: string
}

export interface ClassNote {
  id: number
  title: string
  description: string
  institutionId: number
  institutionName: string
  classDate: string
  originalFilename: string
  mimeType: string
  fileSize: number
  uploadedAt: string
}

export interface Homework {
  id: number
  title: string
  instructions: string
  dueDate: string
  institutionId: number
  institutionName: string
  published: boolean | number
  createdAt: string
  completed?: boolean | number
  completedAt?: string | null
}

export type PerformanceLevel = 'Poor' | 'Average' | 'Good' | 'Excellent'

export interface Tournament {
  id: number
  studentId?: number
  name: string
  tournamentDate: string
  position: number
  totalRounds: number
  score: number
  performanceLevel: PerformanceLevel
  coachRemarks: string | null
  createdAt: string
}

export interface CalendarClass {
  id: number
  institutionId: number
  institutionName: string
  classDate: string
  completed: boolean | number
  completedAt: string | null
}

export interface CoachProfile {
  name: string
  title: string
  bio: string
  email: string
}
