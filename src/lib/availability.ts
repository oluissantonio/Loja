import type { Availability } from '../types'

/**
 * ESTOQUE BAIXO: produtos com esta quantidade ou menos (e mais que zero)
 * contam como "estoque baixo" no painel e aparecem como "Últimas unidades"
 * na loja. Para mudar a regra, altere só este número.
 */
export const LOW_STOCK_LIMIT = 2

export const isLowStock = (stock: number) => stock > 0 && stock <= LOW_STOCK_LIMIT

/** Disponibilidade calculada a partir do estoque real do banco. */
export function availabilityFromStock(stock: number): Availability {
  if (stock <= 0) return 'esgotado'
  if (stock === 1) return 'ultima-unidade'
  if (stock <= LOW_STOCK_LIMIT) return 'ultimas-unidades'
  return 'em-estoque'
}

export const canBuy = (a: Availability) => a !== 'esgotado' && a !== 'sob-encomenda'
