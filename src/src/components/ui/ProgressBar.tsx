interface ProgressBarProps {
  value: number
  label: string
  tone?: 'gold' | 'green' | 'rose'
}

const tones = {
  gold: 'bg-gold-400',
  green: 'bg-emerald-400',
  rose: 'bg-rose-400',
}

export function ProgressBar({ value, label, tone = 'gold' }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value))

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/40"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <div
        className={`h-full rounded-full ${tones[tone]}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}
