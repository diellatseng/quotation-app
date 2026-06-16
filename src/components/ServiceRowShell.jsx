import { cn } from '@/lib/utils'

/** @typedef {'default' | 'drag-over' | 'dragging' | 'added' | 'modified' | 'removed' | 'new'} ServiceRowState */

/**
 * Resolve the primary visual state for a service row shell.
 * Priority matches the original ServiceTable border/bg logic.
 */
export function getServiceRowState({ isOver, diff, isAdded, isDragging }) {
  if (isOver) return 'drag-over'
  if (diff === 'added') return 'added'
  if (diff === 'modified') return 'modified'
  if (diff === 'removed') return 'removed'
  if (isAdded) return 'new'
  if (isDragging) return 'dragging'
  return 'default'
}

const surfaceClasses = {
  default: 'border border-border bg-card',
  'drag-over': 'border-2 border-dashed border-accent bg-card',
  dragging: 'border border-border bg-muted',
  added: 'border-2 border-diff-added-border bg-diff-added',
  modified: 'border-2 border-diff-modified-border bg-diff-modified',
  removed: 'border-2 border-diff-removed-border bg-diff-removed',
  new: 'border-2 border-highlight-border bg-highlight',
}

export function getServiceRowIndexBadgeClass({ isRemoved, isAdded }) {
  return cn(
    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
    isRemoved && 'bg-diff-removed-badge text-diff-removed-badge-text',
    !isRemoved && isAdded && 'bg-highlight-border text-primary-foreground',
    !isRemoved && !isAdded && 'bg-muted text-muted-foreground',
  )
}

export function ServiceRowShell({
  state,
  isDragging = false,
  isRemoved = false,
  className,
  ...props
}) {
  return (
    <div
      data-slot="service-row"
      data-state={state}
      className={cn(
        'overflow-hidden rounded-md text-sm text-card-foreground transition-opacity',
        surfaceClasses[state] ?? surfaceClasses.default,
        isDragging ? 'cursor-grabbing opacity-40' : 'cursor-default opacity-100',
        isRemoved && 'opacity-70',
        className,
      )}
      {...props}
    />
  )
}

/** Shared horizontal padding for row sections (header, body, collapsed stub). */
export function ServiceRowSection({ className, ...props }) {
  return (
    <div
      data-slot="service-row-section"
      className={cn('px-3', className)}
      {...props}
    />
  )
}
