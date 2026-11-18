import type { ReactNode } from 'react'

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">{icon}</div>
      <p className="font-display text-base font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-ink-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
