// Legacy Switch API → shadcn/Base UI Switch
import { Switch as ShadcnSwitch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const SIZE_MAP = {
  sm: 'sm',
  md: 'default',
  lg: 'default',
}

const WRAPPER_GAP = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
}

const LABEL_SIZE = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

export default function Switch({
  checked = false,
  onChange,
  label = null,
  labelOff = 'Off',
  labelOn = 'On',
  id,
  ariaLabel,
  disabled = false,
  size = 'md',
}) {
  const shadcnSize = SIZE_MAP[size] || 'default'
  const labelBase = cn(
    'font-medium select-none transition-colors duration-200',
    LABEL_SIZE[size] || LABEL_SIZE.md,
    disabled ? 'text-muted-foreground/40 cursor-not-allowed' : 'cursor-pointer'
  )

  const switchEl = (
    <ShadcnSwitch
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      size={shadcnSize}
      aria-label={ariaLabel || (label != null ? label : `${labelOff} / ${labelOn}`)}
    />
  )

  if (label != null) {
    return (
      <div className={cn('inline-flex items-center', WRAPPER_GAP[size] || WRAPPER_GAP.md)}>
        <label htmlFor={id} className={cn(labelBase, 'text-foreground')}>
          {label}
        </label>
        {switchEl}
      </div>
    )
  }

  return (
    <div className={cn('inline-flex items-center', WRAPPER_GAP[size] || WRAPPER_GAP.md)}>
      <label
        htmlFor={id}
        className={cn(labelBase, !checked && !disabled ? 'text-foreground' : 'text-muted-foreground')}
      >
        {labelOff}
      </label>
      {switchEl}
      <label
        htmlFor={id}
        className={cn(labelBase, checked && !disabled ? 'text-foreground' : 'text-muted-foreground')}
      >
        {labelOn}
      </label>
    </div>
  )
}
