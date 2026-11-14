import { Link } from 'react-router-dom'

interface BrandProps {
  compact?: boolean
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <Link
      to="/dashboard"
      className="group inline-flex shrink-0 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      aria-label="ChessDesk dashboard"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-400/35 bg-gold-400/10 text-[25px] leading-none text-gold-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors group-hover:bg-gold-400/15">
        <span aria-hidden="true" className="-mt-0.5 font-serif">♞</span>
      </span>
      {!compact && (
        <span className="flex flex-col">
          <span className="font-display text-[19px] font-bold tracking-[-0.035em] text-white">
            Chess<span className="text-gold-300">Desk</span>
          </span>
          <span className="mt-0.5 whitespace-nowrap text-[9px] font-semibold tracking-[0.2em] text-slate-500">
            COACHING WORKSPACE
          </span>
        </span>
      )}
    </Link>
  )
}
