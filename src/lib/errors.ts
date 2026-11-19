/** Traduz erros do Supabase/rede em mensagens compreensíveis. */
export function friendlyError(e: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  const err = e as { message?: string; code?: string; status?: number; statusCode?: string } | null
  const msg = err?.message ?? ''
  const code = err?.code ?? ''

  if (/fetch failed|Failed to fetch|NetworkError|Load failed/i.test(msg)) return 'Sem conexão com o servidor. Verifique a internet e tente novamente.'
  if (code === '42501' || /row-level security|permission denied|not authorized|Unauthorized/i.test(msg)) {
    return 'Você não tem permissão para fazer isso. Entre novamente com uma conta de administrador.'
  }
  if (/JWT expired|invalid JWT|session/i.test(msg)) return 'Sua sessão expirou. Entre novamente.'
  if (code === '23503' && /categor/i.test(msg)) return 'Esta categoria ainda tem produtos. Mova ou exclua os produtos antes.'
  if (code === '23505' && /slug/i.test(msg)) return 'Já existe uma categoria com esse nome.'
  if (code === '23514' || code === '22023' || code === 'P0002') return msg || fallback
  if (/Payload too large|exceeded the maximum allowed size|maximum allowed size/i.test(msg)) return 'A foto é grande demais (máximo 5 MB).'
  if (/mime type|invalid_mime_type/i.test(msg)) return 'Formato de foto não aceito. Use JPG, PNG, WebP ou AVIF.'
  if (e instanceof Error && e.name === 'ImageError') return msg
  return msg ? `${fallback} (${msg})` : fallback
}
