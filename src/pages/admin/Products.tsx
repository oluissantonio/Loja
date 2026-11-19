import { useMemo, useState } from 'react'
import { AlertTriangle, Boxes, CheckCircle2, Layers, Loader2, MoreVertical, Package, PackageX, Pencil, Plus, RefreshCw, Search, Star, Trash2 } from 'lucide-react'
import { useAdminData } from '../../context/AdminDataContext'
import { useToast } from '../../context/ToastContext'
import { deleteProduct, updateProduct, type AdminProduct } from '../../lib/adminApi'
import { LOW_STOCK_LIMIT, availabilityFromStock, isLowStock } from '../../lib/availability'
import { friendlyError } from '../../lib/errors'
import { cn, formatPrice } from '../../lib/format'
import { AvailabilityBadge } from '../../components/store/AvailabilityBadge'
import { ProductImage } from '../../components/store/ProductImage'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { ProductForm } from '../../components/admin/ProductForm'
import { StatCard } from '../../components/admin/StatCard'
import { StatusSwitch } from '../../components/admin/StatusSwitch'
import { StockDialog } from '../../components/admin/StockDialog'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'

type Filter = 'todos' | 'ativos' | 'inativos' | 'disponiveis' | 'baixo' | 'esgotados'
type Sort = 'recentes' | 'nome' | 'preco-asc' | 'preco-desc' | 'estoque-asc' | 'estoque-desc'

const FILTERS: Record<Filter, string> = {
  todos: 'Todas as situações',
  ativos: 'Ativos',
  inativos: 'Inativos',
  disponiveis: 'Com estoque',
  baixo: `Estoque baixo (≤ ${LOW_STOCK_LIMIT})`,
  esgotados: 'Esgotados',
}

const control = 'h-11 rounded-xl border border-line bg-white px-3 text-sm font-medium focus:border-brand-500 focus:outline-none'

