import { Link } from 'react-router-dom'
import { buttonClass } from '../components/ui/Button'
import { Logo } from '../components/ui/Logo'

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Logo />
        <p className="mt-10 font-display text-5xl font-bold text-navy-900">404</p>
        <p className="mt-2 text-ink-muted">Esta página não existe.</p>
        <Link to="/" className={buttonClass('primary', 'md') + ' mt-6'}>Voltar para a loja</Link>
      </div>
    </div>
  )
}
