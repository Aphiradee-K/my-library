import { useEffect } from 'react'
import Icon from './Icon'

export default function ConfirmDialog({ book, onCancel, onConfirm }) {
  useEffect(() => {
    if (!book) return undefined

    const onKey = (event) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [book, onCancel])

  if (!book) return null

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div className="modal modal-sm" role="alertdialog" aria-modal="true">
        <div className="modal-body">
          <div className="confirm-icon">
            <Icon name="trash" size={22} />
          </div>
          <h2 className="confirm-title">ลบหนังสือเล่มนี้?</h2>
          <p className="confirm-text">
            “{book.title}” จะถูกนำออกจากชั้นหนังสือของคุณอย่างถาวร
          </p>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            <Icon name="trash" size={15} /> ลบหนังสือ
          </button>
        </div>
      </div>
    </div>
  )
}
