import Icon from './Icon'

const CONFIG = {
  added: {
    icon: 'arrow_upward',
    label: '新增',
    className: 'bg-diff-added-badge text-diff-added-text border-diff-added-border',
  },
  modified: {
    icon: 'edit',
    label: '更改',
    className: 'bg-diff-modified-badge text-diff-modified-text border-diff-modified-border',
  },
  removed: {
    icon: 'close',
    label: '刪除',
    className: 'bg-diff-removed-badge text-diff-removed-badge-text border-diff-removed-border',
  },
}

/** Version-diff pill: Material Symbol + label, optional count (e.g. banner summaries). */
export default function DiffBadge({ type, count }) {
  const cfg = CONFIG[type]
  if (!cfg) return null

  return (
    <span
      className={`inline-flex items-center gap-0.5 flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.className}`}
    >
      <Icon name={cfg.icon} className="text-sm leading-none" title="" />
      {cfg.label}
      {count != null && count !== '' ? ` ${count}` : ''}
    </span>
  )
}
