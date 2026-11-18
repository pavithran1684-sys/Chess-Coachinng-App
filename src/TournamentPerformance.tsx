import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, CalendarDays, History, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/format'
import type { PerformanceLevel, Tournament } from '@/types'

const levelVariants: Record<PerformanceLevel, 'danger' | 'warning' | 'gold' | 'success'> = {
  Poor: 'danger',
  Average: 'warning',
  Good: 'gold',
  Excellent: 'success',
}

function scorePercentage(tournament: Tournament) {
  return (tournament.score / tournament.totalRounds) * 100
}

function signed(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`
}

export function TournamentPerformance({ tournaments }: { tournaments: Tournament[] }) {
  if (tournaments.length === 0) {
    return <Card><EmptyState icon={Trophy} title="No tournament records yet" description="Tournament history, comparisons, and graphs will appear here when the coach adds actual results." /></Card>
  }

  const chronological = [...tournaments].sort((a, b) => a.tournamentDate.localeCompare(b.tournamentDate) || a.id - b.id)
  const history = [...chronological].reverse()
  const latest = chronological[chronological.length - 1]
  const previous = chronological.length > 1 ? chronological[chronological.length - 2] : null
  const latestPercentage = scorePercentage(latest)
  const previousPercentage = previous ? scorePercentage(previous) : null
  const improvement = previousPercentage === null ? null : latestPercentage - previousPercentage
  const ImprovementIcon = improvement === null || improvement === 0 ? ArrowRight : improvement > 0 ? ArrowUpRight : ArrowDownRight

  const width = 760
  const height = 260
  const padding = { left: 48, right: 24, top: 24, bottom: 48 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const points = chronological.map((tournament, index) => {
    const percentage = scorePercentage(tournament)
    return {
      tournament,
      percentage,
      x: chronological.length === 1 ? padding.left + innerWidth / 2 : padding.left + (index / (chronological.length - 1)) * innerWidth,
      y: padding.top + ((100 - percentage) / 100) * innerHeight,
    }
  })
  const labelInterval = Math.max(1, Math.ceil(chronological.length / 6))

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Latest tournament comparison">
        <Card className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Latest score</p>
          <p className="mt-3 font-display text-2xl font-semibold text-white">{latest.score}<span className="ml-1 text-sm font-normal text-slate-500">/ {latest.totalRounds}</span></p>
          <p className="mt-2 truncate text-[10px] text-slate-500" title={latest.name}>{latest.name} · {latestPercentage.toFixed(1)}%</p>
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Previous tournament comparison</p>
          {previous ? <>
            <p className="mt-3 text-sm font-semibold text-slate-200">#{previous.position} <ArrowRight className="mx-1 inline text-slate-600" size={14} /> #{latest.position}</p>
            <p className="mt-2 text-[10px] leading-4 text-slate-500">Previous score: {previous.score}/{previous.totalRounds} ({previousPercentage?.toFixed(1)}%)</p>
          </> : <p className="mt-3 text-xs leading-5 text-slate-500">Add another actual result to compare rank and score.</p>}
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Performance improvement</p>
          {improvement === null ? <p className="mt-3 text-xs leading-5 text-slate-500">No comparison yet. Only recorded results are used.</p> : <>
            <p className={`mt-3 flex items-center gap-1.5 font-display text-2xl font-semibold ${improvement > 0 ? 'text-emerald-300' : improvement < 0 ? 'text-rose-300' : 'text-slate-200'}`}><ImprovementIcon size={20} />{signed(improvement)} pts</p>
            <p className="mt-2 text-[10px] leading-4 text-slate-500">Change in score percentage from the previous tournament</p>
          </>}
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-400/10 p-5 sm:px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold-400/20 bg-gold-400/10 text-gold-300"><BarChart3 size={17} /></span>
          <div><h2 className="text-sm font-semibold text-white">Performance graph</h2><p className="mt-1 text-[10px] text-slate-500">Score as a percentage of total rounds · chronological order</p></div>
        </div>
        <div className="overflow-x-auto p-3 sm:p-5">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-auto min-w-[560px] w-full" role="img" aria-label="Tournament score percentage graph">
            {[0, 25, 50, 75, 100].map((value) => {
              const y = padding.top + ((100 - value) / 100) * innerHeight
              return <g key={value}><line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="rgba(148,163,184,0.12)" strokeDasharray="4 5" /><text x={padding.left - 10} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9">{value}%</text></g>
            })}
            {points.length > 1 && <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#d5b274" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
            {points.map((point, index) => <g key={point.tournament.id}>
              <circle cx={point.x} cy={point.y} r="5" fill="#07101d" stroke="#e4c88f" strokeWidth="2.5"><title>{point.tournament.name}: {point.tournament.score}/{point.tournament.totalRounds} ({point.percentage.toFixed(1)}%)</title></circle>
              {(index % labelInterval === 0 || index === points.length - 1) && <text x={point.x} y={height - 19} textAnchor="middle" fill="#64748b" fontSize="9">{formatDate(point.tournament.tournamentDate, { year: undefined, day: '2-digit', month: 'short' })}</text>}
            </g>)}
          </svg>
        </div>
      </Card>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-white"><History size={16} className="text-gold-300" />Tournament timeline</div>
          <ol className="relative ml-1.5 border-l border-slate-400/15 pl-6">
            {chronological.map((tournament) => <li key={tournament.id} className="relative pb-6 last:pb-0">
              <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full border-2 border-navy-900 bg-gold-400 ring-1 ring-gold-400/30" />
              <p className="text-[10px] text-slate-500">{formatDate(tournament.tournamentDate)}</p>
              <p className="mt-1 text-xs font-semibold text-slate-200">{tournament.name}</p>
              <p className="mt-1 text-[10px] text-slate-500">Rank #{tournament.position} · {tournament.score}/{tournament.totalRounds} points</p>
            </li>)}
          </ol>
        </Card>

        <section aria-label="Tournament history">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Trophy size={16} className="text-gold-300" />Tournament history</h2>
          <div className="space-y-3">
            {history.map((tournament) => <Card key={tournament.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-sm font-semibold text-slate-100">{tournament.name}</h3><p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500"><CalendarDays size={12} />{formatDate(tournament.tournamentDate)}</p></div>
                <Badge variant={levelVariants[tournament.performanceLevel]}>{tournament.performanceLevel}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-slate-400/10 bg-navy-950/40 px-4 py-3 text-center">
                <div><p className="text-[9px] uppercase tracking-wider text-slate-600">Rank</p><p className="mt-1 text-xs font-semibold text-slate-200">#{tournament.position}</p></div>
                <div><p className="text-[9px] uppercase tracking-wider text-slate-600">Score</p><p className="mt-1 text-xs font-semibold text-slate-200">{tournament.score}/{tournament.totalRounds}</p></div>
                <div><p className="text-[9px] uppercase tracking-wider text-slate-600">Score rate</p><p className="mt-1 text-xs font-semibold text-gold-300">{scorePercentage(tournament).toFixed(1)}%</p></div>
              </div>
              {tournament.coachRemarks && <div className="mt-4 border-l-2 border-gold-400/30 pl-3"><p className="text-[9px] font-medium uppercase tracking-wider text-slate-600">Coach remarks</p><p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-slate-400">{tournament.coachRemarks}</p></div>}
            </Card>)}
          </div>
        </section>
      </div>
    </div>
  )
}
