import { PRODUCT_IMAGES_BUCKET, productImageUrl, supabase } from './supabase'
import { prepareImage } from './images'

/**
 * Operações do painel administrativo no Supabase.
 * A segurança NÃO depende deste arquivo: o banco (RLS) recusa qualquer escrita
 * de quem não estiver na tabela "admins".
 */

export type ProductStatus = 'ativo' | 'inativo'
export type StockReason = 'cadastro' | 'entrada' | 'venda' | 'ajuste' | 'correcao'
export type StockMode = 'add' | 'remove' | 'set'

export interface AdminCategory {
  id: string
  slug: string
  name: string
  sortOrder: number
  isActive: boolean
}

export interface AdminProduct {
  id: string
  name: string
  description: string
  price: number
  oldPrice: number | null
  stock: number
  categoryId: string
  imagePath: string | null
  imageUrl?: string
  status: ProductStatus
  featured: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductInput {
  name: string
  description: string
  price: number
  oldPrice: number | null
  stock: number
  categoryId: string
  status: ProductStatus
  featured: boolean
}

export interface StockMovement {
  id: number
  delta: number
  stockAfter: number
  reason: StockReason
  note: string | null
  createdAt: string
}

function db() {
  if (!supabase) throw new Error('Supabase não configurado.')
  return supabase
}

interface ProductRow {
  id: string
  name: string
  description: string
  price: number | string
  compare_at_price: number | string | null
  stock: number
  category_id: string
  image_path: string | null
  status: ProductStatus
  featured: boolean
  created_at: string
  updated_at: string
}

const PRODUCT_COLUMNS = 'id, name, description, price, compare_at_price, stock, category_id, image_path, status, featured, created_at, updated_at'

function mapProduct(r: ProductRow): AdminProduct {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    oldPrice: r.compare_at_price == null ? null : Number(r.compare_at_price),
    stock: r.stock,
    categoryId: r.category_id,
    imagePath: r.image_path,
    imageUrl: productImageUrl(r.image_path),
    status: r.status,
    featured: r.featured,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

const toRow = (p: ProductInput) => ({
  name: p.name.trim(),
  description: p.description.trim(),
  price: p.price,
  compare_at_price: p.oldPrice,
  stock: p.stock,
  category_id: p.categoryId,
  status: p.status,
  featured: p.featured,
})

// ---------------------------------------------------------------- produtos

export async function listProducts(): Promise<AdminProduct[]> {
  const { data, error } = await db().from('products').select(PRODUCT_COLUMNS).order('created_at', { ascending: false })
  if (error) throw error
  return (data as ProductRow[]).map(mapProduct)
}

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const { data, error } = await db().from('products').insert(toRow(input)).select(PRODUCT_COLUMNS).single()
  if (error) throw error
  return mapProduct(data as ProductRow)
}

/** Atualiza os dados. Se o estoque mudar por aqui, o histórico registra como "ajuste". */
export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<AdminProduct> {
  const row: Record<string, unknown> = {}
  if (input.name !== undefined) row.name = input.name.trim()
  if (input.description !== undefined) row.description = input.description.trim()
  if (input.price !== undefined) row.price = input.price
  if (input.oldPrice !== undefined) row.compare_at_price = input.oldPrice
  if (input.stock !== undefined) row.stock = input.stock
  if (input.categoryId !== undefined) row.category_id = input.categoryId
  if (input.status !== undefined) row.status = input.status
  if (input.featured !== undefined) row.featured = input.featured

  const { data, error } = await db().from('products').update(row).eq('id', id).select(PRODUCT_COLUMNS).maybeSingle()
  if (error) throw error
  if (!data) throw Object.assign(new Error('Produto não encontrado ou sem permissão.'), { code: '42501' })
  return mapProduct(data as ProductRow)
}

export async function deleteProduct(product: AdminProduct) {
  const { data, error } = await db().from('products').delete().eq('id', product.id).select('id')
  if (error) throw error
  if (!data?.length) throw Object.assign(new Error('Produto não encontrado ou sem permissão.'), { code: '42501' })
  // Apaga as fotos da pasta do produto (não impede a exclusão se falhar).
  await removeProductFolder(product.id).catch((e) => console.warn('Fotos não removidas:', e))
}

// ---------------------------------------------------------------- estoque

export async function adjustStock(productId: string, mode: StockMode, quantity: number, reason: Exclude<StockReason, 'cadastro'>, note?: string) {
  const { data, error } = await db().rpc('adjust_stock', {
    p_product_id: productId,
    p_mode: mode,
    p_quantity: quantity,
    p_reason: reason,
    p_note: note || null,
  })
  if (error) throw error
  return data as number
}

export async function listStockMovements(productId: string, limit = 10): Promise<StockMovement[]> {
  const { data, error } = await db()
    .from('stock_movements')
    .select('id, delta, stock_after, reason, note, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data.map((m) => ({ id: m.id, delta: m.delta, stockAfter: m.stock_after, reason: m.reason, note: m.note, createdAt: m.created_at }))
}

// ---------------------------------------------------------------- fotos

/**
 * Envia a foto para product-images/<id do produto>/<data>.<ext>, grava o
 * caminho no produto e apaga a foto anterior. Um nome novo a cada envio evita
 * que navegadores mostrem a foto antiga guardada em cache.
 */
export async function setProductImage(product: Pick<AdminProduct, 'id' | 'imagePath'>, file: File): Promise<AdminProduct> {
  const { blob, ext, type } = await prepareImage(file)
  const path = `${product.id}/${Date.now()}.${ext}`
  const storage = db().storage.from(PRODUCT_IMAGES_BUCKET)

  const up = await storage.upload(path, blob, { contentType: type, cacheControl: '31536000', upsert: false })
  if (up.error) throw up.error

  const { data, error } = await db().from('products').update({ image_path: path }).eq('id', product.id).select(PRODUCT_COLUMNS).maybeSingle()
  if (error || !data) {
    await storage.remove([path])
    throw error ?? Object.assign(new Error('Produto não encontrado ou sem permissão.'), { code: '42501' })
  }
  if (product.imagePath && product.imagePath !== path && !/^https?:/i.test(product.imagePath)) {
    await storage.remove([product.imagePath]).catch(() => {})
  }
  return mapProduct(data as ProductRow)
}

export async function removeProductImage(product: Pick<AdminProduct, 'id' | 'imagePath'>): Promise<AdminProduct> {
  const { data, error } = await db().from('products').update({ image_path: null }).eq('id', product.id).select(PRODUCT_COLUMNS).maybeSingle()
  if (error) throw error
  if (!data) throw Object.assign(new Error('Produto não encontrado ou sem permissão.'), { code: '42501' })
  if (product.imagePath && !/^https?:/i.test(product.imagePath)) {
    await db().storage.from(PRODUCT_IMAGES_BUCKET).remove([product.imagePath]).catch(() => {})
  }
  return mapProduct(data as ProductRow)
}

async function removeProductFolder(productId: string) {
  const storage = db().storage.from(PRODUCT_IMAGES_BUCKET)
  const { data, error } = await storage.list(productId)
  if (error) throw error
  if (data?.length) await storage.remove(data.map((f) => `${productId}/${f.name}`))
}

// ---------------------------------------------------------------- categorias

export async function listCategories(): Promise<AdminCategory[]> {
  const { data, error } = await db().from('categories').select('id, slug, name, sort_order, is_active').order('sort_order').order('name')
  if (error) throw error
  return data.map((c) => ({ id: c.id, slug: c.slug, name: c.name, sortOrder: c.sort_order, isActive: c.is_active }))
}

export function slugify(name: string) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export async function createCategory(name: string, sortOrder: number) {
  const slug = slugify(name)
  if (!slug) throw new Error('Use letras ou números no nome da categoria.')
  const { error } = await db().from('categories').insert({ name: name.trim(), slug, sort_order: sortOrder })
  if (error) throw error
}

export async function updateCategory(id: string, data: Partial<{ name: string; isActive: boolean; sortOrder: number }>) {
  const row: Record<string, unknown> = {}
  if (data.name !== undefined) row.name = data.name.trim()
  if (data.isActive !== undefined) row.is_active = data.isActive
  if (data.sortOrder !== undefined) row.sort_order = data.sortOrder
  const { data: res, error } = await db().from('categories').update(row).eq('id', id).select('id')
  if (error) throw error
  if (!res?.length) throw Object.assign(new Error('Categoria não encontrada ou sem permissão.'), { code: '42501' })
}

export async function countProductsInCategory(id: string) {
  const { count, error } = await db().from('products').select('id', { count: 'exact', head: true }).eq('category_id', id)
  if (error) throw error
  return count ?? 0
}

/** Move todos os produtos de uma categoria para outra. */
export async function moveProducts(fromId: string, toId: string) {
  const { error } = await db().from('products').update({ category_id: toId }).eq('category_id', fromId)
  if (error) throw error
}

/** Exclui a categoria. O banco recusa (erro 23503) se ainda houver produtos nela. */
export async function deleteCategory(id: string) {
  const { data, error } = await db().from('categories').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw Object.assign(new Error('Categoria não encontrada ou sem permissão.'), { code: '42501' })
}
