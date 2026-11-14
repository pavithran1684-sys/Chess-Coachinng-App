import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export type StatAccent = 'gold' | 'blue' | 'violet' | 'green' | 'rose' | 'amber'

interface StatCardProps {
  label: string
  value: string | number
  description: string
  icon: LucideIcon
  path: string
  accent: StatAccent
}

const accents: Record<StatAccent, string> = {
  gold: 'border-gold-400/20 bg-gold-400/10 text-gold-300',
  blue: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
  violet: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
  green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  rose: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
  amber: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
}

export function StatCard({ label, value, description, icon: Icon, path, accent }: StatCardProps) {
  return (
    <Link
      to={path}
      className="surface-card group relative rounded-2xl p-5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-400/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      aria-label={`${label}: ${value}. ${description}`}
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${accents[accent]}`}>
          <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <ArrowUpRight
          size={15}
          className="text-slate-700 transition-colors group-hover:text-slate-400"
          aria-hidden="true"
        />
      </div>
      <div className="mt-5">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="mt-1.5 font-display text-[30px] font-semibold leading-none tracking-[-0.04em] text-white">
          {value}
        </p>
        <p className="mt-2.5 text-[11px] leading-4 text-slate-500">{description}</p>
      </div>
    </Link>
  )
}
