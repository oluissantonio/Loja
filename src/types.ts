export type CategoryId = 'carregadores' | 'cabos' | 'fones' | 'power-banks' | 'acessorios'

export interface Category {
  id: CategoryId
  name: string
  short: string
}

export type Availability = 'em-estoque' | 'ultimas-unidades' | 'sob-encomenda' | 'esgotado'

export interface Product {
  id: string
  name: string
  category: CategoryId
  description: string
  price: number
  /** Preço antigo, exibido riscado quando há promoção. */
  oldPrice?: number
  stock: number
  availability: Availability
  /** URL ou data URL da foto. Sem foto, a interface mostra uma ilustração da categoria. */
  image?: string
  featured?: boolean
  /** Marca o produto como dado demonstrativo. */
  demo?: boolean
}

export interface CartItem {
  productId: string
  quantity: number
}
