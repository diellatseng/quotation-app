import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function WizardStepNav({ steps, currentStep, onStepClick }) {
  return (
    <nav aria-label="報價單建立步驟" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, idx) => {
          const stepNum = step.num ?? idx + 1
          const isActive = currentStep === stepNum
          const isCompleted = currentStep > stepNum
          const isLast = idx === steps.length - 1

          return (
            <li key={stepNum} className={cn('flex items-center', !isLast && 'flex-1')}>
              <button
                type="button"
                onClick={() => onStepClick?.(stepNum)}
                className="group flex items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-surface-hover hover:text-surface-hover-foreground"
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isActive && 'bg-primary text-primary-foreground shadow-sm',
                    isCompleted && 'bg-primary/15 text-primary',
                    !isActive && !isCompleted && 'border border-border bg-background text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="size-3.5" aria-hidden="true" /> : stepNum}
                </span>
                <span
                  className={cn(
                    'hidden text-sm sm:inline',
                    isActive ? 'font-medium text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  {step.label}
                </span>
              </button>
              {!isLast && (
                <div
                  className={cn(
                    'mx-2 h-px min-w-6 flex-1 transition-colors',
                    isCompleted ? 'bg-primary/35' : 'bg-border',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
