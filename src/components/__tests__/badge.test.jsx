// src/components/__tests__/badge.test.jsx
import { render, screen } from '@testing-library/react'
import {
  DiffBadge,
  QuotationStatusBadges,
  quotationStatusLabel,
  quotationStatusVariant,
} from '../ui/badge'

describe('quotation status badge helpers', () => {
  it('maps known statuses to variants', () => {
    expect(quotationStatusVariant('草稿')).toBe('draft')
    expect(quotationStatusVariant('已報價')).toBe('quoted')
    expect(quotationStatusVariant('已確認')).toBe('confirmed')
    expect(quotationStatusVariant('已結案')).toBe('closed')
  })

  it('defaults unknown status to draft', () => {
    expect(quotationStatusVariant('unknown')).toBe('draft')
    expect(quotationStatusLabel('unknown')).toBe('草稿')
  })
})

describe('QuotationStatusBadges', () => {
  it('renders 草稿 status', () => {
    render(<QuotationStatusBadges status="草稿" />)
    expect(screen.getByText('草稿')).toBeInTheDocument()
  })

  it('renders 已報價 status', () => {
    render(<QuotationStatusBadges status="已報價" />)
    expect(screen.getByText('已報價')).toBeInTheDocument()
  })

  it('renders 已確認 status', () => {
    render(<QuotationStatusBadges status="已確認" />)
    expect(screen.getByText('已確認')).toBeInTheDocument()
  })

  it('renders 已結案 status', () => {
    render(<QuotationStatusBadges status="已結案" />)
    expect(screen.getByText('已結案')).toBeInTheDocument()
  })

  it('shows 議價中 tag when isNegotiating is true', () => {
    render(<QuotationStatusBadges status="已報價" isNegotiating={true} />)
    expect(screen.getByText('已報價')).toBeInTheDocument()
    expect(screen.getByText('議價中')).toBeInTheDocument()
  })

  it('does not show 議價中 tag when isNegotiating is false', () => {
    render(<QuotationStatusBadges status="已報價" isNegotiating={false} />)
    expect(screen.getByText('已報價')).toBeInTheDocument()
    expect(screen.queryByText('議價中')).not.toBeInTheDocument()
  })
})

describe('DiffBadge', () => {
  it('renders added label', () => {
    render(<DiffBadge type="added" />)
    expect(screen.getByText('新增')).toBeInTheDocument()
  })

  it('renders modified label with count', () => {
    render(<DiffBadge type="modified" count={2} />)
    expect(screen.getByText('更改 2')).toBeInTheDocument()
  })

  it('renders removed label', () => {
    render(<DiffBadge type="removed" />)
    expect(screen.getByText('刪除')).toBeInTheDocument()
  })
})
