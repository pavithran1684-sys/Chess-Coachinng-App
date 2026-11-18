import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { StudentLayout } from '@/components/layout/StudentLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { CoachingPage } from '@/features/coaching/CoachingPage'
import { ConceptsPage } from '@/features/concepts/ConceptsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { HomeworkPage } from '@/features/homework/HomeworkPage'
import { InstitutionsPage } from '@/features/institutions/InstitutionsPage'
import { ClassNotesPage } from '@/features/notes/ClassNotesPage'
import { PerformancePage } from '@/features/performance/PerformancePage'
import { StudentsPage } from '@/features/students/StudentsPage'
import { AboutMentorPage } from '@/features/student/AboutMentorPage'
import { StudentAchievementsPage } from '@/features/student/StudentAchievementsPage'
import { StudentConceptsPage } from '@/features/student/StudentConceptsPage'
import { StudentDashboardPage } from '@/features/student/StudentDashboardPage'
import { StudentHomeworkPage } from '@/features/student/StudentHomeworkPage'
import { StudentNotesPage } from '@/features/student/StudentNotesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute role="coach" />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/institutions" element={<InstitutionsPage />} />
          <Route path="/concepts" element={<ConceptsPage />} />
          <Route path="/performance-analysis" element={<PerformancePage />} />
          <Route path="/class-notes" element={<ClassNotesPage />} />
          <Route path="/homework" element={<HomeworkPage />} />
          <Route path="/coaching" element={<CoachingPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute role="student" />}>
        <Route element={<StudentLayout />}>
          <Route path="/student" element={<StudentDashboardPage />} />
          <Route path="/student/notes" element={<StudentNotesPage />} />
          <Route path="/student/concepts" element={<StudentConceptsPage />} />
          <Route path="/student/homework" element={<StudentHomeworkPage />} />
          <Route path="/student/achievements" element={<StudentAchievementsPage />} />
          <Route path="/student/mentor" element={<AboutMentorPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
