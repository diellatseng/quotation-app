import { cn } from '@/lib/utils'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

/**
 * App-wide empty state built on shadcn Empty.
 * @param {object} props
 * @param {import('lucide-react').LucideIcon} [props.icon]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action]
 * @param {boolean} [props.compact] — tighter padding for lists inside Card
 * @param {boolean} [props.embedded] — no outer border when nested in Card
 */
export function AppEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
  embedded = false,
}) {
  return (
    <Empty
      className={cn(
        compact ? 'gap-3 p-8' : 'gap-4 p-12',
        embedded && 'rounded-none border-0 bg-transparent shadow-none',
        className,
      )}
    >
      <EmptyHeader>
        {Icon && (
          <EmptyMedia
            variant="icon"
            className={cn(
              compact ? 'size-9 [&_svg:not([class*="size-"])]:size-4' : 'size-12 rounded-xl [&_svg:not([class*="size-"])]:size-6',
            )}
          >
            <Icon aria-hidden="true" />
          </EmptyMedia>
        )}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}
