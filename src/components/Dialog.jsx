import Button from '../components/Button'

export default function Dialog({ isOpen, title, message, confirmText = '確認', cancelText = '取消', onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        {title && <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>}
        {message && <p className="text-gray-600 mb-6">{message}</p>}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="normal" onClick={onCancel}>{cancelText}</Button>
          <Button variant="primary" size="normal" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  )
}