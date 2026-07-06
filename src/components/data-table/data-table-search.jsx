import { Search } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { dataTableSearchClassName } from './toolbar-styles'

export function DataTableSearch({
  value,
  onChange,
  placeholder = '搜尋…',
  className = dataTableSearchClassName,
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
