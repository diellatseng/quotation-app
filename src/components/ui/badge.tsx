import * as React from 'react'
import { ArrowUp, Pencil, X } from 'lucide-react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2.5 py-1 text-xs font-medium leading-none whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary:
          'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        destructive:
          'bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20',
        outline:
          'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        ghost:
          'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
        draft:
          'border bg-status-draft text-status-draft-text border-status-draft-border',
        quoted:
          'border bg-status-quoted text-status-quoted-text border-status-quoted-border',
        confirmed:
          'border bg-status-confirmed text-status-confirmed-text border-status-confirmed-border',
        closed:
          'border bg-status-closed text-status-closed-text border-status-closed-border',
        warning:
          'border bg-status-warning text-status-warning-text border-status-warning-border',
        'diff-added':
          'border bg-diff-added-badge text-diff-added-text border-diff-added-border',
        'diff-modified':
          'border bg-diff-modified-badge text-diff-modified-text border-diff-modified-border',
        'diff-removed':
          'border bg-diff-removed-badge text-diff-removed-badge-text border-diff-removed-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function BadgeLabel({
  children,
  afterIcon = false,
}: {
  children: React.ReactNode
  afterIcon?: boolean
}) {
  return (
    <span
      className={cn(
        'relative inline-block leading-none',
        afterIcon ? 'top-0.5' : 'top-px'
      )}
    >
      {children}
    </span>
  )
}

function isIconElement(child: React.ReactNode) {
  return React.isValidElement(child) && typeof child.type !== 'string'
}

function wrapBadgeChildren(children: React.ReactNode): React.ReactNode {
  const items = React.Children.toArray(children)
  if (items.length <= 1) {
    return wrapBadgeLabel(children)
  }
  return items.map((child, index) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return (
        <BadgeLabel key={index} afterIcon={index > 0 && isIconElement(items[index - 1])}>
          {child}
        </BadgeLabel>
      )
    }
    return child
  })
}

function wrapBadgeLabel(child: React.ReactNode, key?: React.Key): React.ReactNode {
  if (typeof child === 'string' || typeof child === 'number') {
    return <BadgeLabel key={key}>{child}</BadgeLabel>
  }
  return child
}

function Badge({
  className,
  variant = 'default',
  render,
  children,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  const label = wrapBadgeChildren(children)

  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ variant }), className),
        children: label,
      },
      props
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  })
}

export { Badge, badgeVariants }

/** ① 案件工程狀態 → badge variant */
export const PROJECT_STATUS_TO_VARIANT = {
  未開工: 'draft',
  已開工: 'confirmed',
  暫停: 'warning',
  完工: 'closed',
} as const

export function projectStatusVariant(status: string) {
  return PROJECT_STATUS_TO_VARIANT[status as keyof typeof PROJECT_STATUS_TO_VARIANT] ?? 'draft'
}

export function projectStatusLabel(status: string) {
  return status in PROJECT_STATUS_TO_VARIANT ? status : '未開工'
}

export function ProjectStatusBadges({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <Badge variant={projectStatusVariant(status)} className={cn('rounded-full', className)}>
      {projectStatusLabel(status)}
    </Badge>
  )
}

/** ② 案件報價摘要 → badge variant */
export const QUOTATION_SUMMARY_TO_VARIANT = {
  無報價: 'outline',
  草稿: 'draft',
  已報價: 'quoted',
  已確認: 'confirmed',
} as const

export function quotationSummaryVariant(status: string) {
  return QUOTATION_SUMMARY_TO_VARIANT[status as keyof typeof QUOTATION_SUMMARY_TO_VARIANT] ?? 'outline'
}

export function quotationSummaryLabel(status: string) {
  return status in QUOTATION_SUMMARY_TO_VARIANT ? status : '無報價'
}

export function QuotationSummaryBadges({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <Badge variant={quotationSummaryVariant(status)} className={cn('rounded-full', className)}>
      {quotationSummaryLabel(status)}
    </Badge>
  )
}

/** ③ 案件請款摘要 → badge variant */
export const BILLING_SUMMARY_TO_VARIANT = {
  未設定: 'outline',
  未請款: 'draft',
  請款中: 'quoted',
  部分收款: 'warning',
  已結清: 'confirmed',
} as const

export function billingSummaryVariant(status: string) {
  return BILLING_SUMMARY_TO_VARIANT[status as keyof typeof BILLING_SUMMARY_TO_VARIANT] ?? 'outline'
}

export function billingSummaryLabel(status: string) {
  return status in BILLING_SUMMARY_TO_VARIANT ? status : '未設定'
}

