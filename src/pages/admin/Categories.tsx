import { useMemo, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useAdminData } from '../../context/AdminDataContext'
import { useToast } from '../../context/ToastContext'
import { countProductsInCategory, createCategory, deleteCategory, moveProducts, updateCategory, type AdminCategory } from '../../lib/adminApi'
import { friendlyError } from '../../lib/errors'
import { CategoryIcon } from '../../components/store/CategoryIcon'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { StatusSwitch } from '../../components/admin/StatusSwitch'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input, Select } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'

export default function Categories() {
  const { status, categories, products, reload } = useAdminData()
  const notify = useToast()
  const [newName, setNewName] = useState('')
  const [newError, setNewError] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<AdminCategory | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState('')
  const [deleting, setDeleting] = useState<{ cat: AdminCategory; count: number } | null>(null)
  const [moveTo, setMoveTo] = useState('')

  const counts = useMemo(() => products.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.categoryId]: (acc[p.categoryId] ?? 0) + 1 }), {}), [products])

  const nameTaken = (name: string, except?: string) =>
    categories.some((c) => c.id !== except && c.name.trim().toLowerCase() === name.trim().toLowerCase())

  async function add(e: FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    setNewError('')
    if (!name) return setNewError('Digite o nome da categoria.')
    if (name.length > 60) return setNewError('Use no máximo 60 caracteres.')
    if (nameTaken(name)) return setNewError('Já existe uma categoria com esse nome.')
    setAdding(true)
    try {
      await createCategory(name, Math.max(0, ...categories.map((c) => c.sortOrder)) + 1)
      setNewName('')
      notify(`Categoria "${name}" criada`)
      await reload()
    } catch (err) {
      setNewError(friendlyError(err, 'Não foi possível criar a categoria.'))
    } finally {
      setAdding(false)
    }
  }

  async function run(id: string, fn: () => Promise<void>, ok: string) {
    setBusy(id)
    try {
      await fn()
      notify(ok)
      await reload()
    } catch (err) {
      notify(friendlyError(err, 'Não foi possível salvar.'), 'error')
    } finally {
      setBusy(null)
    }
  }

  async function move(c: AdminCategory, dir: -1 | 1) {
    const i = categories.findIndex((x) => x.id === c.id)
    const other = categories[i + dir]
    if (!other) return
    // Troca as posições (normaliza a ordem para evitar empates).
    const order = categories.map((x, k) => ({ id: x.id, sortOrder: k + 1 }))
    order[i].sortOrder = i + 1 + dir
    order[i + dir].sortOrder = i + 1
    await run(c.id, async () => {
      for (const o of order) {
        const cur = categories.find((x) => x.id === o.id)!
        if (cur.sortOrder !== o.sortOrder) await updateCategory(o.id, { sortOrder: o.sortOrder })
      }
    }, 'Ordem atualizada')
  }

  async function saveRename(e: FormEvent) {
    e.preventDefault()
    if (!renaming) return
    const name = renameValue.trim()
    if (!name) return setRenameError('Digite o nome da categoria.')
    if (name.length > 60) return setRenameError('Use no máximo 60 caracteres.')
    if (nameTaken(name, renaming.id)) return setRenameError('Já existe uma categoria com esse nome.')
    const cat = renaming
    setRenaming(null)
    await run(cat.id, () => updateCategory(cat.id, { name }), 'Categoria renomeada')
  }

  async function askDelete(cat: AdminCategory) {
    setBusy(cat.id)
    try {
      const count = await countProductsInCategory(cat.id)
      setMoveTo(categories.find((c) => c.id !== cat.id)?.id ?? '')
      setDeleting({ cat, count })
    } catch (err) {
      notify(friendlyError(err, 'Não foi possível verificar a categoria.'), 'error')
    } finally {
      setBusy(null)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    const { cat, count } = deleting
    setBusy(cat.id)
    try {
      if (count > 0) {
        if (!moveTo) throw new Error('Escolha para qual categoria mover os produtos.')
        await moveProducts(cat.id, moveTo)
      }
      await deleteCategory(cat.id)
      notify(count > 0 ? `Produtos movidos e categoria "${cat.name}" excluída` : `Categoria "${cat.name}" excluída`)
      setDeleting(null)
      await reload()
    } catch (err) {
      notify(friendlyError(err, 'Não foi possível excluir a categoria.'), 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-bold text-navy-900">Categorias</h1>
      <p className="text-sm text-ink-muted">Organize os produtos da loja. Categorias ocultas e seus produtos não aparecem no site.</p>

      <form onSubmit={add} className="mt-6 flex items-start gap-2 rounded-2xl border border-line bg-white p-3" noValidate>
        <Input label="Nova categoria" value={newName} onChange={(e) => setNewName(e.target.value)} error={newError} placeholder="Ex.: Caixas de som" wrapClassName="flex-1" maxLength={60} />
        <Button type="submit" className="mt-[26px]" disabled={adding}>{adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar</Button>
      </form>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {status === 'loading' ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted"><Loader2 className="h-5 w-5 animate-spin" /> Carregando…</div>
        ) : categories.length === 0 ? (
          <EmptyState icon={<Tags className="h-6 w-6" />} title="Nenhuma categoria" text="Crie a primeira categoria acima." />
        ) : (
          <ul className="divide-y divide-line">
            {categories.map((c, i) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap" data-testid="category-row">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><CategoryIcon category={c.slug} className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="text-xs text-ink-muted">{counts[c.id] ?? 0} {(counts[c.id] ?? 0) === 1 ? 'produto' : 'produtos'}</p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-1 sm:w-auto">
                  <StatusSwitch active={c.isActive} busy={busy === c.id} onChange={(v) => run(c.id, () => updateCategory(c.id, { isActive: v }), v ? `"${c.name}" visível na loja` : `"${c.name}" oculta da loja`)} label={`Mostrar categoria ${c.name} na loja`} />
                  <div className="flex items-center gap-0.5">
                    <Button size="icon" variant="ghost" disabled={i === 0 || !!busy} onClick={() => move(c, -1)} aria-label={`Subir ${c.name}`}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" disabled={i === categories.length - 1 || !!busy} onClick={() => move(c, 1)} aria-label={`Descer ${c.name}`}><ArrowDown className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" disabled={!!busy} onClick={() => { setRenaming(c); setRenameValue(c.name); setRenameError('') }} aria-label={`Renomear ${c.name}`}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" disabled={!!busy} className="hover:!bg-red-50 hover:text-red-600" onClick={() => askDelete(c)} aria-label={`Excluir ${c.name}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={!!renaming} onClose={() => setRenaming(null)} size="sm" title="Renomear categoria">
        <form onSubmit={saveRename} className="space-y-5 p-5" noValidate>
          <Input label="Nome" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} error={renameError} maxLength={60} autoFocus />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setRenaming(null)}>Cancelar</Button>
            <Button type="submit" className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        busy={!!deleting && busy === deleting.cat.id}
        title="Excluir categoria?"
        confirmLabel={deleting?.count ? 'Mover e excluir' : 'Excluir'}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        text={
          deleting?.count ? (
            <>A categoria "<strong className="text-ink">{deleting.cat.name}</strong>" tem <strong className="text-ink">{deleting.count} {deleting.count === 1 ? 'produto' : 'produtos'}</strong>. Para não deixar produtos sem categoria, eles serão movidos antes da exclusão.</>
          ) : (
            <>A categoria "<strong className="text-ink">{deleting?.cat.name}</strong>" não tem produtos e será excluída.</>
          )
        }
      >
        {!!deleting?.count && (
          <Select label="Mover os produtos para" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} wrapClassName="mt-4">
            {categories.filter((c) => c.id !== deleting.cat.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
        {!!deleting?.count && categories.length < 2 && <p className="mt-2 text-xs text-red-600">Crie outra categoria antes de excluir esta.</p>}
      </ConfirmDialog>
    </div>
  )
}
