import { AlertCircle, CheckCircle2 } from 'lucide-react'

export function Feedback({ message, tone = 'error' }: { message: string | null; tone?: 'error' | 'success' }) {
  if (!message) return null
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs leading-5 ${
        tone === 'error'
          ? 'border-rose-400/20 bg-rose-400/[0.08] text-rose-200'
          : 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200'
      }`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      {message}
    </div>
  )
}
