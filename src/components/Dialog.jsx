import Button from '../components/Button'

export default function Dialog({ 
  isOpen, 
  title, 
  message, 
  confirmText = '確認', 
  cancelText = '取消',
  onConfirm, 
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        {title && <h3 className="dialog-title">{title}</h3>}
        {message && <p className="dialog-message">{message}</p>}
        
        <div className="dialog-actions">

          <Button
            variant="ghost"
            size="normal"
            onClick={onCancel}
          > 
            {cancelText}
          </Button>
          <Button
            variant="primary"
            size="normal"
            onClick={onConfirm}
          > 
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
