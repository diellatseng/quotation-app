// src/components/WizardShell.jsx
import Button from './Button'

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

      {/* ── Sticky step indicator ── */}
      <nav
        aria-label="報價單建立步驟"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          padding: 'var(--space-3) var(--space-6)',
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
          maxWidth: 902,
          padding: 0,
        }}>
          {STEPS.map((step, idx) => {
            const isDone    = step.num < currentStep
            const isCurrent = step.num === currentStep
            return (
              <li key={step.num} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {idx > 0 && (
                  <div style={{
                    width: 28, height: 2,
                    background: isDone
                      ? 'var(--color-accent)'
                      : 'var(--color-border)',
                    borderRadius: 1,
                    flexShrink: 0,
                    transition: 'background 300ms ease',
                  }} />
                )}
                <button
                  type="button"
                  onClick={() => onStepClick && onStepClick(step.num)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    background: 'none', border: 'none', cursor: isDone || isCurrent ? 'pointer' : 'default',
                    padding: '4px 6px', borderRadius: 'var(--radius-md)',
                    transition: 'background var(--transition)',
                  }}
                  aria-label={`前往第${step.num}步：${step.label}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {/* Circle */}
                  <div style={{
                    width: 28, height: 28,
                    borderRadius: 'var(--radius-full)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                    transition: 'all 300ms ease',
                    background: isDone
                      ? 'var(--color-accent)'
                      : isCurrent
                        ? 'var(--color-text)'
                        : 'var(--color-bg-subtle)',
                    color: isDone || isCurrent ? '#fff' : 'var(--color-text-muted)',
                    boxShadow: isCurrent ? '0 0 0 3px var(--color-accent-subtle)' : 'none',
                  }}>
                    {isDone ? '✓' : step.num}
                  </div>
                  {/* Label */}
                  <span style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: isCurrent ? 700 : 400,
                    color: isCurrent
                      ? 'var(--color-text)'
                      : isDone
                        ? 'var(--color-accent)'
                        : 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                    transition: 'color 300ms ease',
                  }}>
                    {step.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      {/* ── Scrollable content ── */}
      <main style={{
        flex: 1,
        padding: 'var(--space-8) var(--space-6) var(--space-8)',
        maxWidth: 902,
        width: '100%',
        margin: '0 auto',
        // Extra bottom padding so content isn't hidden behind sticky footer
        paddingBottom: 'calc(var(--space-8) + 72px)',
      }}>
        {children}
      </main>

      {/* ── Sticky floating footer toolbar ── */}
      <footer style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 100,
        // Frosted glass
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--color-border)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        padding: 'var(--space-3) var(--space-6)',
      }}>
        <div style={{
          maxWidth: 902,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}>
          {/* Left: back actions */}
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {onBackToDashboard && (
              <Button
                variant="normal"
                size="normal"
                onClick={onBackToDashboard}
                disabled={saving}
                aria-label="返回清單頁"
              >
                ← 返回清單
              </Button>
            )}
            {!isFirst && (
              <Button
                variant="normal"
                size="normal"
                onClick={onBack}
                aria-label="上一步"
              >
                ← {backLabel || '上一步'}
              </Button>
            )}
          </div>

          {/* Right: save + next */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            {onSaveDraft && (
              <Button
                variant="ghost"
                size="normal"
                onClick={onSaveDraft}
                disabled={saving}
                aria-label="儲存草稿"
              >
                {saving ? '儲存中…' : '儲存草稿'}
              </Button>
            )}
            {(!isLast || nextLabel) && (
              <Button
                variant="accent"
                size="normal"
                onClick={onNext}
                disabled={isLast ? saving : !canNext}
                aria-label="下一步"
              >
                {nextLabel || '下一步'} →
              </Button>
            )}
          </div>
        </div>
      </footer>

    </div>
  )
}
