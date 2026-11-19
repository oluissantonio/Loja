import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { listCategories, listProducts, type AdminCategory, type AdminProduct } from '../lib/adminApi'
import { friendlyError } from '../lib/errors'
import { supabase } from '../lib/supabase'

/** Produtos e categorias do painel (todos, inclusive inativos), lidos do Supabase. */
interface AdminDataValue {
  status: 'loading' | 'ready' | 'error'
  error: string | null
  products: AdminProduct[]
  categories: AdminCategory[]
  reload: () => Promise<void>
  /** Atualiza um produto na tela logo após salvar, sem esperar a recarga. */
  upsertLocal: (p: AdminProduct) => void
  removeLocal: (id: string) => void
}

const AdminDataContext = createContext<AdminDataValue | null>(null)

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AdminDataValue['status']>('loading')
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const request = useRef(0)
  const loaded = useRef(false)

  const reload = useCallback(async () => {
    const id = ++request.current
    try {
      const [p, c] = await Promise.all([listProducts(), listCategories()])
      if (id !== request.current) return
      setProducts(p)
      setCategories(c)
      setError(null)
      setStatus('ready')
      loaded.current = true
    } catch (e) {
      if (id !== request.current) return
      setError(friendlyError(e, 'Não foi possível carregar os dados.'))
      if (!loaded.current) setStatus('error')
    }
  }, [])

  useEffect(() => {
    reload()
    if (!supabase) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const soon = () => { clearTimeout(timer); timer = setTimeout(reload, 400) }
    const channel = supabase
      .channel('painel-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, soon)
      .subscribe()
    const onVisible = () => document.visibilityState === 'visible' && reload()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      supabase?.removeChannel(channel)
    }
  }, [reload])

  const upsertLocal = useCallback((p: AdminProduct) => {
    setProducts((list) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list]))
  }, [])
  const removeLocal = useCallback((id: string) => setProducts((list) => list.filter((x) => x.id !== id)), [])

  const value = useMemo(
    () => ({ status, error, products, categories, reload, upsertLocal, removeLocal }),
    [status, error, products, categories, reload, upsertLocal, removeLocal],
  )
  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext)
  if (!ctx) throw new Error('useAdminData deve ser usado dentro de AdminDataProvider')
  return ctx
}
