import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { navigationItems } from '@/config/navigation'
import { Brand } from './Brand'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const currentItem = navigationItems.find((item) => item.path === location.pathname)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSidebarOpen(false)
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    if (!isSidebarOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isSidebarOpen])

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-950 transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-400/10 bg-navy-950/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg border border-slate-400/15 p-2.5 text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={isSidebarOpen}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="hidden items-center gap-2 text-sm lg:flex">
              <span className="text-slate-500">Coaching workspace</span>
              <span className="text-slate-700" aria-hidden="true">/</span>
              <span className="font-medium text-slate-200">{currentItem?.label ?? 'Dashboard'}</span>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-xs font-medium text-slate-200">Coach account</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Personal workspace</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/20 bg-gold-400/10 text-xs font-semibold text-gold-300">
              C
            </span>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
