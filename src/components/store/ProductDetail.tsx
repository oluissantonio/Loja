import { useEffect, useState } from 'react'
import { Heart, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'
import { categoryName } from '../../data/categories'
import { Button } from '../ui/Button'
import { DemoTag } from '../ui/DemoTag'
import { Modal } from '../ui/Modal'
import { QuantityStepper } from '../ui/QuantityStepper'
import { AvailabilityBadge, canBuy } from './AvailabilityBadge'
import { Price } from './Price'
import { ProductImage } from './ProductImage'
import { useProductActions } from './useProductActions'
import type { Product } from '../../types'

export function ProductDetail({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [qty, setQty] = useState(1)
  const actions = useProductActions()
  useEffect(() => setQty(1), [product?.id])

  if (!product) return null
  const available = canBuy(product.availability)
  const max = Math.max(1, product.stock)

  return (
    <Modal open onClose={onClose} size="lg">
      <div className="grid gap-0 sm:grid-cols-2">
        <ProductImage src={product.image} category={product.category} alt={product.name} showHint className="aspect-[4/3] sm:aspect-auto sm:h-full sm:min-h-[380px]" />
        <div className="flex flex-col p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{categoryName(product.category)}</p>
            {product.demo && <DemoTag />}
          </div>
          <h2 className="mt-1.5 text-xl font-semibold leading-tight sm:text-2xl">{product.name}</h2>
          <div className="mt-3"><AvailabilityBadge value={product.availability} /></div>
          <div className="mt-4"><Price price={product.price} oldPrice={product.oldPrice} size="lg" /></div>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">{product.description}</p>

          <ul className="mt-5 space-y-2 text-sm text-ink-muted">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-500" /> Garantia de 90 dias</li>
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-brand-500" /> Entrega combinada após o pedido</li>
          </ul>

          <div className="mt-auto space-y-3 pt-6">
            {available && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quantidade</span>
                <QuantityStepper value={qty} onChange={setQty} max={max} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" onClick={() => actions.interest(product)}>
                <Heart className="h-4 w-4" /> Tenho interesse
              </Button>
              <Button size="lg" disabled={!available} onClick={() => { actions.buyNow(product, qty); onClose() }}>
                <ShoppingBag className="h-4 w-4" /> {available ? 'Comprar' : 'Indisponível'}
              </Button>
            </div>
            {available && (
              <Button variant="ghost" block onClick={() => { actions.addToCart(product, qty); onClose() }}>
                Adicionar ao carrinho e continuar comprando
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
