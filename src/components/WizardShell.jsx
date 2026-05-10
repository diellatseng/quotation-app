// src/components/WizardShell.jsx

const STEPS = [
  { num: 1, label: '客戶資料' },
  { num: 2, label: '工程資料' },
  { num: 3, label: '服務內容' },
  { num: 4, label: '報價與付款' },
  { num: 5, label: '預覽' },
]

export default function WizardShell({
  currentStep,
  onNext,
  onBack,
  onSaveDraft,
  onBackToDashboard,
  onStepClick,
  saving,
  canNext = true,
  nextLabel,
  backLabel,
  children,
}) {
  const isFirst = currentStep === 1
  const isLast  = currentStep === 5

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Step indicator */}
      <nav
        aria-label="報價單建立步驟"
        style={{
          background: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--space-4) var(--space-6)',
          overflowX: 'auto',
        }}
      >
        <ol style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          listStyle: 'none',
          minWidth: 'max-content',
          margin: '0 auto',
          maxWidth: 800,
        }}>
          {STEPS.map((step, idx) => {
            const isDone    = step.num < currentStep
            const isCurrent = step.num === currentStep
            return (
              <li key={step.num} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {idx > 0 && (
                  <div style={{
                    width: 24, height: 2,
                    background: isDone ? 'var(--color-accent)' : 'var(--color-border)',
                    borderRadius: 1,
                    flexShrink: 0,
                  }} />
                )}
                <button
                  type="button"
                  onClick={() => onStepClick && onStepClick(step.num)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 'var(--space-1)', borderRadius: 'var(--radius-md)',
                    transition: 'all var(--transition)',
                  }}
                  aria-label={`前往第${step.num}步：${step.label}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div
                    style={{
                      width: 32, height: 32,
                      borderRadius: 'var(--radius-full)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      flexShrink: 0,
                      background: isDone ? 'var(--color-accent)' : isCurrent ? 'var(--color-text)' : 'var(--color-bg-subtle)',
                      color: (isDone || isCurrent) ? '#fff' : 'var(--color-text-muted)',
                      border: isCurrent ? '2px solid var(--color-text)' : '2px solid transparent',
                      transition: 'all var(--transition)',
                    }}
                  >
                    {isDone ? '✓' : step.num}
                  </div>
                  <span style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: isCurrent ? 700 : 400,
                    color: isCurrent ? 'var(--color-text)' : isDone ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                  }}>
                    {step.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: 'var(--space-8) var(--space-6)', maxWidth: 902, width: '100%', margin: '0 auto' }}>
        {children}
      </main>

      {/* Navigation bar */}
      <footer style={{
        background: 'var(--color-bg-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-4) var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {onBackToDashboard && (
            <button
              className="btn btn-secondary"
              onClick={onBackToDashboard}
              disabled={saving}
              aria-label="返回清單頁"
            >
              {saving ? '儲存中…' : '返回清單頁'}
            </button>
          )}
          {!isFirst && (
            <button className="btn btn-secondary" onClick={onBack} aria-label="上一步">
              ← {backLabel || '上一步'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          {onSaveDraft && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onSaveDraft}
              disabled={saving}
              aria-label="儲存草稿"
            >
              {saving ? '儲存中…' : '儲存草稿'}
            </button>
          )}
          {( !isLast || nextLabel ) && (
            <button
              className="btn btn-primary"
              onClick={onNext}
              disabled={isLast ? saving : !canNext}
              aria-label="下一步"
            >
              {nextLabel || '下一步'} →
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
