import { Minus, Plus } from 'lucide-react'
import { cn } from '../../lib/format'

export function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md' }: { value: number; onChange: (v: number) => void; min?: number; max?: number; size?: 'sm' | 'md' }) {
  const btn = cn('grid place-items-center text-ink-muted transition hover:text-brand-600 disabled:opacity-30', size === 'sm' ? 'h-8 w-8' : 'h-11 w-11')
  return (
    <div className="inline-flex items-center rounded-xl border border-line bg-white">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Diminuir quantidade">
        <Minus className="h-4 w-4" />
      </button>
      <span className={cn('min-w-[2ch] text-center font-semibold tabular-nums', size === 'sm' ? 'text-sm' : 'text-base')}>{value}</span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Aumentar quantidade">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
