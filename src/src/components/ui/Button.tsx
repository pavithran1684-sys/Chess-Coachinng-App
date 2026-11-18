import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  loading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-gold-400 text-navy-950 hover:bg-gold-300 border-gold-400',
  secondary: 'border-slate-400/15 bg-white/[0.035] text-slate-200 hover:border-slate-400/30 hover:bg-white/[0.06]',
  danger: 'border-rose-400/20 bg-rose-400/10 text-rose-300 hover:bg-rose-400/15',
  ghost: 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
}

export function Button({ children, variant = 'primary', loading = false, disabled, type = 'button', className = '', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
