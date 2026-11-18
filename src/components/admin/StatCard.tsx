import type { ReactNode } from 'react'

export function StatCard({ icon, label, value, tone = 'bg-brand-50 text-brand-600' }: { icon: ReactNode; label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>{icon}</div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums text-navy-900">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  )
}
