import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import type { Product } from '../../types'

/** Ações dos botões "Tenho interesse" e "Comprar", compartilhadas pelo card e pelos detalhes. */
export function useProductActions() {
  const cart = useCart()
  const notify = useToast()

  return {
    addToCart(product: Product, quantity = 1) {
      cart.add(product.id, quantity)
      notify(`${product.name} foi para o carrinho`)
    },
    buyNow(product: Product, quantity = 1) {
      cart.add(product.id, quantity)
      cart.open()
    },
    interest(product: Product) {
      // Próxima etapa: abrir conversa no WhatsApp com o nome do produto já preenchido.
      notify(`Interesse em "${product.name}" registrado (demonstração: o WhatsApp entra na próxima etapa)`, 'info')
    },
  }
}
