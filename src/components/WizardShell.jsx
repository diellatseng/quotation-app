// src/components/WizardShell.jsx
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AppBreadcrumbBar } from '@/components/AppShellHeader'
import WizardStepNav from '@/components/WizardStepNav'
import { Button } from '@/components/ui/button'

const DEFAULT_STEPS = [
  { num: 1, label: '客戶資料' },
  { num: 2, label: '工程資料' },
  { num: 3, label: '服務內容' },
  { num: 4, label: '報價與付款' },
]

export default function WizardShell({
  steps = DEFAULT_STEPS,
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
  navBackLabel = '案件列表',
  headerSubtitle = '新增報價',
  children,
}) {
  const isFirst = currentStep === 1
  const isLast = currentStep === steps.length
  const currentStepMeta = steps[currentStep - 1]
  const wizardLabel = headerSubtitle === '編輯草稿' ? '編輯報價' : headerSubtitle

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppBreadcrumbBar
        maxWidth="max-w-5xl"
        backLabel={navBackLabel}
        onBack={onBackToDashboard}
        backDisabled={saving}
        segments={[wizardLabel, currentStepMeta?.label].filter(Boolean)}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6">
        <WizardStepNav
          steps={steps}
          currentStep={currentStep}
          onStepClick={onStepClick}
        />
        {children}
      </main>

      <footer className="sticky bottom-0 z-40 mt-auto border-t border-border bg-card/95 py-4 px-6 shadow-[0_-1px_0_0_var(--border)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            {!isFirst && (
              <Button
                variant="outline"
                size="md"
                className="font-semibold"
                onClick={onBack}
                aria-label="上一步"
              >
                <ArrowLeft data-icon="inline-start" />
                {backLabel || '上一步'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onSaveDraft && (
              <Button
                variant="outline"
                size="md"
                className="font-semibold"
                onClick={onSaveDraft}
                disabled={saving}
                aria-label="儲存草稿"
              >
                {saving ? '儲存中…' : '儲存草稿'}
              </Button>
            )}
            {(!isLast || nextLabel) && (
              <Button
                variant="default"
                size="md"
                className="font-semibold"
                onClick={onNext}
                disabled={isLast ? saving : !canNext}
                aria-label="下一步"
              >
                {nextLabel || '下一步'}
                <ArrowRight data-icon="inline-end" />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
