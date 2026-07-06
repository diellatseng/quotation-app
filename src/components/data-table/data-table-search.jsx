import { Search } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'

export function DataTableSearch({
  value,
  onChange,
  placeholder = '搜尋…',
  className = 'h-7 flex-1 bg-card sm:max-w-md',
  'aria-label': ariaLabel = '搜尋',
}) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <Search className="size-4 text-muted-foreground" aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </InputGroup>
  )
}
