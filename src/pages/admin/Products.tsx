import { useMemo, useState } from 'react'
import { AlertTriangle, Boxes, CheckCircle2, MoreVertical, Package, PackageX, Pencil, Plus, RotateCcw, Search, Star, Trash2 } from 'lucide-react'
import { CATEGORIES, categoryName } from '../../data/categories'
import { useProducts } from '../../context/ProductsContext'
import { useToast } from '../../context/ToastContext'
import { formatPrice } from '../../lib/format'
import { AvailabilityBadge } from '../../components/store/AvailabilityBadge'
import { ProductImage } from '../../components/store/ProductImage'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { ProductForm } from '../../components/admin/ProductForm'
import { StatCard } from '../../components/admin/StatCard'
import { Button } from '../../components/ui/Button'
import { DemoTag } from '../../components/ui/DemoTag'
import { EmptyState } from '../../components/ui/EmptyState'
import type { CategoryId, Product } from '../../types'

export default function Products() {
  const { products, addProduct, updateProduct, removeProduct, resetDemo } = useProducts()
  const notify = useToast()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'todos'>('todos')
  const [editing, setEditing] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [menuFor, setMenuFor] = useState<string | null>(null)

  const stats = useMemo(() => ({
    total: products.length,
    available: products.filter((p) => p.availability === 'em-estoque' || p.availability === 'ultimas-unidades').length,
    low: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
    out: products.filter((p) => p.availability === 'esgotado' || p.stock === 0).length,
  }), [products])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => (category === 'todos' || p.category === category) && (!q || p.name.toLowerCase().includes(q)))
  }, [products, query, category])

  const openNew = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (p: Product) => { setEditing(p); setFormOpen(true); setMenuFor(null) }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Produtos</h1>
          <p className="text-sm text-ink-muted">Cadastre, edite e controle o estoque da loja.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConfirmReset(true)} className="hidden sm:inline-flex"><RotateCcw className="h-4 w-4" /> Restaurar exemplos</Button>
          <Button onClick={openNew} className="hidden sm:inline-flex"><Plus className="h-4 w-4" /> Novo produto</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Boxes className="h-5 w-5" />} label="Produtos cadastrados" value={stats.total} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Disponíveis para venda" value={stats.available} tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Estoque baixo (≤ 5)" value={stats.low} tone="bg-amber-50 text-amber-600" />
        <StatCard icon={<PackageX className="h-5 w-5" />} label="Sem estoque" value={stats.out} tone="bg-slate-100 text-slate-500" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Buscar</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar pelo nome…" className="h-11 w-full rounded-xl border border-line pl-10 pr-3 text-[15px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15" />
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value as CategoryId | 'todos')} className="h-11 rounded-xl border border-line bg-white px-3 text-sm font-medium focus:border-brand-500 focus:outline-none" aria-label="Filtrar por categoria">
            <option value="todos">Todas as categorias</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {visible.length === 0 ? (
          <EmptyState icon={<Package className="h-6 w-6" />} title="Nenhum produto aqui" text="Ajuste a busca ou cadastre um novo produto." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Novo produto</Button>} />
        ) : (
          <>
            {/* Tabela (computador) */}
            <table className="hidden w-full text-sm md:table">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3 text-right">Preço</th>
                  <th className="px-4 py-3 text-right">Estoque</th>
                  <th className="px-4 py-3">Disponibilidade</th>
                  <th className="px-4 py-3 text-right"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage src={p.image} category={p.category} alt={p.name} className="h-12 w-12 shrink-0 rounded-xl" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-medium">{p.featured && <Star className="h-3.5 w-3.5 fill-brand-500 text-brand-500" aria-label="Destaque" />}<span className="truncate">{p.name}</span></p>
                          {p.demo && <DemoTag className="mt-1" />}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{categoryName(p.category)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatPrice(p.price)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${p.stock <= 5 ? 'font-semibold text-amber-700' : ''}`}>{p.stock}</td>
                    <td className="px-4 py-3"><AvailabilityBadge value={p.availability} /></td>
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
                <li key={p.id} className="relative flex gap-3 p-3">
                  <button onClick={() => openEdit(p)} className="flex min-w-0 flex-1 gap-3 text-left">
                    <ProductImage src={p.image} category={p.category} alt={p.name} className="h-16 w-16 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">{categoryName(p.category)} · Estoque: <span className={p.stock <= 5 ? 'font-semibold text-amber-700' : ''}>{p.stock}</span></p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">{formatPrice(p.price)}</span>
                        <AvailabilityBadge value={p.availability} />
                        {p.demo && <DemoTag />}
                      </div>
                    </div>
                  </button>
                  <button onClick={() => setMenuFor(menuFor === p.id ? null : p.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-muted hover:bg-brand-50" aria-label={`Ações de ${p.name}`}>
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {menuFor === p.id && (
                    <div className="absolute right-3 top-12 z-10 w-44 animate-fade-up overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lift">
                      <button className="flex h-11 w-full items-center gap-2 px-3 text-sm hover:bg-brand-50" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /> Editar</button>
                      <button className="flex h-11 w-full items-center gap-2 px-3 text-sm text-red-600 hover:bg-red-50" onClick={() => { setDeleting(p); setMenuFor(null) }}><Trash2 className="h-4 w-4" /> Excluir</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <button onClick={() => setConfirmReset(true)} className="mx-auto mt-6 flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-navy-900 sm:hidden">
        <RotateCcw className="h-4 w-4" /> Restaurar produtos de exemplo
      </button>

      {/* Botão flutuante (celular) */}
      <button onClick={openNew} className="fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 text-white shadow-lift transition hover:bg-brand-600 sm:hidden" aria-label="Novo produto">
        <Plus className="h-6 w-6" />
      </button>

      <ProductForm
        open={formOpen}
        product={editing}
        onClose={() => setFormOpen(false)}
        onSave={(data) => {
          if (editing) { updateProduct(editing.id, data); notify('Produto atualizado') }
          else { addProduct(data); notify('Produto cadastrado') }
          setFormOpen(false)
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Excluir produto?"
        text={`"${deleting?.name}" será removido do catálogo. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { removeProduct(deleting.id); notify('Produto excluído') } setDeleting(null) }}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Restaurar exemplos?"
        text="Todos os produtos voltam para a lista de demonstração original. As alterações feitas neste navegador serão perdidas."
        confirmLabel="Restaurar"
        onClose={() => setConfirmReset(false)}
        onConfirm={() => { resetDemo(); setConfirmReset(false); notify('Produtos de exemplo restaurados') }}
      />
    </div>
  )
}
