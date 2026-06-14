// src/components/WizardShell.jsx
import Button from './Button'
import IconButton from './IconButton'

const STEPS = [
  { num: 1, label: '客戶資料' },
  { num: 2, label: '工程資料' },
  { num: 3, label: '服務內容' },
  { num: 4, label: '報價與付款' }
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
  const isLast = currentStep === 4

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">

      {/* ── Sticky step indicator ── */}
      <nav
        aria-label="報價單建立步驟"
        className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border"
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          {STEPS.map((step) => {
            const isActive = currentStep === step.num
            const isCompleted = currentStep > step.num
            return (
              <div
                key={step.num}
                onClick={() => onStepClick?.(step.num)}
                className={`flex items-center gap-2 cursor-pointer select-none transition-colors duration-200 ${isActive
                    ? 'text-foreground font-semibold'
                    : isCompleted
                      ? 'text-foreground hover:text-primary'
                      : 'text-muted-foreground'
                  }`}
              >
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                >
                  {step.num}
                </span>
                <span className="text-sm hidden sm:inline">{step.label}</span>
              </div>
            )
          })}
        </div>
      </nav>

      {/* ── Main content area ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* ── Sticky footer ── */}
      <footer className="sticky bottom-0 bg-card border-t border-border py-4 px-6 shadow-md mt-auto z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          {/* Left: actions */}
          <div className="flex gap-3 items-center">
            {onBackToDashboard && (
              <IconButton
                icon="arrow_back"
                label="返回清單"
                variant="normal"
                size="normal"
                onClick={onBackToDashboard}
                disabled={saving}
                aria-label="返回清單頁"
              />
            )}
            {!isFirst && (
              <IconButton
                icon="arrow_back"
                label={backLabel || '上一步'}
                variant="normal"
                size="normal"
                onClick={onBack}
                aria-label="上一步"
              />
            )}
          </div>

          {/* Right: save + next */}
          <div className="flex gap-3 items-center">
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
              <IconButton
                icon="arrow_forward"
                label={nextLabel || '下一步'}
                variant="accent"
                size="normal"
                onClick={onNext}
                disabled={isLast ? saving : !canNext}
                aria-label="下一步"
              />
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}