import { cn } from '../../lib/format'

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill={light ? '#fff' : '#0A1A3A'} />
        <path d="M20 16v32M44 16v32M20 32h24" stroke={light ? '#0A1A3A' : '#fff'} strokeWidth="7" strokeLinecap="round" />
        <circle cx="44" cy="16" r="5" fill="#2F6BFF" />
      </svg>
      <span className={cn('font-display text-lg font-bold tracking-[0.12em]', light ? 'text-white' : 'text-navy-900')}>HILLUTECH</span>
    </span>
  )
}
