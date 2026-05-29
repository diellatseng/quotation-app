// src/components/StatusBadge.jsx

const STATUS_MAP = {
  '草稿': { label: '草稿', varStatus: 'draft' },
  '已報價': { label: '已報價', varStatus: 'quoted' },
  '已確認': { label: '已確認', varStatus: 'confirmed' },
  '已結案': { label: '已結案', varStatus: 'archived' },
}

export default function StatusBadge({ status, isNegotiating = false, size = 'md' }) {
  const entry = STATUS_MAP[status] || STATUS_MAP['草稿']
  const pillClass = `status-badge__pill${size === 'sm' ? ' status-badge__pill--sm' : ''}`

  return (
    <span className="status-badge">
      <span className={pillClass} data-status={entry.varStatus}>
        {entry.label}
      </span>
      {isNegotiating && (
        <span className={pillClass} data-status="negotiating">
          議價中
        </span>
      )}
    </span>
  )
}
