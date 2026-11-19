import { AlertCircle, DatabaseZap, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'

/** Cards "fantasma" enquanto o catálogo carrega. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Carregando produtos">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="aspect-square animate-pulse bg-brand-50" />
          <div className="space-y-2.5 p-3 sm:p-4">
            <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100" />
            <div className="h-3.5 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-24 animate-pulse rounded bg-slate-100 pt-2" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CatalogError({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={<AlertCircle className="h-6 w-6" />}
      title="Não foi possível carregar os produtos"
      text="Verifique sua conexão com a internet e tente novamente."
      action={<Button variant="outline" onClick={onRetry}><RefreshCw className="h-4 w-4" /> Tentar de novo</Button>}
    />
  )
}

export function CatalogUnconfigured() {
  return (
    <EmptyState
      icon={<DatabaseZap className="h-6 w-6" />}
      title="Catálogo ainda não conectado"
      text="Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja o README) para carregar os produtos do banco de dados."
    />
  )
}
