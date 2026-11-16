import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}

export function Modal({ title, description, children, onClose, wide = false }: ModalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="presentation">
      <button className="absolute inset-0 bg-navy-950/85 backdrop-blur-sm" onClick={onClose} aria-label="Close dialog" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`surface-card relative max-h-[90vh] w-full overflow-y-auto rounded-2xl p-5 shadow-2xl sm:p-6 ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-title" className="font-display text-lg font-semibold text-white">{title}</h2>
            {description && <p className="mt-1.5 text-xs leading-5 text-slate-500">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
