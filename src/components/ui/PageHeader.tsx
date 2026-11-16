import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-300">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm">{description}</p>
      </div>
      {action}
    </div>
  )
}
