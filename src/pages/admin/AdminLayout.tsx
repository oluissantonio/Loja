import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ExternalLink, LogOut, Package, Settings, ShoppingCart } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/format'
import { Logo } from '../../components/ui/Logo'

const items = [
  { to: '/admin/produtos', label: 'Produtos', icon: Package, ready: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart, ready: false },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings, ready: false },
]

export default function AdminLayout() {
  const auth = useAuth()
  const navigate = useNavigate()
  if (!auth.user) return <Navigate to="/admin" replace />

  const logout = () => { auth.logout(); navigate('/admin', { replace: true }) }

  return (
    <div className="min-h-dvh bg-slate-50 lg:grid lg:grid-cols-[264px_1fr]">
      {/* Barra lateral (computador) */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-navy-900 p-4 text-white lg:flex">
        <Logo light className="px-2 py-2" />
        <p className="mt-1 px-2 text-xs text-white/50">Painel administrativo</p>
        <nav className="mt-8 space-y-1">
          {items.map(({ to, label, icon: Icon, ready }) =>
            ready ? (
              <NavLink key={to} to={to} className={({ isActive }) => cn('flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition', isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white')}>
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ) : (
              <span key={to} className="flex h-11 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm font-medium text-white/30">
                <Icon className="h-4 w-4" /> {label} <span className="ml-auto whitespace-nowrap rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider">Em breve</span>
              </span>
            ),
          )}
        </nav>
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          <a href="/" target="_blank" rel="noreferrer" className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-white/60 hover:bg-white/5 hover:text-white"><ExternalLink className="h-4 w-4" /> Ver loja</a>
          <button onClick={logout} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-white/60 hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" /> Sair</button>
          <p className="truncate px-3 pt-2 text-xs text-white/40">{auth.user.email}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Topo (celular) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
          <Logo />
          <div className="flex items-center gap-1">
            <a href="/" target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-xl text-ink-muted hover:bg-brand-50" aria-label="Ver loja"><ExternalLink className="h-5 w-5" /></a>
            <button onClick={logout} className="grid h-10 w-10 place-items-center rounded-xl text-ink-muted hover:bg-brand-50" aria-label="Sair"><LogOut className="h-5 w-5" /></button>
          </div>
        </header>

        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
          Modo demonstração: o painel ainda não está ligado ao banco de dados. As alterações aqui ficam só neste navegador e não mudam a loja.
        </div>

        <main className="flex-1 pb-24 lg:pb-8"><Outlet /></main>

        {/* Navegação inferior (celular) */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
          {items.map(({ to, label, icon: Icon, ready }) =>
            ready ? (
              <NavLink key={to} to={to} className={({ isActive }) => cn('flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium', isActive ? 'text-brand-600' : 'text-ink-muted')}>
                <Icon className="h-5 w-5" /> {label}
              </NavLink>
            ) : (
              <span key={to} className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-faint/60">
                <Icon className="h-5 w-5" /> {label}
                <span className="-mt-0.5 text-[9px] uppercase tracking-wider">em breve</span>
              </span>
            ),
          )}
        </nav>
      </div>
    </div>
  )
}
