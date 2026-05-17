// src/components/__tests__/StatusBadge.test.jsx
import { render, screen } from '@testing-library/react'
import StatusBadge from '../StatusBadge'

describe('StatusBadge', () => {
  it('renders 草稿 status', () => {
    render(<StatusBadge status="草稿" />)
    expect(screen.getByText('草稿')).toBeInTheDocument()
  })

  it('renders 已報價 status', () => {
    render(<StatusBadge status="已報價" />)
    expect(screen.getByText('已報價')).toBeInTheDocument()
  })

  it('renders 已確認 status', () => {
    render(<StatusBadge status="已確認" />)
    expect(screen.getByText('已確認')).toBeInTheDocument()
  })

  it('renders 已封存 status', () => {
    render(<StatusBadge status="已封存" />)
    expect(screen.getByText('已封存')).toBeInTheDocument()
  })

  it('shows 議價中 tag when isNegotiating is true', () => {
    render(<StatusBadge status="已報價" isNegotiating={true} />)
    expect(screen.getByText('已報價')).toBeInTheDocument()
    expect(screen.getByText('議價中')).toBeInTheDocument()
  })

  it('does not show 議價中 tag when isNegotiating is false', () => {
    render(<StatusBadge status="已報價" isNegotiating={false} />)
    expect(screen.getByText('已報價')).toBeInTheDocument()
    expect(screen.queryByText('議價中')).not.toBeInTheDocument()
  })

  it('renders with small size', () => {
    render(<StatusBadge status="草稿" size="sm" />)
    expect(screen.getByText('草稿')).toBeInTheDocument()
  })

  it('defaults to 草稿 for unknown status', () => {
    render(<StatusBadge status="unknown" />)
    expect(screen.getByText('草稿')).toBeInTheDocument()
  })
})
