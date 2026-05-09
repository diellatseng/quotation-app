// src/components/StatusBadge.jsx

const STATUS_MAP = {
  '草稿':  { label: '草稿',  varPrefix: 'draft' },
  '已報價': { label: '已報價', varPrefix: 'quoted' },
  '已確認': { label: '已確認', varPrefix: 'confirmed' },
  '已封存': { label: '已封存', varPrefix: 'archived' },
}

export default function StatusBadge({ status, isNegotiating = false, size = 'md' }) {
  const entry = STATUS_MAP[status] || STATUS_MAP['草稿']
  const p = entry.varPrefix

  const fontSize = size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)'
  const padding  = size === 'sm' ? '2px 8px' : '4px 12px'

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{
        display: 'inline-block',
        padding,
        fontSize,
        fontWeight: 700,
        borderRadius: 'var(--radius-full)',
        background: `var(--status-${p}-bg)`,
        color: `var(--status-${p}-text)`,
        border: `1px solid var(--status-${p}-border)`,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}>
        {entry.label}
      </span>
      {isNegotiating && (
        <span style={{
          display: 'inline-block',
          padding,
          fontSize,
          fontWeight: 700,
          borderRadius: 'var(--radius-full)',
          background: 'var(--status-negotiating-bg)',
          color: 'var(--status-negotiating-text)',
          border: '1px solid var(--status-negotiating-border)',
          whiteSpace: 'nowrap',
        }}>
          議價中
        </span>
      )}
    </span>
  )
}
