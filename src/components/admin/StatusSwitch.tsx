import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/format'

/** Chave liga/desliga para ativar ou desativar um produto no catálogo. */
export function StatusSwitch({ active, busy, onChange, label }: { active: boolean; busy?: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      disabled={busy}
      onClick={() => onChange(!active)}
      className="group inline-flex items-center gap-2 text-xs font-semibold disabled:opacity-60"
    >
      <span className={cn('relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition', active ? 'bg-emerald-500' : 'bg-slate-300')}>
        <span className={cn('grid h-5 w-5 place-items-center rounded-full bg-white shadow transition', active ? 'translate-x-[18px]' : 'translate-x-0.5')}>
          {busy && <Loader2 className="h-3 w-3 animate-spin text-ink-muted" />}
        </span>
      </span>
      <span className={active ? 'text-emerald-700' : 'text-ink-muted'}>{active ? 'Ativo' : 'Inativo'}</span>
    </button>
  )
}
