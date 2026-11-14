import type { ReactNode } from 'react'

type BadgeVariant = 'gold' | 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  gold: 'border-gold-400/20 bg-gold-400/10 text-gold-300',
  success: 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300',
  warning: 'border-amber-400/20 bg-amber-400/[0.08] text-amber-300',
  danger: 'border-rose-400/20 bg-rose-400/[0.08] text-rose-300',
  neutral: 'border-slate-400/15 bg-slate-400/[0.06] text-slate-300',
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-none ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
