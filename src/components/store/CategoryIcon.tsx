import { BatteryCharging, Cable, Cpu, Headphones, Plug, Watch, type LucideIcon, type LucideProps } from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  carregadores: Plug,
  'cabos-acessorios': Cable,
  fones: Headphones,
  'power-banks': BatteryCharging,
  'outros-eletronicos': Watch,
}

/** Ícone da categoria. Categorias novas, criadas depois, recebem um ícone genérico. */
export function CategoryIcon({ category, ...props }: { category: string } & LucideProps) {
  const Icon = icons[category] ?? Cpu
  return <Icon {...props} />
}
