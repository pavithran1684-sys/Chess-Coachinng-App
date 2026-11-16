import { useEffect, useState } from 'react'
import { LayoutDashboard, LogOut, Menu, UserRound, X } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Brand } from './Brand'

const links = [
  { label: 'Dashboard', path: '/student', icon: LayoutDashboard },
  { label: 'About Mentor', path: '/student/mentor', icon: UserRound },
]

export function StudentLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      <button aria-label="Close navigation" onClick={() => setOpen(false)} className={`fixed inset-0 z-40 bg-navy-950/75 backdrop-blur-sm lg:hidden ${open ? 'visible opacity-100' : 'invisible opacity-0'}`} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-slate-400/10 bg-[#091422] transition-transform lg:visible lg:translate-x-0 ${open ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-slate-400/10 px-4"><Brand to="/student" /><button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 lg:hidden" aria-label="Close menu"><X size={19} /></button></div>
        <nav className="flex-1 px-3 py-5" aria-label="Student navigation"><p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-600">Student space</p>{links.map((link) => { const Icon = link.icon; return <NavLink key={link.path} to={link.path} end={link.path === '/student'} onClick={() => setOpen(false)} className={({ isActive }) => `mb-1 flex h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium ${isActive ? 'bg-gold-400/[0.11] text-gold-300' : 'text-slate-400 hover:bg-white/[0.035] hover:text-slate-100'}`}><Icon size={18} /><span>{link.label}</span></NavLink> })}</nav>
        <div className="border-t border-slate-400/10 p-3"><div className="flex items-center gap-3 rounded-xl border border-slate-400/10 bg-white/[0.02] px-3 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400/10 text-xs font-semibold text-gold-300">{user?.name.charAt(0)}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-200">{user?.name}</p><p className="truncate text-[10px] text-slate-500">{user?.institutionName}</p></div><button onClick={() => void logout()} className="rounded-lg p-2 text-slate-500 hover:text-rose-300" aria-label="Sign out"><LogOut size={16} /></button></div></div>
      </aside>
      <div className="min-h-screen lg:pl-[250px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-400/10 bg-navy-950/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8"><div className="flex items-center gap-3"><button onClick={() => setOpen(true)} className="rounded-lg border border-slate-400/15 p-2.5 text-slate-300 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button><div className="lg:hidden"><Brand to="/student" /></div><p className="hidden text-sm text-slate-400 lg:block">Student space <span className="mx-2 text-slate-700">/</span><span className="text-slate-200">{location.pathname === '/student/mentor' ? 'About Mentor' : 'Dashboard'}</span></p></div><span className="hidden rounded-full border border-gold-400/20 bg-gold-400/10 px-3 py-1.5 text-[10px] font-medium text-gold-300 sm:inline-flex">Student account</span></header>
        <main className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
