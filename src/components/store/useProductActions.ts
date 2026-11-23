import { useCart } from '../../context/CartContext'
import { usePurchase } from '../../context/PurchaseContext'
import { useToast } from '../../context/ToastContext'
import type { Product } from '../../types'

/**
 * Ações dos botões dos produtos. "Comprar" e "Tenho interesse" abrem a tela de
 * confirmação; só ela leva ao WhatsApp. Nada aqui altera o estoque.
 */
export function useProductActions() {
  const cart = useCart()
  const purchase = usePurchase()
  const notify = useToast()

  return {
    addToCart(product: Product, quantity = 1) {
      cart.add(product.id, quantity)
      notify(`${product.name} foi para o carrinho`)
    },
    buyNow(product: Product, quantity = 1) {
      purchase.start({ mode: 'buy', productId: product.id, quantity })
    },
    interest(product: Product) {
      purchase.start({ mode: 'interest', productId: product.id })
    },
    checkoutCart() {
      purchase.start({ mode: 'cart' })
    },
  }
}
