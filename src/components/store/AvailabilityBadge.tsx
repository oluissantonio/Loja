import { AVAILABILITY } from '../../data/categories'
import { Badge } from '../ui/Badge'
import type { Availability } from '../../types'

export function AvailabilityBadge({ value, className }: { value: Availability; className?: string }) {
  const a = AVAILABILITY[value]
  return <Badge tone={a.tone} dot className={className}>{a.label}</Badge>
}

export const canBuy = (a: Availability) => a === 'em-estoque' || a === 'ultimas-unidades'
