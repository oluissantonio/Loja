import { cn, discountPercent, formatPrice } from '../../lib/format'

export function Price({ price, oldPrice, size = 'md', showPercent = true }: { price: number; oldPrice?: number; size?: 'md' | 'lg'; showPercent?: boolean }) {
  const off = discountPercent(price, oldPrice)
  return (
    <div className={cn('flex flex-wrap items-baseline gap-y-0.5', size === 'lg' ? 'gap-x-2' : 'gap-x-1.5')}>
      <span className={cn('font-display font-bold text-navy-900 tabular-nums', size === 'lg' ? 'text-3xl' : 'text-lg')}>{formatPrice(price)}</span>
      {size === 'lg' ? (
        <span className="whitespace-nowrap text-xs font-medium text-ink-muted">cada unidade</span>
      ) : (
        // No card estreito do celular fica em duas linhas curtas, ao lado do preço.
        <span className="text-[10px] font-medium leading-[1.15] text-ink-muted">
          cada<br className="sm:hidden" /> unidade
        </span>
      )}
      {off > 0 && (
        <>
          <span className="text-xs text-ink-faint line-through tabular-nums">{formatPrice(oldPrice!)}</span>
          {showPercent && <span className="text-xs font-semibold text-emerald-600">-{off}%</span>}
        </>
      )}
    </div>
  )
}
