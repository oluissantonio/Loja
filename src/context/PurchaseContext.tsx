import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Pedido em confirmação (antes de abrir o WhatsApp).
 * - "buy": botão Comprar de um produto
 * - "interest": botão Tenho interesse
 * - "cart": Finalizar pedido do carrinho
 */
export type PurchaseRequest =
  | { mode: 'buy'; productId: string; quantity: number }
  | { mode: 'interest'; productId: string }
  | { mode: 'cart' }

interface PurchaseContextValue {
  request: PurchaseRequest | null
  start: (r: PurchaseRequest) => void
  cancel: () => void
}

const PurchaseContext = createContext<PurchaseContextValue | null>(null)

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<PurchaseRequest | null>(null)
  const start = useCallback((r: PurchaseRequest) => setRequest(r), [])
  const cancel = useCallback(() => setRequest(null), [])
  const value = useMemo(() => ({ request, start, cancel }), [request, start, cancel])
  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>
}

export function usePurchase() {
  const ctx = useContext(PurchaseContext)
  if (!ctx) throw new Error('usePurchase deve ser usado dentro de PurchaseProvider')
  return ctx
}
