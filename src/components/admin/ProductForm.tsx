import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, Loader2, RefreshCw, Trash2, Undo2 } from 'lucide-react'
import {
  createProduct, removeProductImage, setProductImage, updateProduct,
  type AdminCategory, type AdminProduct, type ProductInput, type ProductStatus,
} from '../../lib/adminApi'
import { friendlyError } from '../../lib/errors'
import { IMAGE_ACCEPT, validateImageFile } from '../../lib/images'
import { MAX_PRICE, MAX_STOCK, formatMoneyInput, parseMoney, parseQuantity } from '../../lib/parse'
import { cn } from '../../lib/format'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { ProductImage } from '../store/ProductImage'

interface Props {
  open: boolean
  product: AdminProduct | null
  categories: AdminCategory[]
  onClose: () => void
  /** Chamado após salvar. `warning` avisa se o produto salvou mas a foto falhou. */
  onSaved: (product: AdminProduct, created: boolean, warning?: string) => void
}

type Errors = Partial<Record<'name' | 'description' | 'price' | 'oldPrice' | 'stock' | 'categoryId' | 'image' | 'form', string>>

export function ProductForm({ open, product, categories, onClose, onSaved }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [oldPrice, setOldPrice] = useState('')
  const [stock, setStock] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<ProductStatus>('ativo')
  const [featured, setFeatured] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setName(product?.name ?? '')
    setDescription(product?.description ?? '')
    setPrice(product ? formatMoneyInput(product.price) : '')
    setOldPrice(formatMoneyInput(product?.oldPrice))
    setStock(product ? String(product.stock) : '')
    setCategoryId(product?.categoryId ?? '')
    setStatus(product?.status ?? 'ativo')
    setFeatured(product?.featured ?? false)
    setFile(null)
    setRemoveImage(false)
    setErrors({})
    setSaving(false)
  }, [open, product])

  // Prévia local da foto escolhida (antes de salvar).
  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const clear = (k: keyof Errors) => setErrors((e) => (e[k] || e.form ? { ...e, [k]: undefined, form: undefined } : e))

  function pick(f?: File) {
    if (fileRef.current) fileRef.current.value = ''
    if (!f) return
    try {
      validateImageFile(f)
      setFile(f)
      setRemoveImage(false)
      setErrors((e) => ({ ...e, image: undefined }))
    } catch (err) {
      setErrors((e) => ({ ...e, image: (err as Error).message }))
    }
  }

  function validate(): { input?: ProductInput; errors: Errors } {
    const e: Errors = {}
    const p = parseMoney(price)
    const op = oldPrice.trim() ? parseMoney(oldPrice) : null
    const q = parseQuantity(stock)

    if (!name.trim()) e.name = 'Informe o nome do produto.'
    else if (name.trim().length > 120) e.name = 'O nome pode ter no máximo 120 caracteres.'
    if (description.length > 2000) e.description = 'A descrição pode ter no máximo 2000 caracteres.'

    if (!price.trim()) e.price = 'Informe o preço de venda.'
    else if (p < 0) e.price = 'O preço não pode ser negativo.'
    else if (Number.isNaN(p)) e.price = 'Preço inválido. Use apenas números, por exemplo 59,90.'
    else if (p === 0) e.price = 'O preço precisa ser maior que zero.'
    else if (p > MAX_PRICE) e.price = 'Preço acima do permitido.'

    if (op !== null) {
      if (Number.isNaN(op) || op < 0) e.oldPrice = 'Preço antigo inválido.'
      else if (!e.price && op <= p) e.oldPrice = 'O preço antigo deve ser maior que o preço de venda.'
      else if (op > MAX_PRICE) e.oldPrice = 'Preço acima do permitido.'
    }

    if (!stock.trim()) e.stock = 'Informe a quantidade em estoque (use 0 se não houver).'
    else if (q === -1) e.stock = 'A quantidade não pode ser negativa.'
    else if (Number.isNaN(q)) e.stock = 'Use um número inteiro, sem vírgula. Ex.: 10'
    else if (q > MAX_STOCK) e.stock = 'Quantidade acima do permitido.'

    if (!categoryId) e.categoryId = 'Escolha uma categoria.'

    if (Object.keys(e).length) return { errors: e }
    return {
      errors: e,
      input: { name, description, price: p, oldPrice: op, stock: q, categoryId, status, featured },
    }
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    const { input, errors: errs } = validate()
    setErrors(errs)
    if (!input) {
      // Leva o usuário até o primeiro campo com erro (útil no celular).
      requestAnimationFrame(() => document.querySelector<HTMLElement>('#product-form [aria-invalid="true"]')?.focus())
      return
    }
    setSaving(true)
    let saved: AdminProduct
    const created = !product
    try {
      saved = product ? await updateProduct(product.id, input) : await createProduct(input)
    } catch (e) {
      setSaving(false)
      setErrors({ form: friendlyError(e, 'Não foi possível salvar o produto.') })
      return
    }

    let warning: string | undefined
    try {
      if (file) saved = await setProductImage(saved, file)
      else if (removeImage && saved.imagePath) saved = await removeProductImage(saved)
    } catch (e) {
      warning = `Produto salvo, mas a foto não foi atualizada: ${friendlyError(e, 'erro no envio da foto.')}`
    }
    setSaving(false)
    onSaved(saved, created, warning)
  }

  const currentImage = removeImage ? undefined : preview ?? product?.imageUrl
  const category = categories.find((c) => c.id === categoryId)
  const close = () => !saving && onClose()

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={product ? 'Editar produto' : 'Novo produto'}
      footer={
        <div className="space-y-3">
          {errors.form && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700" role="alert">{errors.form}</p>}
          <div className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={close} disabled={saving} className="flex-1 sm:flex-none">Cancelar</Button>
            <Button type="submit" form="product-form" disabled={saving} className="flex-1 sm:flex-none">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : product ? 'Salvar alterações' : 'Cadastrar produto'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="product-form" onSubmit={submit} className="grid gap-5 p-5 sm:grid-cols-[200px_1fr]" noValidate>
        <div>
          <p className="mb-1.5 text-sm font-medium">Foto</p>
          <div className="flex items-end gap-3 sm:block">
            <div className="relative shrink-0">
              <ProductImage src={currentImage} category={category?.slug ?? ''} alt={name || 'Produto'} className="h-28 w-28 rounded-2xl border border-line sm:aspect-square sm:h-auto sm:w-full" />
              {preview && <span className="absolute left-2 top-2 rounded-md bg-navy-900 px-1.5 py-0.5 text-[10px] font-bold text-white">PRÉVIA</span>}
            </div>
            <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} data-testid="image-input" />
            <div className="flex flex-1 flex-col gap-2 sm:mt-2">
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={saving}>
                {currentImage ? <><RefreshCw className="h-4 w-4" /> Trocar foto</> : <><ImagePlus className="h-4 w-4" /> Escolher foto</>}
              </Button>
              {file && (
                <Button size="sm" variant="ghost" onClick={() => setFile(null)} disabled={saving}><Undo2 className="h-4 w-4" /> Desfazer troca</Button>
              )}
              {!file && product?.imagePath && !removeImage && (
                <Button size="sm" variant="ghost" className="text-red-600 hover:!bg-red-50" onClick={() => setRemoveImage(true)} disabled={saving}><Trash2 className="h-4 w-4" /> Remover foto</Button>
              )}
              {removeImage && (
                <Button size="sm" variant="ghost" onClick={() => setRemoveImage(false)} disabled={saving}><Undo2 className="h-4 w-4" /> Manter foto</Button>
              )}
            </div>
          </div>
          {errors.image ? (
            <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{errors.image}</p>
          ) : (
            <p className="mt-1.5 text-xs text-ink-muted">
              {removeImage ? 'A foto será removida ao salvar.' : 'JPG, PNG, WebP ou AVIF, até 20 MB. A foto é reduzida automaticamente.'}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome do produto *" value={name} onChange={(e) => { setName(e.target.value); clear('name') }} error={errors.name} wrapClassName="sm:col-span-2" placeholder="Ex.: Carregador USB-C 20W" maxLength={120} />
          <Select label="Categoria *" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); clear('categoryId') }} error={errors.categoryId} aria-invalid={!!errors.categoryId}>
            <option value="" disabled>Escolha…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.isActive ? '' : ' (oculta)'}</option>)}
          </Select>
          <div>
            <p className="mb-1.5 text-sm font-medium">Status *</p>
            <div className="grid h-11 grid-cols-2 gap-1 rounded-xl border border-line bg-slate-50 p-1" role="radiogroup" aria-label="Status">
              {(['ativo', 'inativo'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => setStatus(s)}
                  className={cn('rounded-lg text-sm font-semibold capitalize transition', status === s ? (s === 'ativo' ? 'bg-white text-emerald-700 shadow-sm' : 'bg-white text-slate-700 shadow-sm') : 'text-ink-muted')}
                >
                  {s === 'ativo' ? 'Ativo' : 'Inativo'}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-muted">{status === 'ativo' ? 'Aparece na loja.' : 'Fica escondido da loja.'}</p>
          </div>
          <Input label="Preço de venda (R$) *" inputMode="decimal" value={price} onChange={(e) => { setPrice(e.target.value); clear('price') }} error={errors.price} placeholder="0,00" />
          <Input label="Preço antigo (opcional)" inputMode="decimal" value={oldPrice} onChange={(e) => { setOldPrice(e.target.value); clear('oldPrice') }} error={errors.oldPrice} hint="Aparece riscado, indicando promoção." placeholder="0,00" />
          <Input
            label="Estoque (unidades) *"
            inputMode="numeric"
            value={stock}
            onChange={(e) => { setStock(e.target.value); clear('stock') }}
            error={errors.stock}
            placeholder="0"
            hint={product ? 'Para registrar vendas ou entradas, use "Estoque" na lista.' : '0 = esgotado.'}
          />
          <label className="flex items-center gap-3 self-start rounded-xl border border-line px-3.5 py-3 text-sm sm:mt-7">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-brand-500" />
            Destacar no início do catálogo
          </label>
          <Textarea label="Descrição" value={description} onChange={(e) => { setDescription(e.target.value); clear('description') }} error={errors.description} wrapClassName="sm:col-span-2" placeholder="Principais características, compatibilidade, garantia…" maxLength={2000} />
        </div>
      </form>
    </Modal>
  )
}
