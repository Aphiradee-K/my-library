import Icon from './Icon'

export default function Toast({ toast }) {
  if (!toast) return null

  return (
    <div className={`toast ${toast.tone}`} role="status" aria-live="polite">
      <Icon name={toast.tone === 'error' ? 'x' : 'check'} size={16} />
      <span>{toast.message}</span>
    </div>
  )
}
