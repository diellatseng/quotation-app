// src/components/StatusBadge.jsx

const STATUS_MAP = {
  '草稿': {
    label: '草稿',
    classes: 'bg-status-draft text-status-draft-text border-status-draft-border',
  },
  '已報價': {
    label: '已報價',
    classes: 'bg-status-quoted text-status-quoted-text border-status-quoted-border',
  },
  '已確認': {
    label: '已確認',
    classes: 'bg-status-confirmed text-status-confirmed-text border-status-confirmed-border',
  },
  '已結案': {
    label: '已結案',
    classes: 'bg-status-closed text-status-closed-text border-status-closed-border',
  },
}

export default function StatusBadge({ status, isNegotiating = false, size = 'md' }) {
  const entry = STATUS_MAP[status] || STATUS_MAP['草稿']

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs font-medium rounded'
    : 'px-2.5 py-1 text-sm font-semibold rounded-md'

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`inline-block border ${sizeClasses} ${entry.classes}`}>
        {entry.label}
      </span>
      {isNegotiating && (
        <span className={`inline-block border ${sizeClasses} bg-status-warning text-status-warning-text border-status-warning-border`}>
          議價中
        </span>
      )}
    </div>
  )
}
