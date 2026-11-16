import { NavLink } from 'react-router-dom'
import { LogOut, X } from 'lucide-react'
import { navigationItems, type NavigationItem } from '@/config/navigation'
import { useAuth } from '@/context/AuthContext'
import { Brand } from './Brand'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function SidebarLink({ item, onClose }: { item: NavigationItem; onClose: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      onClick={onClose}
      className={({ isActive }) =>
        `group relative flex h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
          isActive ? 'bg-gold-400/[0.11] text-gold-300' : 'text-slate-400 hover:bg-white/[0.035] hover:text-slate-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} strokeWidth={isActive ? 2 : 1.7} className={isActive ? 'text-gold-300' : 'text-slate-500 group-hover:text-slate-300'} aria-hidden="true" />
          <span>{item.label}</span>
          {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-400" aria-hidden="true" />}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  return (
    <>
      <button type="button" aria-label="Close navigation" onClick={onClose} className={`fixed inset-0 z-40 bg-navy-950/75 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'}`} />
      <aside aria-label="Coach navigation" className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-slate-400/10 bg-[#091422] shadow-2xl transition-transform duration-300 ease-out lg:visible lg:translate-x-0 lg:shadow-none ${isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}>
        <div className="flex h-[76px] shrink-0 items-center justify-between gap-2 border-b border-slate-400/10 px-4">
          <Brand />
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Close navigation menu"><X size={19} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-600">Coach workspace</p>
          <div className="space-y-1">
            {navigationItems.map((item) => <SidebarLink key={item.path} item={item} onClose={onClose} />)}
          </div>
        </nav>
        <div className="shrink-0 border-t border-slate-400/10 p-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-400/10 bg-white/[0.02] px-3 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-400/10 text-xs font-semibold text-gold-300">{user?.name.charAt(0) ?? 'C'}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-200">{user?.name}</p><p className="mt-0.5 text-[10px] text-slate-500">Coach / Admin</p></div>
            <button onClick={() => void logout()} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-rose-300" aria-label="Sign out"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
    </>
  )
}
