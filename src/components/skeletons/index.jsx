import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminListSkeleton({ rows = 8 }) {
  return (
    <Card className="gap-0 py-0 shadow-sm" aria-busy="true" aria-label="載入中">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-2 border-b border-border p-4 last:border-b-0">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </Card>
  )
}

export function AdminFormSkeleton() {
  return (
    <Card className="shadow-sm" aria-busy="true" aria-label="載入中">
      <div className="space-y-4 p-6">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </Card>
  )
}

export function DashboardQuotationsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="載入中">
      <div className="block space-y-3 md:hidden">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i} className="gap-0 py-0 shadow-sm">
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-3/5" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="hidden gap-0 overflow-hidden py-0 shadow-sm md:block">
        <div className="space-y-0">
          <div className="flex gap-4 border-b border-border bg-muted/40 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-3 flex-1" />
            ))}
          </div>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border p-4 last:border-b-0">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 flex-[2]" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="size-8 rounded-md ml-auto" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function QuotationDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-label="載入中">
      <div className="border-b border-border bg-background/90">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-2 px-4 md:h-14 md:px-8">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-full max-w-sm" />
        <Skeleton className="mx-auto h-[640px] w-full max-w-[794px] rounded-xl" />
      </div>
    </div>
  )
}

export function WizardQuotationSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="載入中">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Card className="gap-0 py-0 shadow-sm">
        <div className="border-b border-border bg-muted/30 px-4 py-3 sm:px-6">
          <Skeleton className="h-9 w-56" />
        </div>
        <div className="space-y-3 px-4 py-4 sm:px-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    </div>
  )
}

export function Step1ClientSkeleton() {
  return (
    <div className="space-y-3 py-4" aria-busy="true" aria-label="載入中">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function AppLoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8" aria-busy="true" aria-label="載入中">
      <div className="w-full max-w-sm space-y-4">
        <Skeleton className="mx-auto h-10 w-10 rounded-lg" />
        <Skeleton className="mx-auto h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
