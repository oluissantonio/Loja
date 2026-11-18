/** Leitura e escrita no localStorage protegidas: o navegador pode bloquear o acesso (modo privado etc.). */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* sem armazenamento disponível: segue só em memória */
  }
}
