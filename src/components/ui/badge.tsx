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

/** Project lifecycle status → badge variant */
export const PROJECT_STATUS_TO_VARIANT = {
  草稿: 'draft',
  已報價: 'quoted',
  已確認報價: 'confirmed',
  進行中: 'confirmed',
  完工: 'closed',
  暫停: 'warning',
} as const

export function projectStatusVariant(status: string) {
  return PROJECT_STATUS_TO_VARIANT[status as keyof typeof PROJECT_STATUS_TO_VARIANT] ?? 'draft'
}

export function projectStatusLabel(status: string) {
  return status in PROJECT_STATUS_TO_VARIANT ? status : '草稿'
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

/** Invoice status → badge variant */
export const INVOICE_STATUS_TO_VARIANT = {
  已請款: 'quoted',
  已收款: 'confirmed',
} as const

export function invoiceStatusVariant(status: string) {
  return INVOICE_STATUS_TO_VARIANT[status as keyof typeof INVOICE_STATUS_TO_VARIANT] ?? 'quoted'
}

export function invoiceStatusLabel(status: string) {
  return status in INVOICE_STATUS_TO_VARIANT ? status : '已請款'
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
