/** Converte "1.234,56", "59,40" ou "59.40" em número. Devolve NaN se inválido. */
export function parseMoney(raw: string): number {
  let s = raw.trim().replace(/\s|R\$/g, '')
  if (!s) return NaN
  if (s.startsWith('-')) return -1
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN
  return Number(s)
}

export const formatMoneyInput = (n: number | null | undefined) => (n == null ? '' : n.toFixed(2).replace('.', ','))

/** Inteiro >= 0. Devolve NaN se inválido e -1 se negativo. */
export function parseQuantity(raw: string): number {
  const s = raw.trim()
  if (/^-\d+$/.test(s)) return -1
  if (!/^\d+$/.test(s)) return NaN
  return Number(s)
}

export const MAX_PRICE = 999999.99
export const MAX_STOCK = 1000000
