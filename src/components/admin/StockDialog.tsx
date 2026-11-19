import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, History, Loader2, Minus, PackagePlus, Plus, ShoppingBag, SlidersHorizontal } from 'lucide-react'
import { adjustStock, listStockMovements, type AdminProduct, type StockMode, type StockMovement, type StockReason } from '../../lib/adminApi'
import { availabilityFromStock } from '../../lib/availability'
import { friendlyError } from '../../lib/errors'
import { MAX_STOCK, parseQuantity } from '../../lib/parse'
import { cn } from '../../lib/format'
import { AvailabilityBadge } from '../store/AvailabilityBadge'
import { Button } from '../ui/Button'
import { Input } from '../ui/Field'
import { Modal } from '../ui/Modal'

type Tab = 'entrada' | 'venda' | 'definir'

const TABS: { id: Tab; label: string; icon: typeof Plus; mode: StockMode; hint: string }[] = [
  { id: 'entrada', label: 'Entrada', icon: PackagePlus, mode: 'add', hint: 'Chegaram unidades novas: soma ao estoque.' },
  { id: 'venda', label: 'Venda', icon: ShoppingBag, mode: 'remove', hint: 'Registrar uma venda: subtrai do estoque.' },
  { id: 'definir', label: 'Definir', icon: SlidersHorizontal, mode: 'set', hint: 'Informar a quantidade exata que existe agora.' },
]

const REASON_LABEL: Record<StockReason, string> = {
  cadastro: 'Cadastro',
  entrada: 'Entrada',
  venda: 'Venda',
  ajuste: 'Ajuste',
  correcao: 'Correção',
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export function StockDialog({ product, onClose, onDone }: { product: AdminProduct | null; onClose: () => void; onDone: (stock: number, message: string) => void }) {
  const [tab, setTab] = useState<Tab>('venda')
  const [qty, setQty] = useState('1')
  const [isCorrection, setIsCorrection] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<StockMovement[] | null>(null)

  useEffect(() => {
    if (!product) return
    setTab(product.stock > 0 ? 'venda' : 'entrada')
    setQty('1')
    setNote('')
    setError('')
    setIsCorrection(false)
    setHistory(null)
    listStockMovements(product.id, 8).then(setHistory).catch(() => setHistory([]))
  }, [product])


  if (!product) return null
  const current = TABS.find((t) => t.id === tab)!
  const n = parseQuantity(qty)
  const valid = Number.isInteger(n) && n >= 0
  const next = !valid ? null : tab === 'entrada' ? product.stock + n : tab === 'venda' ? product.stock - n : n

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!product) return
    if (n === -1) return setError('A quantidade não pode ser negativa.')
    if (!valid) return setError('Use um número inteiro, sem vírgula.')
    if (tab !== 'definir' && n === 0) return setError('Informe pelo menos 1 unidade.')
    if (next !== null && next < 0) return setError(`Estoque insuficiente: há apenas ${product.stock} unidade(s).`)
    if (next !== null && next > MAX_STOCK) return setError('Quantidade acima do permitido.')
    if (tab === 'definir' && next === product.stock) return setError('A quantidade é igual ao estoque atual.')

    const reason: Exclude<StockReason, 'cadastro'> = tab === 'entrada' ? 'entrada' : tab === 'venda' ? 'venda' : isCorrection ? 'correcao' : 'ajuste'
    setSaving(true)
    setError('')
    try {
      const stock = await adjustStock(product.id, current.mode, n, reason, note.trim())
      const msg = tab === 'venda' ? `Venda registrada. Estoque: ${stock}` : tab === 'entrada' ? `Entrada registrada. Estoque: ${stock}` : `Estoque definido para ${stock}`
      onDone(stock, msg)
    } catch (err) {
      setError(friendlyError(err, 'Não foi possível atualizar o estoque.'))
    } finally {
      setSaving(false)
    }
  }

  // Troca de aba já ajusta a quantidade no mesmo clique (sem atraso).
  function changeTab(t: Tab) {
    if (t === tab) return
    setTab(t)
    setQty(t === 'definir' ? String(product!.stock) : '1')
    setError('')
  }

  const step = (d: number) => setQty(String(Math.max(0, (valid ? n : 0) + d)))

  return (
    <Modal open onClose={() => !saving && onClose()} title="Estoque" size="md">
      <form onSubmit={submit} className="space-y-5 p-5">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <div className="mt-1"><AvailabilityBadge value={availabilityFromStock(product.stock)} /></div>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold tabular-nums text-navy-900" data-testid="stock-current">{product.stock}</p>
            <p className="text-xs text-ink-muted">em estoque</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => changeTab(id)}
              className={cn('flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition', tab === id ? 'bg-white text-navy-900 shadow-sm' : 'text-ink-muted')}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <p className="-mt-2 text-xs text-ink-muted">{current.hint}</p>

        <div className="flex items-end gap-2">
          <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => step(-1)} aria-label="Menos 1"><Minus className="h-4 w-4" /></Button>
          <Input label={tab === 'definir' ? 'Quantidade exata' : 'Quantidade'} inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} wrapClassName="flex-1" className="text-center text-lg font-semibold" />
          <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => step(1)} aria-label="Mais 1"><Plus className="h-4 w-4" /></Button>
        </div>

        {tab === 'definir' && (
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={isCorrection} onChange={(e) => setIsCorrection(e.target.checked)} className="h-4 w-4 accent-brand-500" />
            É a correção de um erro de contagem
          </label>
        )}

        <Input label="Observação (opcional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder={tab === 'venda' ? 'Ex.: venda pelo WhatsApp para Maria' : 'Ex.: reposição do fornecedor'} />

        <div className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-line py-3 text-sm">
          <span className="tabular-nums text-ink-muted">{product.stock}</span>
          <ArrowRight className="h-4 w-4 text-ink-faint" />
          <span className={cn('font-display text-lg font-bold tabular-nums', next !== null && next < 0 ? 'text-red-600' : 'text-navy-900')} data-testid="stock-next">{next ?? '—'}</span>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700" role="alert">{error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : tab === 'venda' ? 'Registrar venda' : tab === 'entrada' ? 'Registrar entrada' : 'Salvar quantidade'}
          </Button>
        </div>

        <div className="border-t border-line pt-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted"><History className="h-3.5 w-3.5" /> Últimas movimentações</p>
          {history === null ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</p>
          ) : history.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Nenhuma movimentação registrada.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line text-sm">
              {history.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2">
                  <span className={cn('w-12 shrink-0 text-right font-semibold tabular-nums', m.delta > 0 ? 'text-emerald-600' : m.delta < 0 ? 'text-red-600' : 'text-ink-muted')}>
                    {m.delta > 0 ? `+${m.delta}` : m.delta}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{REASON_LABEL[m.reason]}</span>
                    {m.note && <span className="block truncate text-xs text-ink-muted">{m.note}</span>}
                  </span>
                  <span className="shrink-0 text-right text-xs text-ink-muted">
                    <span className="block tabular-nums">→ {m.stockAfter}</span>
                    {dateFmt.format(new Date(m.createdAt))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </Modal>
  )
}