export function BillingSummaryBadges({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <Badge variant={billingSummaryVariant(status)} className={cn('rounded-full', className)}>
      {billingSummaryLabel(status)}
    </Badge>
  )
}

function StatusLabeledRow({
  label,
  children,
  inline = false,
}: {
  label: string
  children: React.ReactNode
  inline?: boolean
}) {
  if (inline) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">{label}</span>
        {children}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-[4.5rem] shrink-0 text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

export function ProjectSummaryBadges({
  workStatus,
  quotationSummary,
  billingSummary,
  className,
  layout = 'labeled',
}: {
  workStatus: string
  quotationSummary: string
  billingSummary: string
  className?: string
  layout?: 'labeled' | 'compact' | 'inline'
}) {
  if (layout === 'compact') {
    return (
      <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
        <ProjectStatusBadges status={workStatus} />
        <QuotationSummaryBadges status={quotationSummary} />
        <BillingSummaryBadges status={billingSummary} />
      </span>
    )
  }

  if (layout === 'inline') {
    return (
      <span className={cn('inline-flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
        <StatusLabeledRow label="案件狀態" inline>
          <ProjectStatusBadges status={workStatus} />
        </StatusLabeledRow>
        <StatusLabeledRow label="報價狀態" inline>
          <QuotationSummaryBadges status={quotationSummary} />
        </StatusLabeledRow>
        <StatusLabeledRow label="請款狀態" inline>
          <BillingSummaryBadges status={billingSummary} />
        </StatusLabeledRow>
      </span>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <StatusLabeledRow label="案件狀態">
        <ProjectStatusBadges status={workStatus} />
      </StatusLabeledRow>
      <StatusLabeledRow label="報價狀態">
        <QuotationSummaryBadges status={quotationSummary} />
      </StatusLabeledRow>
      <StatusLabeledRow label="請款狀態">
        <BillingSummaryBadges status={billingSummary} />
      </StatusLabeledRow>
    </div>
  )
}

/** Invoice status → badge variant */
export const INVOICE_STATUS_TO_VARIANT = {
  草稿: 'draft',
  已請款: 'quoted',
  已收款: 'confirmed',
} as const

export function invoiceStatusVariant(status: string) {
  return INVOICE_STATUS_TO_VARIANT[status as keyof typeof INVOICE_STATUS_TO_VARIANT] ?? 'draft'
}

export function invoiceStatusLabel(status: string) {
  return status in INVOICE_STATUS_TO_VARIANT ? status : '草稿'
}

export function InvoiceStatusBadges({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <Badge variant={invoiceStatusVariant(status)} className={cn('rounded-full', className)}>
      {invoiceStatusLabel(status)}
    </Badge>
  )
}

/** Quotation workflow status → badge variant */
export const QUOTATION_STATUS_TO_VARIANT = {
  草稿: 'draft',
  已報價: 'quoted',
  已確認: 'confirmed',
} as const

export function quotationStatusVariant(status: string) {
  return QUOTATION_STATUS_TO_VARIANT[status as keyof typeof QUOTATION_STATUS_TO_VARIANT] ?? 'draft'
}

export function quotationStatusLabel(status: string) {
  return status in QUOTATION_STATUS_TO_VARIANT ? status : '草稿'
}

export function QuotationStatusBadges({
  status,
  isNegotiating = false,
  className,
}: {
  status: string
  isNegotiating?: boolean
  className?: string
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <Badge variant={quotationStatusVariant(status)} className={cn('rounded-full', className)}>
        {quotationStatusLabel(status)}
      </Badge>
      {isNegotiating && (
        <Badge variant="warning" className={cn('rounded-full', className)}>
          議價中
        </Badge>
      )}
    </div>
  )
}

const DIFF_BADGE_CONFIG = {
  added: { variant: 'diff-added', icon: ArrowUp, label: '新增' },
  modified: { variant: 'diff-modified', icon: Pencil, label: '更改' },
  removed: { variant: 'diff-removed', icon: X, label: '刪除' },
} as const

export type DiffBadgeType = keyof typeof DIFF_BADGE_CONFIG

/** Version-diff pill with icon + label, optional count (e.g. banner summaries). */
export function DiffBadge({
  type,
  count,
}: {
  type: DiffBadgeType
  count?: number
}) {
  const cfg = DIFF_BADGE_CONFIG[type]
  if (!cfg) return null

  const Icon = cfg.icon
  const label = count != null && count > 0 ? `${cfg.label} ${count}` : cfg.label

  return (
    <Badge variant={cfg.variant} className="shrink-0 gap-0.5 rounded-full font-semibold">
      <Icon className="size-3.5 shrink-0 relative top-px" aria-hidden="true" />
      {label}
    </Badge>
  )
}
