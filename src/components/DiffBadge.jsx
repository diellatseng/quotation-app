import Icon from './Icon'

const CONFIG = {
  added: {
    icon: 'arrow_upward',
    label: '新增',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  modified: {
    icon: 'edit',
    label: '更改',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  removed: {
    icon: 'close',
    label: '刪除',
    className: 'bg-red-100 text-red-800 border-red-300',
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
