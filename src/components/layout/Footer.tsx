import { Link } from 'react-router-dom'
import { Instagram, Mail, MapPin, MessageCircle } from 'lucide-react'
import { Logo } from '../ui/Logo'
import { NAV } from './Header'

export function Footer() {
  return (
    <footer id="contato" className="scroll-mt-20 bg-navy-950 text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">Acessórios eletrônicos para o seu dia a dia: carregadores, cabos, fones, power banks e muito mais.</p>
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-white">Navegação</p>
          <ul className="mt-3 space-y-2 text-sm">
            {NAV.map((n) => <li key={n.href}><a href={n.href} className="hover:text-white">{n.label}</a></li>)}
            <li><Link to="/admin" className="hover:text-white">Painel administrativo</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-white">Contato <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">exemplo</span></p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-brand-400" /> (00) 00000-0000</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-400" /> contato@hillutec.demo</li>
            <li className="flex items-center gap-2"><Instagram className="h-4 w-4 text-brand-400" /> @hillutec</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-400" /> Sua cidade, UF</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/40">© {new Date().getFullYear()} HILLUTEC. Todos os direitos reservados.</div>
    </footer>
  )
}
