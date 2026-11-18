const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const formatPrice = (value: number) => brl.format(value)

export const discountPercent = (price: number, oldPrice?: number) =>
  oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0

export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ')

export const uid = () => Math.random().toString(36).slice(2, 10)
