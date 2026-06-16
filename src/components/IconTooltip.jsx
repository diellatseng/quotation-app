import { forwardRef } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/** Wraps an icon-only control with a consistent tooltip (requires app-level TooltipProvider). */
const IconTooltip = forwardRef(function IconTooltip(
  { label, side = 'top', children },
  ref,
) {
  return (
    <Tooltip>
      <TooltipTrigger ref={ref} render={children} />
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
})

export default IconTooltip
