// src/components/StatusBadge.jsx
const STATUS_MAP = {
  '草稿': {
    label: '草稿',
    classes: 'bg-zinc-100 text-zinc-700 border-zinc-300'
  },
  '已報價': {
    label: '已報價',
    classes: 'bg-blue-50 text-blue-700 border-blue-300'
  },
  '已確認': {
    label: '已確認',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-300'
  },
  '已結案': {
    label: '已結案',
    classes: 'bg-zinc-700 text-zinc-50 border-zinc-700'
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
        <span className={`inline-block border ${sizeClasses} bg-amber-50 text-amber-800 border-amber-300`}>
          議價中
        </span>
      )}
    </div>
  )
}