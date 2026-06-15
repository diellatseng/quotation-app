// Legacy ActionMenu API → shadcn/Base UI DropdownMenu
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getIcon } from '@/lib/icons'
import IconButton from './IconButton'

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
          <IconButton
            icon="more_horiz"
            tooltip="更多操作"
            variant="ghost"
            size="sm"
            onClick={e => e.stopPropagation()}
          />
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
