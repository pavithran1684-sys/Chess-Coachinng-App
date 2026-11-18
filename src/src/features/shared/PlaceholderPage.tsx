import type { LucideIcon } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: LucideIcon
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="page-enter">
      <div className="mb-6">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-300">Coaching workspace</p>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>

      <Card className="flex min-h-[360px] items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-400/20 bg-gold-400/[0.08] text-gold-300">
            <Icon size={25} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Future development phase</p>
          <h2 className="mt-3 font-display text-lg font-semibold text-white">This section is ready to be built.</h2>
          <p className="mt-3 text-xs leading-6 text-slate-500">
            Navigation and routing are in place. This section will be designed around your coaching workflow in a later phase.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-400/15 px-4 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:border-gold-400/25 hover:text-gold-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to dashboard
          </Link>
        </div>
      </Card>
    </div>
  )
}
