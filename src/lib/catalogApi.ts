import { availabilityFromStock } from './availability'
import { productImageUrl, supabase } from './supabase'
import type { Category, Product } from '../types'

interface CategoryRow {
  slug: string
  name: string
  sort_order: number
}

interface ProductRow {
  id: string
  name: string
  description: string
  price: number | string
  compare_at_price: number | string | null
  stock: number
  image_path: string | null
  featured: boolean
  category: { slug: string } | null
}

const toNumber = (v: number | string) => (typeof v === 'number' ? v : Number(v))

export function mapProduct(row: ProductRow): Product | null {
  if (!row.category) return null
  const price = toNumber(row.price)
  const old = row.compare_at_price == null ? undefined : toNumber(row.compare_at_price)
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category.slug,
    price,
    oldPrice: old && old > price ? old : undefined,
    stock: row.stock,
    availability: availabilityFromStock(row.stock),
    image: productImageUrl(row.image_path),
    featured: row.featured,
  }
}

/**
 * Lê o catálogo público. Mesmo sem os filtros abaixo, o RLS do banco só
 * devolve a visitantes os produtos ativos de categorias ativas.
 */
export async function fetchCatalog(): Promise<{ categories: Category[]; products: Product[] }> {
  if (!supabase) throw new Error('Supabase não configurado')

  const [cats, prods] = await Promise.all([
    supabase.from('categories').select('slug, name, sort_order').eq('is_active', true).order('sort_order').order('name'),
    supabase
      .from('products')
      .select('id, name, description, price, compare_at_price, stock, image_path, featured, category:categories!inner(slug, is_active)')
      // Filtros explícitos: mesmo um administrador logado vê a loja como o público.
      .eq('status', 'ativo')
      .eq('category.is_active', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  if (cats.error) throw cats.error
  if (prods.error) throw prods.error

  return {
    categories: (cats.data as CategoryRow[]).map((c) => ({ id: c.slug, name: c.name, short: c.name })),
    products: (prods.data as unknown as ProductRow[]).flatMap((r) => mapProduct(r) ?? []),
  }
}
