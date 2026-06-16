import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import packageJson from '../../package.json'
import { cn } from '@/lib/utils'

export function AppBrandMark({ size = 'md', className }) {
  const sizes = {
    sm: 'h-8 w-8 text-base',
    md: 'h-10 w-10 text-lg',
    lg: 'h-12 w-12 text-xl',
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground',
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      報
    </div>
  )
}

export function AppBrandTitle({
  title = '報價管理系統',
  subtitle,
  showVersion = false,
  markSize = 'md',
  className,
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-4', className)}>
      <AppBrandMark size={markSize} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-lg font-bold tracking-tight text-foreground">{title}</h1>
          {showVersion && (
            <p className="font-mono text-xs text-muted-foreground">v{packageJson.version}</p>
          )}
        </div>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Slim sticky bar: [← 報價單列表] › segment › segment     [actions]
 * Secondary navigation (tabs, stepper) belongs in page content, not here.
 */
export function AppBreadcrumbBar({
  backTo,
  onBack,
  backLabel = '報價單列表',
  backDisabled = false,
  segments = [],
  actions,
  maxWidth = 'max-w-7xl',
  className,
}) {
  const navigate = useNavigate()
  const handleBack = onBack ?? (backTo ? () => navigate(backTo) : undefined)

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-12 items-center justify-between gap-4 px-4 md:h-14 md:px-8',
          maxWidth,
        )}
      >
        <nav aria-label="頁面路徑" className="flex min-w-0 items-center gap-1 text-sm">
          {handleBack && (
            <button
              type="button"
              onClick={handleBack}
              disabled={backDisabled}
              className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-1 py-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              aria-label={`返回${backLabel}`}
            >
              <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
              <span>{backLabel}</span>
            </button>
          )}

          {segments.map((segment, index) => (
            <Fragment key={index}>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden="true" />
              <span
                className={cn(
                  'flex min-w-0 items-center gap-2 truncate',
                  index === segments.length - 1
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {segment}
              </span>
            </Fragment>
          ))}
        </nav>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}

/** @deprecated Use AppBreadcrumbBar back link instead. */
export function AppBackButton({ to, onClick, label = '返回', disabled, className }) {
  const navigate = useNavigate()
  const handleClick = onClick ?? (to ? () => navigate(to) : undefined)

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !handleClick}
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md px-1 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-40',
        className,
      )}
    >
      <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </button>
  )
}

export function AppShellHeader({
  children,
  className,
  sticky = true,
  blur = false,
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 border-b border-border bg-card px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between md:px-8',
        sticky && 'sticky top-0 z-10',
        blur && 'bg-card/80 backdrop-blur-md',
        className,
      )}
    >
      {children}
    </header>
  )
}
