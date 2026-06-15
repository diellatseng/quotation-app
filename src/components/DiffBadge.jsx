import { ArrowUp, Pencil, X } from 'lucide-react'

const CONFIG = {
  added: {
    icon: ArrowUp,
    label: '新增',
    className: 'bg-diff-added-badge text-diff-added-text border-diff-added-border',
  },
  modified: {
    icon: Pencil,
    label: '更改',
    className: 'bg-diff-modified-badge text-diff-modified-text border-diff-modified-border',
  },
  removed: {
    icon: X,
    label: '刪除',
    className: 'bg-diff-removed-badge text-diff-removed-badge-text border-diff-removed-border',
  },
}

/** Version-diff pill with Lucide icon + label, optional count (e.g. banner summaries). */
export default function DiffBadge({ type, count }) {
  const cfg = CONFIG[type]
  if (!cfg) return null

  const BadgeIcon = cfg.icon

  return (
    <span
      className={`inline-flex items-center gap-0.5 flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.className}`}
    >
      <BadgeIcon className="size-3.5 shrink-0" aria-hidden="true" />
      {cfg.label}
      {count != null && count > 0 ? ` ${count}` : ''}
    </span>
  )
}
