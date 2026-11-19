import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/**
 * Autenticação do painel com o Supabase Auth.
 *
 * Estar logado não basta: depois do login, o banco é consultado (função
 * is_admin) para saber se a conta está na tabela "admins". De qualquer forma,
 * quem garante a segurança é o RLS do banco, não esta tela.
 */
type AuthStatus = 'loading' | 'signed-out' | 'not-admin' | 'admin'
export type LoginResult = 'ok' | 'invalid' | 'not-admin' | 'error'

interface AuthContextValue {
  status: AuthStatus
  email: string | null
  login: (email: string, password: string) => Promise<{ result: LoginResult; message?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function checkAdmin(): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.rpc('is_admin')
  if (error) throw error
  return data === true
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(supabase ? 'loading' : 'signed-out')
  const [session, setSession] = useState<Session | null>(null)

  const evaluate = useCallback(async (s: Session | null) => {
    setSession(s)
    if (!s) return setStatus('signed-out')
    try {
      setStatus((await checkAdmin()) ? 'admin' : 'not-admin')
    } catch {
      setStatus('signed-out')
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => evaluate(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      // Renovação de token não muda quem está logado: evita checagens repetidas.
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return setSession(s)
      if (event === 'SIGNED_OUT') { setSession(null); setStatus('signed-out') }
    })
    return () => sub.subscription.unsubscribe()
  }, [evaluate])

  const login = useCallback<AuthContextValue['login']>(async (email, password) => {
    if (!supabase) return { result: 'error', message: 'Supabase não configurado.' }
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      if (/invalid login credentials/i.test(error.message)) return { result: 'invalid' }
      if (/email not confirmed/i.test(error.message)) return { result: 'error', message: 'E-mail ainda não confirmado.' }
      if (/fetch|network/i.test(error.message)) return { result: 'error', message: 'Sem conexão com o servidor. Verifique a internet.' }
      if (error.status === 429) return { result: 'error', message: 'Muitas tentativas. Aguarde alguns minutos.' }
      return { result: 'error', message: error.message }
    }
    try {
      if (!(await checkAdmin())) {
        await supabase.auth.signOut()
        setSession(null)
        setStatus('signed-out')
        return { result: 'not-admin' }
      }
    } catch {
      await supabase.auth.signOut()
      return { result: 'error', message: 'Não foi possível verificar sua permissão. Tente novamente.' }
    }
    setSession(data.session)
    setStatus('admin')
    return { result: 'ok' }
  }, [])

  const logout = useCallback(async () => {
    await supabase?.auth.signOut()
    setSession(null)
    setStatus('signed-out')
  }, [])

  const value = useMemo(
    () => ({ status, email: session?.user.email ?? null, login, logout }),
    [status, session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
