import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

export function ConfirmDialog({ open, title, text, confirmLabel = 'Confirmar', onConfirm, onClose }: { open: boolean; title: string; text: string; confirmLabel?: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title={title}>
      <div className="p-5">
        <p className="text-sm text-ink-muted">{text}</p>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}
