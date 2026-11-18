import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { AVAILABILITY, CATEGORIES } from '../../data/categories'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { ProductImage } from '../store/ProductImage'
import type { Availability, CategoryId, Product } from '../../types'

type Draft = Omit<Product, 'id'>

const empty: Draft = { name: '', category: 'carregadores', description: '', price: 0, stock: 0, availability: 'em-estoque', featured: false }

const toNumber = (v: string) => {
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

export function ProductForm({ open, product, onClose, onSave }: { open: boolean; product: Product | null; onClose: () => void; onSave: (data: Draft) => void }) {
  const [draft, setDraft] = useState<Draft>(empty)
  const [price, setPrice] = useState('')
  const [oldPrice, setOldPrice] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const base = product ? { ...product } : empty
    setDraft(base)
    setPrice(product ? String(product.price).replace('.', ',') : '')
    setOldPrice(product?.oldPrice ? String(product.oldPrice).replace('.', ',') : '')
    setErrors({})
  }, [open, product])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  function pickImage(file?: File) {
    if (!file) return
    if (file.size > 1.5 * 1024 * 1024) return setErrors((e) => ({ ...e, image: 'Use uma imagem de até 1,5 MB nesta demonstração.' }))
    const reader = new FileReader()
    reader.onload = () => { set('image', String(reader.result)); setErrors((e) => ({ ...e, image: '' })) }
    reader.readAsDataURL(file)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const p = toNumber(price)
    const op = oldPrice ? toNumber(oldPrice) : undefined
    const next: Record<string, string> = {}
    if (!draft.name.trim()) next.name = 'Informe o nome do produto.'
    if (!(p > 0)) next.price = 'Informe um preço válido.'
    if (op !== undefined && !(op > p)) next.oldPrice = 'O preço antigo deve ser maior que o atual.'
    if (draft.stock < 0 || !Number.isInteger(draft.stock)) next.stock = 'Estoque inválido.'
    setErrors(next)
    if (Object.keys(next).length) return
    onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim(), price: p, oldPrice: op })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={product ? 'Editar produto' : 'Novo produto'}
      footer={
        <div className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">Cancelar</Button>
          <Button type="submit" form="product-form" className="flex-1 sm:flex-none">{product ? 'Salvar alterações' : 'Cadastrar produto'}</Button>
        </div>
      }
    >
      <form id="product-form" onSubmit={submit} className="grid gap-5 p-5 sm:grid-cols-[200px_1fr]" noValidate>
        <div>
          <p className="mb-1.5 text-sm font-medium">Foto</p>
          <div className="flex items-end gap-3 sm:block">
          <ProductImage src={draft.image} category={draft.category} alt={draft.name || 'Produto'} className="h-28 w-28 shrink-0 rounded-2xl border border-line sm:aspect-square sm:h-auto sm:w-full" />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
          <div className="flex flex-1 gap-2 sm:mt-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}><ImagePlus className="h-4 w-4" /> {draft.image ? 'Trocar' : 'Enviar foto'}</Button>
            {draft.image && <Button size="sm" variant="outline" onClick={() => set('image', undefined)} aria-label="Remover foto"><Trash2 className="h-4 w-4" /></Button>}
          </div>
          </div>
          {errors.image && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.image}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome do produto" value={draft.name} onChange={(e) => set('name', e.target.value)} error={errors.name} wrapClassName="sm:col-span-2" placeholder="Ex.: Carregador USB-C 20W" />
          <Select label="Categoria" value={draft.category} onChange={(e) => set('category', e.target.value as CategoryId)}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Disponibilidade" value={draft.availability} onChange={(e) => set('availability', e.target.value as Availability)}>
            {Object.entries(AVAILABILITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <Input label="Preço (R$)" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} placeholder="0,00" />
          <Input label="Preço antigo (opcional)" inputMode="decimal" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} error={errors.oldPrice} hint="Aparece riscado, indicando promoção." placeholder="0,00" />
          <Input label="Estoque" type="number" inputMode="numeric" min={0} value={String(draft.stock)} onChange={(e) => set('stock', Math.floor(Number(e.target.value) || 0))} error={errors.stock} />
          <label className="flex items-center gap-3 self-end rounded-xl border border-line px-3.5 py-3 text-sm">
            <input type="checkbox" checked={!!draft.featured} onChange={(e) => set('featured', e.target.checked)} className="h-4 w-4 accent-brand-500" />
            Destacar no início do catálogo
          </label>
          <Textarea label="Descrição" value={draft.description} onChange={(e) => set('description', e.target.value)} wrapClassName="sm:col-span-2" placeholder="Principais características, compatibilidade, garantia…" />
        </div>
      </form>
    </Modal>
  )
}
