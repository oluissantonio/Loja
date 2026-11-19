/** Identificador (slug) da categoria, igual à coluna categories.slug do banco. */
export type CategoryId = string

export interface Category {
  id: CategoryId
  name: string
  short: string
}

export type Availability = 'em-estoque' | 'ultimas-unidades' | 'ultima-unidade' | 'sob-encomenda' | 'esgotado'

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
  /** URL pública da foto. Sem foto, a interface mostra uma ilustração da categoria. */
  image?: string
  featured?: boolean
  /** Marca o produto como dado demonstrativo (usado só no painel, por enquanto). */
  demo?: boolean
}

export interface CartItem {
  productId: string
  quantity: number
}
