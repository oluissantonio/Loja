import type { ReactNode } from 'react'
import { cn } from '../../lib/format'

export type BadgeTone = 'green' | 'amber' | 'blue' | 'gray' | 'navy' | 'red'

const tones: Record<BadgeTone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  blue: 'bg-brand-50 text-brand-700 ring-brand-600/15',
  gray: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  navy: 'bg-navy-900 text-white ring-navy-900',
  red: 'bg-red-50 text-red-700 ring-red-600/15',
}

export function Badge({ tone = 'blue', dot, children, className }: { tone?: BadgeTone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
