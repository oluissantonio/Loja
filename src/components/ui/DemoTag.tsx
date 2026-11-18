import { cn } from '../../lib/format'

/** Etiqueta que identifica claramente um conteúdo demonstrativo. */
export function DemoTag({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-md border border-dashed border-amber-500/60 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800', className)}>
      Exemplo
    </span>
  )
}
