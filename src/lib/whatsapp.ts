import { STORE } from '../config/store'
import { formatPrice } from './format'
import type { Product } from '../types'

/**
 * Mensagens e links do WhatsApp (link oficial wa.me).
 * Abrir o link NÃO altera o estoque: o administrador atualiza o estoque no
 * painel depois de confirmar a venda com o cliente.
 */

/** "R$ 69,99" com espaço comum (o formatador usa um espaço especial que alguns apps mostram estranho). */
export const priceText = (value: number) => formatPrice(value).replace(/\s/g, ' ')

export function whatsappLink(message: string, phone = STORE.whatsapp) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export interface OrderLine {
  product: Pick<Product, 'name' | 'price'>
  quantity: number
}

/** Mensagem de compra (um produto ou vários, vindos do carrinho). */
export function purchaseMessage(lines: OrderLine[]) {
  if (lines.length === 1) {
    const { product, quantity } = lines[0]
    if (quantity === 1) {
      return `Olá! Tenho interesse no produto ${product.name}, anunciado por ${priceText(product.price)}. Gostaria de confirmar a disponibilidade e realizar a compra.`
    }
    return `Olá! Tenho interesse em ${quantity} unidades do produto ${product.name}, anunciado por ${priceText(product.price)} cada (total de ${priceText(product.price * quantity)}). Gostaria de confirmar a disponibilidade e realizar a compra.`
  }
  const items = lines.map(({ product, quantity }) => `• ${quantity}x ${product.name} — ${priceText(product.price * quantity)}`)
  const total = lines.reduce((n, l) => n + l.product.price * l.quantity, 0)
  return [
    'Olá! Tenho interesse nos seguintes produtos:',
    '',
    ...items,
    '',
    `Total: ${priceText(total)}`,
    '',
    'Gostaria de confirmar a disponibilidade e realizar a compra.',
  ].join('\n')
}

/** Mensagem do botão "Tenho interesse" (pedir informações, inclusive de produto esgotado). */
export function interestMessage(product: Pick<Product, 'name' | 'price' | 'stock'>) {
  if (product.stock <= 0) {
    return `Olá! Tenho interesse no produto ${product.name}, que está esgotado no site. Pode me avisar quando chegar?`
  }
  return `Olá! Tenho interesse no produto ${product.name}, anunciado por ${priceText(product.price)}. Gostaria de mais informações.`
}
