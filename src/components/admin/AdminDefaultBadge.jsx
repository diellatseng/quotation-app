import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/** 管理後台列表：預設項目標記（開立抬頭、銀行帳戶等） */
export function AdminDefaultBadge({ className }) {
  return (
    <Badge variant="secondary" className={cn('rounded-full text-xs', className)}>
      預設
    </Badge>
  )
}
