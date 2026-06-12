// src/components/StatusBadge.jsx

const STATUS_MAP = {
  '草稿': {
    label: '草稿',
    classes: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
  },
  '已報價': {
    label: '已報價',
    classes: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50'
  },
  '已確認': {
    label: '已確認',
    classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50'
  },
  '已結案': {
    label: '已結案',
    classes: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600'
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
        <span className={`inline-block border ${sizeClasses} bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50`}>
          議價中
        </span>
      )}
    </div>
  )
}