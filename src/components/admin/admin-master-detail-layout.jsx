import { cn } from '@/lib/utils'

export default function AdminMasterDetailLayout({
  list,
  detail,
  showDetail,
  className,
}) {
  return (
    <div
      className={cn(
        'grid gap-5',
        showDetail ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]' : 'grid-cols-1',
        className,
      )}
    >
      <div className="min-w-0">{list}</div>
      {showDetail ? <div className="min-w-0">{detail}</div> : null}
    </div>
  )
}
