import type { Availability } from '../types'

/** A partir desta quantidade (inclusive) para baixo, o produto aparece como "Últimas unidades". */
export const LOW_STOCK_LIMIT = 5

/** Disponibilidade calculada a partir do estoque real do banco. */
export function availabilityFromStock(stock: number): Availability {
  if (stock <= 0) return 'esgotado'
  if (stock <= LOW_STOCK_LIMIT) return 'ultimas-unidades'
  return 'em-estoque'
}
