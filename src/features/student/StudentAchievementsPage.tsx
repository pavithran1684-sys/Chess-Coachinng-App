import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Feedback } from '@/components/ui/Feedback'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { TournamentPerformance } from '@/components/TournamentPerformance'
import { api } from '@/lib/api'
import type { Tournament } from '@/types'

export function StudentAchievementsPage() {
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    api<Tournament[]>('/api/my/tournaments').then(setTournaments).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load your achievements.'))
  }, [])
  return <div className="page-enter"><PageHeader eyebrow="Your progress" title="My Achievements" description="Review your tournament history and the performance records entered by your coach." /><Feedback message={error} />{tournaments ? <TournamentPerformance tournaments={tournaments} /> : !error && <Card><LoadingState label="Loading your achievements…" /></Card>}</div>
}
