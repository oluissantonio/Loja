import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

type Tone = 'success' | 'info' | 'error'
interface Toast { id: number; message: string; tone: Tone }

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const next = useRef(0)

  const notify = useCallback((message: string, tone: Tone = 'success') => {
    const id = ++next.current
    setToasts((t) => [...t.slice(-2), { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 6000 : 3200)
  }, [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 pb-safe" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`flex max-w-md animate-fade-up items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lift ${t.tone === 'error' ? 'bg-red-700' : 'bg-navy-900'}`} role={t.tone === 'error' ? 'alert' : undefined}>
            {t.tone === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-400" /> : t.tone === 'error' ? <AlertCircle className="h-4 w-4 shrink-0 text-red-200" /> : <Info className="h-4 w-4 shrink-0 text-brand-400" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
