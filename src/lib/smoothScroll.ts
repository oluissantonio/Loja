/**
 * Rolagem animada até as seções da página (Início, Categorias, Produtos…).
 * Usa uma curva suave (acelera e desacelera) com duração proporcional à
 * distância. Quem ativou "reduzir movimento" no aparelho vai direto, sem animação.
 */
const HEADER_OFFSET = 64 // altura do cabeçalho fixo

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

let frame = 0

export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return false

  const start = window.scrollY
  const max = document.documentElement.scrollHeight - window.innerHeight
  const target = id === 'inicio' ? 0 : Math.min(max, Math.max(0, el.getBoundingClientRect().top + start - HEADER_OFFSET))
  const distance = target - start

  cancelAnimationFrame(frame)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(distance) < 2) {
    window.scrollTo(0, target)
    return true
  }

  const duration = Math.min(1100, Math.max(450, Math.abs(distance) * 0.45))
  const t0 = performance.now()
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / duration)
    window.scrollTo(0, start + distance * easeInOutCubic(p))
    if (p < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)

  // Interrompe a animação se a pessoa tocar ou rolar a tela no meio do caminho.
  const stop = () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('wheel', stop)
    window.removeEventListener('touchstart', stop)
  }
  window.addEventListener('wheel', stop, { passive: true, once: true })
  window.addEventListener('touchstart', stop, { passive: true, once: true })
  setTimeout(stop, duration + 50)
  return true
}

/** Faz todos os links "#secao" da loja usarem a rolagem animada. */
export function enableSmoothAnchors() {
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const link = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
    const id = link?.getAttribute('href')?.slice(1)
    if (!id || !document.getElementById(id)) return
    e.preventDefault()
    // Espera o menu do celular fechar antes de calcular a posição final.
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(id)))
    history.replaceState(null, '', `#${id}`)
  }
  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}
