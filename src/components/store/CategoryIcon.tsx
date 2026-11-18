import { Cable, Headphones, Plug, BatteryCharging, Watch, type LucideProps } from 'lucide-react'
import type { CategoryId } from '../../types'

const icons = { carregadores: Plug, cabos: Cable, fones: Headphones, 'power-banks': BatteryCharging, acessorios: Watch }

export function CategoryIcon({ category, ...props }: { category: CategoryId } & LucideProps) {
  const Icon = icons[category] ?? Plug
  return <Icon {...props} />
}
