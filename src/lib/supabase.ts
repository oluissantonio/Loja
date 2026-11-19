import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente do Supabase usado no navegador.
 *
 * Usa SOMENTE a chave pública (anon / publishable). Ela pode ficar no site:
 * o que cada visitante consegue ler ou alterar é decidido pelas regras de
 * segurança (RLS) do banco. A chave secreta (service_role / secret) NUNCA
 * deve ser colocada aqui nem em nenhuma variável que comece com VITE_.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

export const supabaseConfigured = Boolean(url && key)

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'hillutec-admin-auth' } })
  : null

/** Bucket do Storage com as fotos dos produtos. Organização: <id do produto>/<arquivo>. */
export const PRODUCT_IMAGES_BUCKET = 'product-images'

/** Converte o caminho salvo em products.image_path no endereço público da foto. */
export function productImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  if (!supabase) return undefined
  return supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl
}
