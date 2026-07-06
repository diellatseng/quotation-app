import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { restoreSpaRedirectFromStorage } from '../spaRedirect'

describe('restoreSpaRedirectFromStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    window.history.replaceState(null, '', '/quotation-app/')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('restores deep link before React Router starts', () => {
    sessionStorage.setItem('spaRedirect', '/dashboard')
    const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '') || ''

    restoreSpaRedirectFromStorage()

    expect(sessionStorage.getItem('spaRedirect')).toBeNull()
    expect(window.location.pathname).toBe(`${base}/dashboard`)
  })

  it('does nothing when no redirect is stored', () => {
    restoreSpaRedirectFromStorage()
    expect(window.location.pathname).toBe('/quotation-app/')
  })
})
