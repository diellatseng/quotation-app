import { Card, CardContent } from '@/components/ui/card'
import { ProjectSummaryBadges } from '@/components/ui/badge'
import { formatRocDate } from '@/lib/rocDate'
import { displayLandSection, displayProjectName } from '@/lib/projectDisplay'

const fmt = (n) => (n != null && n !== '' ? `NT$ ${Number(n).toLocaleString('zh-TW')}` : '—')

export default function ProjectsMobileList({ rows, onRowClick }) {
  return (
    <div className="space-y-3 md:hidden">
      {rows.map(row => {
        const project = row.original
        return (
          <Card
            key={project.id}
            size="sm"
            className="cursor-pointer gap-0 py-0 shadow-sm transition-colors hover:bg-surface-hover"
            onClick={() => onRowClick(project)}
          >
            <CardContent className="space-y-3 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayLandSection(project)}
                  </p>
                  {project.marketing_name?.trim() && (
                    <p className="truncate text-xs text-foreground">{displayProjectName(project)}</p>
                  )}
                </div>
              </div>
              <ProjectSummaryBadges
                workStatus={project.status}
                quotationSummary={project.quotationSummary}
                billingSummary={project.billingSummary}
              />
              <div className="text-sm text-foreground">{project.clients?.company_name || '—'}</div>
              <div className="flex items-center justify-between text-xs text-foreground">
                <span>{formatRocDate(project.updated_at?.slice(0, 10))}</span>
                <span className="font-semibold text-foreground">{fmt(project.total_amount)}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
