import { describe, expect, it } from 'vitest'
import { getServiceRowState } from '../ServiceRowShell'

describe('getServiceRowState', () => {
  it('prioritises drag-over above diff and added flags', () => {
    expect(
      getServiceRowState({
        isOver: true,
        diff: 'added',
        isAdded: true,
        isDragging: false,
      }),
    ).toBe('drag-over')
  })

  it('returns diff status before new/dragging/default', () => {
    expect(
      getServiceRowState({
        isOver: false,
        diff: 'modified',
        isAdded: true,
        isDragging: true,
      }),
    ).toBe('modified')
  })

  it('returns new for manually added rows without diff', () => {
    expect(
      getServiceRowState({
        isOver: false,
        diff: null,
        isAdded: true,
        isDragging: false,
      }),
    ).toBe('new')
  })

  it('returns dragging when actively dragged with no higher-priority state', () => {
    expect(
      getServiceRowState({
        isOver: false,
        diff: null,
        isAdded: false,
        isDragging: true,
      }),
    ).toBe('dragging')
  })

  it('falls back to default', () => {
    expect(
      getServiceRowState({
        isOver: false,
        diff: null,
        isAdded: false,
        isDragging: false,
      }),
    ).toBe('default')
  })
})
