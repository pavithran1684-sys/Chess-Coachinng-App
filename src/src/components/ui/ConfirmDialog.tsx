import { Button } from './Button'
import { Modal } from './Modal'

export function ConfirmDialog({ title, description, confirmLabel = 'Delete', onConfirm, onClose, loading = false }: {
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
}) {
  return (
    <Modal title={title} description={description} onClose={onClose}>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
