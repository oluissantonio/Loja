import { LayoutGrid } from 'lucide-react'
import { cn } from '../../lib/format'
import { CategoryIcon } from './CategoryIcon'
import type { Category, CategoryId } from '../../types'

export function CategoryFilter({ categories, value, onChange, counts }: { categories: Category[]; value: CategoryId | 'todos'; onChange: (v: CategoryId | 'todos') => void; counts: Record<string, number> }) {
  const chip = (active: boolean) =>
    cn(
      'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition',
      active ? 'border-navy-900 bg-navy-900 text-white' : 'border-line bg-white text-ink hover:border-brand-200 hover:bg-brand-50',
    )
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Categorias">
      <button role="tab" aria-selected={value === 'todos'} className={chip(value === 'todos')} onClick={() => onChange('todos')}>
        <LayoutGrid className="h-4 w-4" /> Todos <span className="opacity-60">{total}</span>
      </button>
      {categories.map((c) => (
        <button key={c.id} role="tab" aria-selected={value === c.id} className={chip(value === c.id)} onClick={() => onChange(c.id)}>
          <CategoryIcon category={c.id} className="h-4 w-4" /> {c.short} <span className="opacity-60">{counts[c.id] ?? 0}</span>
        </button>
      ))}
    </div>
  )
}
