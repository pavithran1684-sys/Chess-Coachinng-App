interface AvatarProps {
  initials: string
  name: string
}

const palette = [
  'border-sky-400/20 bg-sky-400/10 text-sky-200',
  'border-violet-400/20 bg-violet-400/10 text-violet-200',
  'border-gold-400/20 bg-gold-400/10 text-gold-300',
  'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  'border-rose-400/20 bg-rose-400/10 text-rose-200',
  'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
]

export function Avatar({ initials, name }: AvatarProps) {
  const colorIndex = name.length % palette.length

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${palette[colorIndex]}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
