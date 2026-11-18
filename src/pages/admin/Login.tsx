import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react'
import { DEMO_CREDENTIALS, useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { Logo } from '../../components/ui/Logo'

export default function Login() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (auth.user) return <Navigate to="/admin/produtos" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('Preencha e-mail e senha.')
    setLoading(true)
    const ok = await auth.login(email, password)
    setLoading(false)
    if (ok) navigate('/admin/produtos', { replace: true })
    else setError('E-mail ou senha incorretos.')
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-900 p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl" />
        <Logo light className="relative" />
        <div className="relative mt-auto max-w-md">
          <h2 className="text-3xl font-bold leading-tight">Gerencie sua loja de qualquer lugar.</h2>
          <p className="mt-3 text-white/70">Cadastre produtos, atualize preços e controle o estoque em poucos toques, inclusive pelo celular.</p>
        </div>
      </div>

      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link to="/" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-navy-900">
          <ArrowLeft className="h-4 w-4" /> Voltar para a loja
        </Link>

        <div className="mx-auto my-auto w-full max-w-sm py-10">
          <Logo className="lg:hidden" />
          <div className="mt-8 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 lg:mt-0"><Lock className="h-5 w-5" /></div>
          <h1 className="mt-5 text-2xl font-bold text-navy-900">Painel administrativo</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Entre com sua conta para gerenciar os produtos.</p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <Input label="E-mail" type="email" autoComplete="email" inputMode="email" placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="relative">
              <Input label="Senha" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute bottom-0 right-0 grid h-11 w-11 place-items-center text-ink-faint hover:text-ink" aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700" role="alert">{error}</p>}
            <Button type="submit" size="lg" block disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</Button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-amber-400 bg-amber-50 p-3.5 text-xs text-amber-900">
            <p className="font-semibold">Acesso de demonstração</p>
            <p className="mt-1">E-mail: <code className="font-mono">{DEMO_CREDENTIALS.email}</code><br />Senha: <code className="font-mono">{DEMO_CREDENTIALS.password}</code></p>
            <button type="button" className="mt-2 font-semibold text-amber-900 underline" onClick={() => { setEmail(DEMO_CREDENTIALS.email); setPassword(DEMO_CREDENTIALS.password) }}>Preencher automaticamente</button>
          </div>
        </div>
      </div>
    </div>
  )
}
