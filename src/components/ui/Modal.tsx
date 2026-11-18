import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/format'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** "sheet" sobe de baixo no celular; "drawer" desliza da direita. */
  variant?: 'sheet' | 'drawer'
}

/** Base reutilizável para diálogos: fecha com Esc e com toque no fundo, e trava a rolagem da página. */
export function Modal({ open, onClose, title, children, footer, size = 'md', variant = 'sheet' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-3xl' }

  return (
    <div className={cn('fixed inset-0 z-50 flex', variant === 'drawer' ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-6')} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-[2px] animate-[fade-up_.2s_ease-out]" onClick={onClose} />
      <div
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-white shadow-lift',
          variant === 'drawer'
            ? 'h-full max-h-none max-w-md animate-slide-in'
            : cn('animate-sheet-up rounded-t-3xl sm:animate-fade-up sm:rounded-3xl', widths[size]),
        )}
      >
        {variant === 'sheet' && title && <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />}
        {!title && (
          <button onClick={onClose} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow-card backdrop-blur hover:bg-white" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        )}
        {title && (
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="-mr-2 grid h-10 w-10 place-items-center rounded-full text-ink-muted hover:bg-brand-50 hover:text-ink" aria-label="Fechar">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4 pb-safe">{footer}</div>}
      </div>
    </div>
  )
}
