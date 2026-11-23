import { AlertCircle, ArrowLeft, MessageCircle, PackageX } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useCatalog } from '../../context/CatalogContext'
import { usePurchase } from '../../context/PurchaseContext'
import { STORE } from '../../config/store'
import { cn, formatPrice } from '../../lib/format'
import { interestMessage, purchaseMessage, whatsappLink, type OrderLine } from '../../lib/whatsapp'
import { Button, buttonClass } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { ProductImage } from './ProductImage'
import type { Product } from '../../types'

/**
 * Tela de confirmação antes de abrir o WhatsApp.
 * Usa sempre os dados ATUAIS do catálogo (preço e estoque podem mudar enquanto
 * a tela está aberta). Não altera o estoque.
 */
export function PurchaseDialog() {
  const { request, cancel } = usePurchase()
  const { getProduct } = useCatalog()
  const cart = useCart()

  if (!request) return null

  // Monta as linhas do pedido com os dados atuais.
  let lines: (OrderLine & { product: Product; requested: number })[] = []
  let missing = false
  if (request.mode === 'cart') {
    lines = cart.lines.map((l) => ({ product: l.product, quantity: Math.min(l.quantity, l.product.stock), requested: l.quantity }))
  } else {
    const product = getProduct(request.productId)
    if (!product) missing = true
    else {
      const q = request.mode === 'buy' ? request.quantity : 1
      lines = [{ product, quantity: request.mode === 'buy' ? Math.min(q, product.stock) : q, requested: q }]
    }
  }

  const interest = request.mode === 'interest'
  const soldOut = !interest && lines.some((l) => l.product.stock <= 0)
  const reduced = !interest && lines.some((l) => l.product.stock > 0 && l.quantity < l.requested)
  const buyable = interest ? lines.filter((l) => l.quantity > 0) : lines.filter((l) => l.quantity > 0)
  const canContinue = !missing && buyable.length > 0 && (interest || !soldOut || request.mode === 'cart')
  const total = buyable.reduce((n, l) => n + l.product.price * l.quantity, 0)

  const message = interest && lines[0] ? interestMessage(lines[0].product) : purchaseMessage(buyable)
  const href = whatsappLink(message)
  const single = lines.length === 1 ? lines[0] : null

  const close = () => cancel()
  const onContinue = () => {
    // O link abre o WhatsApp em outra aba/app; a tela de confirmação fecha.
    setTimeout(() => {
      cancel()
      if (request.mode === 'cart') cart.close()
    }, 150)
  }

  return (
    <Modal open onClose={close} size="md" title={interest ? 'Falar com a loja' : 'Confirmar pedido'}>
      <div className="space-y-5 p-5" data-testid="purchase-dialog">
        {missing ? (
          <div className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-ink-muted">
            <AlertCircle className="h-5 w-5 shrink-0 text-ink-faint" />
            Este produto não está mais disponível no catálogo.
          </div>
        ) : single ? (
          <div className="flex items-center gap-4">
            <ProductImage src={single.product.image} category={single.product.category} alt={single.product.name} className={cn('h-20 w-20 shrink-0 rounded-2xl', soldOut && 'opacity-60')} />
            <div className="min-w-0">
              <p className="font-display text-base font-semibold leading-snug text-navy-900" data-testid="purchase-name">{single.product.name}</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums text-navy-900" data-testid="purchase-price">{formatPrice(single.product.price)}</p>
              {!interest && single.quantity > 1 && (
                <p className="text-sm text-ink-muted">{single.quantity} unidades · total {formatPrice(single.product.price * single.quantity)}</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {lines.map((l) => (
                <li key={l.product.id} className={cn('flex items-center gap-3 p-3 text-sm', l.quantity === 0 && 'opacity-50')}>
                  <ProductImage src={l.product.image} category={l.product.category} alt={l.product.name} className="h-11 w-11 shrink-0 rounded-xl" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-medium">{l.product.name}</span>
                    <span className="text-xs text-ink-muted">{l.quantity === 0 ? 'Esgotado — não será incluído' : `${l.quantity}x ${formatPrice(l.product.price)}`}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatPrice(l.product.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-baseline justify-between px-1">
              <span className="text-sm text-ink-muted">Total</span>
              <span className="font-display text-2xl font-bold tabular-nums text-navy-900" data-testid="purchase-total">{formatPrice(total)}</span>
            </div>
          </div>
        )}

        {soldOut && request.mode !== 'cart' ? (
          <div className="flex items-center gap-3 rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-slate-700" role="status">
            <PackageX className="h-5 w-5 shrink-0" /> Produto esgotado
          </div>
        ) : (
          !missing && (
            <div className="flex gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-navy-900">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="font-medium">
                  {interest ? 'Você será direcionado ao WhatsApp para falar com a loja.' : 'Você será direcionado ao WhatsApp para finalizar seu pedido.'}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {interest ? 'A mensagem já vai pronta, é só enviar.' : 'A mensagem já vai pronta. Disponibilidade, entrega e pagamento são combinados na conversa.'} Atendimento: {STORE.whatsappDisplay}.
                </p>
              </div>
            </div>
          )
        )}

        {reduced && <p className="text-xs font-medium text-amber-700">A quantidade foi ajustada ao estoque disponível.</p>}
        {request.mode === 'cart' && soldOut && buyable.length > 0 && <p className="text-xs font-medium text-amber-700">Itens esgotados não serão incluídos no pedido.</p>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" size="lg" className="sm:flex-1" onClick={close}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          {canContinue ? (
            <a href={href} target="_blank" rel="noopener noreferrer" onClick={onContinue} className={cn(buttonClass('primary', 'lg'), 'whitespace-nowrap sm:flex-[1.6]')} data-testid="whatsapp-link">
              <MessageCircle className="h-5 w-5" /> Continuar para o WhatsApp
            </a>
          ) : (
            <Button size="lg" disabled className="sm:flex-[1.6]">
              {missing || soldOut ? 'Produto esgotado' : 'Indisponível'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
