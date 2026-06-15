// Legacy ActionMenu API → shadcn/Base UI DropdownMenu
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { getIcon } from '@/lib/icons'

const MoreIcon = getIcon('more_horiz')

export default function ActionMenu({ id, openId, onOpen, onClose, children }) {
  const isOpen = openId === id

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={open => {
        if (open) onOpen(id)
        else onClose()
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            title="更多操作"
            aria-label="更多操作"
            onClick={e => e.stopPropagation()}
          >
            {MoreIcon && <MoreIcon />}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ActionMenuItem({ icon, label, onClick, danger = false }) {
  const LucideIcon = icon ? getIcon(icon) : null

  return (
    <DropdownMenuItem
      variant={danger ? 'destructive' : 'default'}
      onClick={e => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      {LucideIcon ? <LucideIcon /> : null}
      {label}
    </DropdownMenuItem>
  )
}
