import { useEffect, useState } from 'react'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { cn } from '../../lib/format'
import { Logo } from '../ui/Logo'

export const NAV = [
  { href: '#inicio', label: 'Início' },
  { href: '#categorias', label: 'Categorias' },
  { href: '#produtos', label: 'Produtos' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#contato', label: 'Contato' },
]

export function Header() {
  const cart = useCart()
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn('sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md transition', scrolled ? 'border-line' : 'border-transparent')}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <button className="-ml-2 grid h-10 w-10 place-items-center rounded-xl md:hidden" onClick={() => setMenu((m) => !m)} aria-label="Abrir menu" aria-expanded={menu}>
          {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <a href="#inicio" className="mr-auto md:mr-6" aria-label="HILLUTECH — início"><Logo /></a>

        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Navegação principal">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-brand-50 hover:text-navy-900">{n.label}</a>
          ))}
        </nav>
        <button onClick={cart.open} className="relative grid h-10 w-10 place-items-center rounded-xl bg-navy-900 text-white transition hover:bg-navy-800" aria-label={`Abrir carrinho, ${cart.count} itens`}>
          <ShoppingBag className="h-5 w-5" />
          {cart.count > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[11px] font-bold ring-2 ring-white">{cart.count}</span>
          )}
        </button>
      </div>

      {menu && (
        <nav className="animate-fade-up border-t border-line bg-white px-4 pb-4 pt-2 md:hidden" aria-label="Menu">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setMenu(false)} className="flex h-12 items-center rounded-xl px-3 text-base font-medium text-ink hover:bg-brand-50">{n.label}</a>
          ))}
        </nav>
      )}
    </header>
  )
}
