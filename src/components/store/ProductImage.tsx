import type { ReactElement } from 'react'
import { ImageIcon } from 'lucide-react'
import { cn } from '../../lib/format'
import type { CategoryId } from '../../types'

/** Ilustrações simples por categoria, usadas enquanto o produto não tem foto. */
const art: Record<string, ReactElement> = {
  carregadores: (
    <g>
      <rect x="62" y="58" width="76" height="92" rx="16" fill="#fff" stroke="#0A1A3A" strokeWidth="5" />
      <path d="M86 58V36M114 58V36" stroke="#0A1A3A" strokeWidth="7" strokeLinecap="round" />
      <rect x="88" y="118" width="24" height="10" rx="4" fill="#2F6BFF" />
      <circle cx="100" cy="88" r="6" fill="#B9D0FF" />
    </g>
  ),
  'cabos-acessorios': (
    <g fill="none" stroke="#0A1A3A" strokeWidth="5" strokeLinecap="round">
      <path d="M60 60c0 40 80 20 80 60s-40 30-40 30" />
      <rect x="48" y="36" width="24" height="28" rx="6" fill="#fff" />
      <rect x="88" y="146" width="24" height="26" rx="6" fill="#fff" />
      <path d="M54 36v-8M66 36v-8" stroke="#2F6BFF" />
      <path d="M100 172v8" stroke="#2F6BFF" />
    </g>
  ),
  fones: (
    <g fill="none" stroke="#0A1A3A" strokeWidth="6" strokeLinecap="round">
      <path d="M50 116V100a50 50 0 0 1 100 0v16" />
      <rect x="40" y="108" width="28" height="48" rx="12" fill="#fff" />
      <rect x="132" y="108" width="28" height="48" rx="12" fill="#fff" />
      <path d="M50 124v16M150 124v16" stroke="#2F6BFF" />
    </g>
  ),
  'power-banks': (
    <g>
      <rect x="66" y="40" width="68" height="120" rx="16" fill="#fff" stroke="#0A1A3A" strokeWidth="5" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="88" y={112 - i * 16} width="24" height="10" rx="3" fill={i < 3 ? '#2F6BFF' : '#DCE8FF'} />
      ))}
      <rect x="90" y="140" width="20" height="6" rx="3" fill="#0A1A3A" />
    </g>
  ),
  'outros-eletronicos': (
    <g fill="none" stroke="#0A1A3A" strokeWidth="5">
      <rect x="62" y="56" width="76" height="88" rx="22" fill="#fff" />
      <path d="M80 56l6-20h28l6 20M80 144l6 20h28l6-20" strokeLinejoin="round" />
      <circle cx="100" cy="100" r="18" stroke="#2F6BFF" />
      <path d="M100 90v10l7 5" stroke="#2F6BFF" strokeLinecap="round" />
    </g>
  ),
}

export function ProductImage({ src, category, alt, className, showHint }: { src?: string; category: CategoryId; alt: string; className?: string; showHint?: boolean }) {
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-brand-50 to-brand-100/70', className)}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <>
          <svg viewBox="0 0 200 200" className="mx-auto h-full w-full max-w-[220px] p-[12%]" role="img" aria-label={`Ilustração: ${alt}`}>
            {art[category] ?? art['outros-eletronicos']}
          </svg>
          {showHint && (
            <span className="absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-ink-muted backdrop-blur">
              <ImageIcon className="h-3 w-3" /> Espaço para foto
            </span>
          )}
        </>
      )}
    </div>
  )
}
