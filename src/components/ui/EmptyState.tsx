import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

export function EmptyState({ title, description, icon: Icon = Inbox }: { title: string; description: string; icon?: LucideIcon }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-400/10 bg-white/[0.025] text-slate-500">
        <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-200">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">{description}</p>
    </div>
  )
}
