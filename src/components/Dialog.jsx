export default function Dialog({ 
  isOpen, 
  title, 
  message, 
  confirmText = '確認', 
  cancelText = '取消',
  onConfirm, 
  onCancel,
  isDangerous = false,
}) {
  if (!isOpen) return null

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        {title && <h3 className="dialog-title">{title}</h3>}
        {message && <p className="dialog-message">{message}</p>}
        
        <div className="dialog-actions">
          <button 
            className="btn btn-ghost" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={isDangerous ? 'btn btn-danger' : 'btn btn-primary'} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
