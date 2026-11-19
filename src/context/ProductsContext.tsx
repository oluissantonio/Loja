import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEMO_PRODUCTS } from '../data/demoProducts'
import { load, save } from '../lib/storage'
import { uid } from '../lib/format'
import type { Product } from '../types'

/**
 * Produtos do PAINEL DE DEMONSTRAÇÃO. Ficam só no navegador (localStorage)
 * e não afetam a loja, que lê do Supabase (ver CatalogContext).
 * Será substituído pela gestão real de produtos na etapa do painel.
 */
const KEY = 'hillutec:admin-demo-products:v2'

interface ProductsContextValue {
  products: Product[]
  getProduct: (id: string) => Product | undefined
  addProduct: (data: Omit<Product, 'id'>) => Product
  updateProduct: (id: string, data: Partial<Product>) => void
  removeProduct: (id: string) => void
  resetDemo: () => void
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => load(KEY, DEMO_PRODUCTS))

  useEffect(() => save(KEY, products), [products])

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), [products])

  const addProduct = useCallback((data: Omit<Product, 'id'>) => {
    const product = { ...data, id: uid() }
    setProducts((list) => [product, ...list])
    return product
  }, [])

  const updateProduct = useCallback((id: string, data: Partial<Product>) => {
    setProducts((list) => list.map((p) => (p.id === id ? { ...p, ...data } : p)))
  }, [])

  const removeProduct = useCallback((id: string) => {
    setProducts((list) => list.filter((p) => p.id !== id))
  }, [])

  const resetDemo = useCallback(() => setProducts(DEMO_PRODUCTS), [])

  const value = useMemo(
    () => ({ products, getProduct, addProduct, updateProduct, removeProduct, resetDemo }),
    [products, getProduct, addProduct, updateProduct, removeProduct, resetDemo],
  )

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts deve ser usado dentro de ProductsProvider')
  return ctx
}
