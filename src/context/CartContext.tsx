import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { load, save } from '../lib/storage'
import { useProducts } from './ProductsContext'
import type { CartItem, Product } from '../types'

const KEY = 'hillutec:cart:v1'

interface CartLine extends CartItem {
  product: Product
}

interface CartContextValue {
  lines: CartLine[]
  count: number
  subtotal: number
  isOpen: boolean
  open: () => void
  close: () => void
  add: (productId: string, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useProducts()
  const [items, setItems] = useState<CartItem[]>(() => load(KEY, []))
  const [isOpen, setOpen] = useState(false)

  useEffect(() => save(KEY, items), [items])

  // Junta cada item ao produto atual; itens de produtos removidos somem do carrinho.
  const lines = useMemo(
    () =>
      items.flatMap((item) => {
        const product = products.find((p) => p.id === item.productId)
        return product ? [{ ...item, product }] : []
      }),
    [items, products],
  )

  const count = lines.reduce((n, l) => n + l.quantity, 0)
  const subtotal = lines.reduce((n, l) => n + l.quantity * l.product.price, 0)

  const add = useCallback((productId: string, quantity = 1) => {
    setItems((list) => {
      const found = list.find((i) => i.productId === productId)
      if (found) return list.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i))
      return [...list, { productId, quantity }]
    })
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((list) =>
      quantity <= 0 ? list.filter((i) => i.productId !== productId) : list.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    )
  }, [])

  const remove = useCallback((productId: string) => setItems((list) => list.filter((i) => i.productId !== productId)), [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(
    () => ({ lines, count, subtotal, isOpen, open: () => setOpen(true), close: () => setOpen(false), add, setQuantity, remove, clear }),
    [lines, count, subtotal, isOpen, add, setQuantity, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider')
  return ctx
}
