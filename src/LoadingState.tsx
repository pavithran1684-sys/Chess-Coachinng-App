import { LoaderCircle } from 'lucide-react'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-xs text-slate-400" role="status">
      <LoaderCircle size={18} className="animate-spin text-gold-400" aria-hidden="true" />
      {label}
    </div>
  )
}
