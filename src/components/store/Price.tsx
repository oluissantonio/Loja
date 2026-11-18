import { cn, discountPercent, formatPrice } from '../../lib/format'

export function Price({ price, oldPrice, size = 'md', showPercent = true }: { price: number; oldPrice?: number; size?: 'md' | 'lg'; showPercent?: boolean }) {
  const off = discountPercent(price, oldPrice)
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={cn('font-display font-bold text-navy-900 tabular-nums', size === 'lg' ? 'text-3xl' : 'text-lg')}>{formatPrice(price)}</span>
      {off > 0 && (
        <>
          <span className="text-xs text-ink-faint line-through tabular-nums">{formatPrice(oldPrice!)}</span>
          {showPercent && <span className="text-xs font-semibold text-emerald-600">-{off}%</span>}
        </>
      )}
    </div>
  )
}
