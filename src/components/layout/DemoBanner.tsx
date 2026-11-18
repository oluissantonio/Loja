import { FlaskConical } from 'lucide-react'

export function DemoBanner() {
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
      <FlaskConical className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px" />
      Versão de demonstração: produtos, preços e estoque são <strong>exemplos</strong>.
    </div>
  )
}
