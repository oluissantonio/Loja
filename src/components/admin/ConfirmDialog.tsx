import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

export function ConfirmDialog({ open, title, text, confirmLabel = 'Confirmar', busy, tone = 'danger', onConfirm, onClose, children }: {
  open: boolean
  title: string
  text: ReactNode
  confirmLabel?: string
  busy?: boolean
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}) {
  return (
    <Modal open={open} onClose={() => !busy && onClose()} size="sm" title={title}>
      <div className="p-5">
        <div className="text-sm text-ink-muted">{text}</div>
        {children}
        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button variant={tone} className="flex-1" onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
