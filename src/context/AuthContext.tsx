import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * LOGIN DEMONSTRATIVO — não é seguro e serve só para visualizar o painel.
 * Será trocado pela autenticação do Supabase.
 */
export const DEMO_CREDENTIALS = { email: 'admin@hillutec.demo', password: 'demo1234' }
const KEY = 'hillutec:admin-session'

interface AuthContextValue {
  user: { email: string } | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession() {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(readSession)

  const value = useMemo<AuthContextValue>(
    () => ({
      user: email ? { email } : null,
      async login(e, p) {
        await new Promise((r) => setTimeout(r, 500))
        const ok = e.trim().toLowerCase() === DEMO_CREDENTIALS.email && p === DEMO_CREDENTIALS.password
        if (ok) {
          setEmail(DEMO_CREDENTIALS.email)
          try { sessionStorage.setItem(KEY, DEMO_CREDENTIALS.email) } catch { /* ignore */ }
        }
        return ok
      },
      logout() {
        setEmail(null)
        try { sessionStorage.removeItem(KEY) } catch { /* ignore */ }
      },
    }),
    [email],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
