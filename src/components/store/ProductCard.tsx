import { Heart, ShoppingBag } from 'lucide-react'
import { categoryName } from '../../data/categories'
import { useCatalog } from '../../context/CatalogContext'
import { discountPercent } from '../../lib/format'
import { Button } from '../ui/Button'
import { DemoTag } from '../ui/DemoTag'
import { AvailabilityBadge, canBuy } from './AvailabilityBadge'
import { Price } from './Price'
import { ProductImage } from './ProductImage'
import { useProductActions } from './useProductActions'
import type { Product } from '../../types'

export function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const actions = useProductActions()
  const { categories } = useCatalog()
  const available = canBuy(product.availability)
  const off = discountPercent(product.price, product.oldPrice)

  return (
    <article className="group flex animate-fade-up flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
      <button type="button" onClick={() => onOpen(product)} className="relative block text-left" aria-label={`Ver detalhes de ${product.name}`}>
        <ProductImage src={product.image} category={product.category} alt={product.name} showHint className="aspect-square" />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {off > 0 && <span className="rounded-md bg-navy-900 px-1.5 py-0.5 text-[11px] font-bold text-white">-{off}%</span>}
        </div>
        {product.demo && <DemoTag className="absolute right-2.5 top-2.5" />}
      </button>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">{categoryName(product.category, categories)}</p>
        <button type="button" onClick={() => onOpen(product)} className="mt-1 text-left">
          <h3 className="line-clamp-2 font-sans text-sm font-semibold leading-snug text-ink sm:text-[15px]">{product.name}</h3>
        </button>
        <p className="mt-1 line-clamp-2 hidden text-xs leading-relaxed text-ink-muted sm:block">{product.description}</p>

        <div className="mt-2">
          <AvailabilityBadge value={product.availability} />
        </div>

        <div className="mt-auto pt-3">
          <Price price={product.price} oldPrice={product.oldPrice} showPercent={false} />
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" className="h-10 px-0 w-10 sm:w-auto sm:px-3" onClick={() => actions.interest(product)} aria-label="Tenho interesse">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Interesse</span>
            </Button>
            <Button size="sm" className="h-10 flex-1" disabled={!available} onClick={() => actions.buyNow(product)}>
              <ShoppingBag className="h-4 w-4" />
              {available ? 'Comprar' : 'Indisponível'}
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
