import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { fetchCatalog } from '../lib/catalogApi'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type { Category, Product } from '../types'

/**
 * Catálogo público, lido do Supabase.
 * Atualiza sozinho quando o banco muda (Realtime), quando a aba volta a ficar
 * visível e, por segurança, a cada minuto.
 */
type Status = 'loading' | 'ready' | 'error' | 'unconfigured'

interface CatalogContextValue {
  status: Status
  products: Product[]
  categories: Category[]
  error: string | null
  reload: () => void
  getProduct: (id: string) => Product | undefined
}

const CatalogContext = createContext<CatalogContextValue | null>(null)
const REFRESH_MS = 60_000

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(supabaseConfigured ? 'loading' : 'unconfigured')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const loaded = useRef(false)
  const request = useRef(0)

  const reload = useCallback(async () => {
    if (!supabaseConfigured) return
    const id = ++request.current
    try {
      const data = await fetchCatalog()
      if (id !== request.current) return
      setProducts(data.products)
      setCategories(data.categories)
      setError(null)
      setStatus('ready')
      loaded.current = true
    } catch (e) {
      if (id !== request.current) return
      console.error('Erro ao carregar o catálogo:', e)
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
      // Se já havia catálogo carregado, mantém na tela e tenta de novo depois.
      if (!loaded.current) setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    reload()

    let timer: ReturnType<typeof setTimeout> | undefined
    const soon = () => {
      clearTimeout(timer)
      timer = setTimeout(reload, 300)
    }

    const channel = supabase
      .channel('catalogo-publico')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, soon)
      .subscribe()

    const interval = setInterval(reload, REFRESH_MS)
    const onVisible = () => document.visibilityState === 'visible' && reload()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      supabase?.removeChannel(channel)
    }
  }, [reload])

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), [products])

  const value = useMemo(
    () => ({ status, products, categories, error, reload: () => void reload(), getProduct }),
    [status, products, categories, error, reload, getProduct],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog deve ser usado dentro de CatalogProvider')
  return ctx
}