export default function Products() {
  const { status, error, products, categories, reload, upsertLocal, removeLocal } = useAdminData()
  const notify = useToast()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('todas')
  const [filter, setFilter] = useState<Filter>('todos')
  const [sort, setSort] = useState<Sort>('recentes')
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [stockFor, setStockFor] = useState<AdminProduct | null>(null)
  const [deleting, setDeleting] = useState<AdminProduct | null>(null)
  const [busyDelete, setBusyDelete] = useState(false)
  const [busyToggle, setBusyToggle] = useState<string | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—'
  const catSlug = (id: string) => categories.find((c) => c.id === id)?.slug ?? ''

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.status === 'ativo').length,
    out: products.filter((p) => p.stock === 0).length,
    units: products.reduce((n, p) => n + p.stock, 0),
    low: products.filter((p) => isLowStock(p.stock)).length,
  }), [products])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = products.filter((p) => {
      if (category !== 'todas' && p.categoryId !== category) return false
      if (q && !p.name.toLowerCase().includes(q)) return false
      switch (filter) {
        case 'ativos': return p.status === 'ativo'
        case 'inativos': return p.status === 'inativo'
        case 'disponiveis': return p.stock > 0
        case 'baixo': return isLowStock(p.stock)
        case 'esgotados': return p.stock === 0
        default: return true
      }
    })
    const by: Record<Sort, (a: AdminProduct, b: AdminProduct) => number> = {
      recentes: (a, b) => b.createdAt.localeCompare(a.createdAt),
      nome: (a, b) => a.name.localeCompare(b.name, 'pt-BR'),
      'preco-asc': (a, b) => a.price - b.price,
      'preco-desc': (a, b) => b.price - a.price,
      'estoque-asc': (a, b) => a.stock - b.stock,
      'estoque-desc': (a, b) => b.stock - a.stock,
    }
    return [...list].sort(by[sort])
  }, [products, query, category, filter, sort])

  const openNew = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (p: AdminProduct) => { setEditing(p); setFormOpen(true); setMenuFor(null) }
  const showFilter = (f: Filter) => { setFilter(f); setCategory('todas'); setQuery('') }

  async function toggle(p: AdminProduct, active: boolean) {
    setBusyToggle(p.id)
    try {
      upsertLocal(await updateProduct(p.id, { status: active ? 'ativo' : 'inativo' }))
      notify(active ? `"${p.name}" está visível na loja` : `"${p.name}" foi escondido da loja`)
    } catch (e) {
      notify(friendlyError(e, 'Não foi possível alterar o status.'), 'error')
    } finally {
      setBusyToggle(null)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusyDelete(true)
    try {
      await deleteProduct(deleting)
      removeLocal(deleting.id)
      notify('Produto excluído')
      setDeleting(null)
    } catch (e) {
      notify(friendlyError(e, 'Não foi possível excluir.'), 'error')
    } finally {
      setBusyDelete(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Produtos</h1>
          <p className="text-sm text-ink-muted">Cadastre, edite e controle o estoque da loja.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => reload()} aria-label="Atualizar lista" className="h-11 w-11"><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={openNew} className="hidden sm:inline-flex" disabled={!categories.length}><Plus className="h-4 w-4" /> Novo produto</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <button className="text-left" onClick={() => showFilter('todos')}><StatCard icon={<Boxes className="h-5 w-5" />} label="Produtos cadastrados" value={status === 'ready' ? stats.total : '–'} /></button>
        <button className="text-left" onClick={() => showFilter('ativos')}><StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Ativos na loja" value={status === 'ready' ? stats.active : '–'} tone="bg-emerald-50 text-emerald-600" /></button>
        <button className="text-left" onClick={() => showFilter('esgotados')}><StatCard icon={<PackageX className="h-5 w-5" />} label="Esgotados" value={status === 'ready' ? stats.out : '–'} tone="bg-slate-100 text-slate-500" /></button>
        <button className="text-left" onClick={() => showFilter('baixo')}><StatCard icon={<AlertTriangle className="h-5 w-5" />} label={`Estoque baixo (≤ ${LOW_STOCK_LIMIT})`} value={status === 'ready' ? stats.low : '–'} tone="bg-amber-50 text-amber-600" /></button>
        <div className="col-span-2 lg:col-span-1"><StatCard icon={<Layers className="h-5 w-5" />} label="Unidades em estoque" value={status === 'ready' ? stats.units.toLocaleString('pt-BR') : '–'} tone="bg-brand-50 text-brand-600" /></div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="grid gap-2 border-b border-line p-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Buscar</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar pelo nome…" className="h-11 w-full rounded-xl border border-line pl-10 pr-3 text-[15px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15" />
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={control} aria-label="Filtrar por categoria">
            <option value="todas">Todas as categorias</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className={control} aria-label="Filtrar por situação">
            {Object.entries(FILTERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={cn(control, 'sm:col-span-2 lg:col-span-1')} aria-label="Ordenar">
            <option value="recentes">Mais recentes</option>
            <option value="nome">Nome (A–Z)</option>
            <option value="preco-asc">Menor preço</option>
            <option value="preco-desc">Maior preço</option>
            <option value="estoque-asc">Menor estoque</option>
            <option value="estoque-desc">Maior estoque</option>
          </select>
        </div>

        {status === 'loading' ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted"><Loader2 className="h-5 w-5 animate-spin" /> Carregando produtos…</div>
        ) : status === 'error' ? (
          <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Não foi possível carregar" text={error ?? undefined} action={<Button variant="outline" onClick={() => reload()}><RefreshCw className="h-4 w-4" /> Tentar de novo</Button>} />
        ) : products.length === 0 ? (
          <EmptyState icon={<Package className="h-6 w-6" />} title="Nenhum produto cadastrado" text="Cadastre o primeiro produto da HILLUTEC." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Novo produto</Button>} />
        ) : visible.length === 0 ? (
          <EmptyState icon={<Search className="h-6 w-6" />} title="Nenhum produto encontrado" text="Ajuste a busca ou os filtros." action={<Button variant="outline" onClick={() => showFilter('todos')}>Limpar filtros</Button>} />
        ) : (
          <>
            <p className="border-b border-line px-4 py-2 text-xs text-ink-muted">{visible.length} de {products.length} produtos</p>
            {/* Tabela (computador) */}
            <table className="hidden w-full text-sm md:table">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 text-right">Preço</th>
                  <th className="px-4 py-3 text-center">Estoque</th>
                  <th className="px-4 py-3">Na loja</th>
                  <th className="px-4 py-3 text-right"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((p) => (
                  <tr key={p.id} className={cn('hover:bg-slate-50/60', p.status === 'inativo' && 'bg-slate-50/50')} data-testid="product-row">
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-3 text-left" onClick={() => openEdit(p)}>
                        <ProductImage src={p.imageUrl} category={catSlug(p.categoryId)} alt={p.name} className={cn('h-12 w-12 shrink-0 rounded-xl', p.status === 'inativo' && 'opacity-50')} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-medium">{p.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-brand-500 text-brand-500" aria-label="Destaque" />}<span className="line-clamp-1">{p.name}</span></span>
                          <span className="text-xs text-ink-muted">{catName(p.categoryId)}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setStockFor(p)} className="inline-flex flex-col items-center gap-1 rounded-xl px-2 py-1 hover:bg-brand-50" aria-label={`Ajustar estoque de ${p.name}`}>
                        <span className={cn('text-base font-bold tabular-nums', p.stock === 0 ? 'text-slate-500' : isLowStock(p.stock) ? 'text-amber-700' : 'text-navy-900')}>{p.stock}</span>
                        <AvailabilityBadge value={availabilityFromStock(p.stock)} />
                      </button>
                    </td>
                    <td className="px-4 py-3"><StatusSwitch active={p.status === 'ativo'} busy={busyToggle === p.id} onChange={(v) => toggle(p, v)} label={`Mostrar ${p.name} na loja`} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)} aria-label={`Editar ${p.name}`}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="hover:!bg-red-50 hover:text-red-600" onClick={() => setDeleting(p)} aria-label={`Excluir ${p.name}`}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Lista (celular) */}
            <ul className="divide-y divide-line md:hidden">
              {visible.map((p) => (
                <li key={p.id} className={cn('relative p-3', p.status === 'inativo' && 'bg-slate-50/70')} data-testid="product-row">
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(p)} className="flex min-w-0 flex-1 gap-3 text-left">
                      <ProductImage src={p.imageUrl} category={catSlug(p.categoryId)} alt={p.name} className={cn('h-16 w-16 shrink-0 rounded-xl', p.status === 'inativo' && 'opacity-50')} />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-snug">{p.featured && <Star className="mr-1 inline h-3.5 w-3.5 -translate-y-px fill-brand-500 text-brand-500" />}{p.name}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">{catName(p.categoryId)}</p>
                        <p className="mt-1 text-sm font-semibold tabular-nums">{formatPrice(p.price)}</p>
                      </div>
                    </button>
                    <button onClick={() => setMenuFor(menuFor === p.id ? null : p.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-muted hover:bg-brand-50" aria-label={`Ações de ${p.name}`}>
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button onClick={() => setStockFor(p)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm" aria-label={`Ajustar estoque de ${p.name}`}>
                      <span className="text-ink-muted">Estoque</span>
                      <span className={cn('font-bold tabular-nums', p.stock === 0 ? 'text-slate-500' : isLowStock(p.stock) ? 'text-amber-700' : 'text-navy-900')}>{p.stock}</span>
                      <AvailabilityBadge value={availabilityFromStock(p.stock)} className="hidden min-[380px]:inline-flex" />
                    </button>
                    <StatusSwitch active={p.status === 'ativo'} busy={busyToggle === p.id} onChange={(v) => toggle(p, v)} label={`Mostrar ${p.name} na loja`} />
                  </div>
                  {menuFor === p.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                      <div className="absolute right-3 top-12 z-20 w-44 animate-fade-up overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lift">
                        <button className="flex h-11 w-full items-center gap-2 px-3 text-sm hover:bg-brand-50" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /> Editar</button>
                        <button className="flex h-11 w-full items-center gap-2 px-3 text-sm hover:bg-brand-50" onClick={() => { setStockFor(p); setMenuFor(null) }}><Boxes className="h-4 w-4" /> Estoque</button>
                        <button className="flex h-11 w-full items-center gap-2 px-3 text-sm text-red-600 hover:bg-red-50" onClick={() => { setDeleting(p); setMenuFor(null) }}><Trash2 className="h-4 w-4" /> Excluir</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Botão flutuante (celular) */}
      <button onClick={openNew} disabled={!categories.length} className="fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 text-white shadow-lift transition hover:bg-brand-600 disabled:opacity-50 sm:hidden" aria-label="Novo produto">
        <Plus className="h-6 w-6" />
      </button>

      <ProductForm
        open={formOpen}
        product={editing}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSaved={(p, created, warning) => {
          upsertLocal(p)
          setFormOpen(false)
          if (warning) notify(warning, 'error')
          else notify(created ? `Produto cadastrado${p.status === 'ativo' ? ' e publicado na loja' : ' (inativo, não aparece na loja)'}` : 'Alterações salvas')
        }}
      />
      <StockDialog
        product={stockFor}
        onClose={() => setStockFor(null)}
        onDone={(stock, msg) => {
          if (stockFor) upsertLocal({ ...stockFor, stock })
          setStockFor(null)
          notify(msg)
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        busy={busyDelete}
        title="Excluir produto?"
        text={<>"<strong className="text-ink">{deleting?.name}</strong>" e a foto dele serão apagados definitivamente. Para apenas esconder da loja, use a chave <strong className="text-ink">Ativo/Inativo</strong>.</>}
        confirmLabel="Excluir"
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
