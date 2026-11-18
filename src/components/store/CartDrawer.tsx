import { MessageCircle, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import { formatPrice } from '../../lib/format'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Modal } from '../ui/Modal'
import { QuantityStepper } from '../ui/QuantityStepper'
import { ProductImage } from './ProductImage'

export function CartDrawer() {
  const cart = useCart()
  const notify = useToast()

  return (
    <Modal
      open={cart.isOpen}
      onClose={cart.close}
      variant="drawer"
      title={<span className="flex items-center gap-2">Seu carrinho {cart.count > 0 && <span className="text-sm font-normal text-ink-muted">({cart.count} {cart.count === 1 ? 'item' : 'itens'})</span>}</span>}
      footer={
        cart.lines.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-muted">Subtotal</span>
              <span className="font-display text-xl font-bold tabular-nums">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="text-xs text-ink-muted">Frete e forma de pagamento são combinados ao finalizar o pedido.</p>
            <Button
              size="lg"
              block
              onClick={() => notify('Demonstração: o envio do pedido pelo WhatsApp entra na próxima etapa', 'info')}
            >
              <MessageCircle className="h-5 w-5" /> Finalizar pedido
            </Button>
            <Button variant="ghost" block onClick={cart.close}>Continuar comprando</Button>
          </div>
        )
      }
    >
      {cart.lines.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Seu carrinho está vazio"
          text="Escolha um produto no catálogo e toque em Comprar."
          action={<Button variant="outline" onClick={cart.close}>Ver produtos</Button>}
        />
      ) : (
        <ul className="divide-y divide-line">
          {cart.lines.map(({ product, quantity }) => (
            <li key={product.id} className="flex gap-3 px-5 py-4">
              <ProductImage src={product.image} category={product.category} alt={product.name} className="h-20 w-20 shrink-0 rounded-xl" />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
                  <button onClick={() => cart.remove(product.id)} className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-red-50 hover:text-red-600" aria-label={`Remover ${product.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-end justify-between pt-2">
                  <QuantityStepper size="sm" value={quantity} onChange={(q) => cart.setQuantity(product.id, q)} max={Math.max(1, product.stock)} />
                  <span className="font-semibold tabular-nums">{formatPrice(product.price * quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
