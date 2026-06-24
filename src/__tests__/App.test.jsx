// src/__tests__/App.test.js
//
// Smoke tests for the top-level <App /> component.
//
// App wraps the entire tree:
//   AppearanceProvider → AuthProvider → BrowserRouter → Routes
//
// What we test here:
//  - The component tree mounts without throwing
//  - When there is no authenticated session, the login page is rendered
//  - The login page shows the expected heading, email/password fields, and button
//
// What we DON'T test here:
//  - Authenticated routing (covered by individual page tests)
//  - Actual sign-in logic (covered by useAuth tests)
//
// Mocking strategy:
//  - supabase is mocked so no real network calls are made
//  - getSession resolves with session: null  → simulates logged-out state
//  - onAuthStateChange returns a subscription stub so cleanup doesn't crash
//
// How to run only this file:
//   npm test -- --testPathPattern="App.test" --watchAll=false

import { vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'
import { supabase } from '../lib/supabase'

// Prevent real Supabase calls — getSession must return a real Promise
// so that AuthProvider's .then() handler works correctly in tests
vi.mock('../lib/supabase', () => ({
  SESSION_TIMEOUT_HOURS: 24,
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

describe('App', () => {
  beforeEach(() => {
    // Suppress React Router v6 → v7 migration warnings that are irrelevant to tests
    vi.spyOn(console, 'warn').mockImplementation((msg) => {
      if (typeof msg === 'string' && msg.includes('React Router Future Flag Warning')) return
      console.warn(msg)
    })

    // Re-assert mock implementations before every test.
    // This prevents stale or cleared mock state from a previous test's
    // render/cleanup cycle causing "Cannot read properties of undefined
    // (reading 'then')" on getSession().
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })
  // ─────────────────────────────────────────────────────────────
  // Mount
  // ─────────────────────────────────────────────────────────────

  it('renders without crashing', async () => {
    // Expected: the full provider/router tree mounts without throwing.
    // findByText waits for AuthProvider's async getSession to settle
    // before we assert — no manual act() needed since RTL wraps internally.
    render(<App />)
    await screen.findByText('專案管理系統', {}, { timeout: 2000 })
    expect(document.body).toBeInTheDocument()
  })

  // ─────────────────────────────────────────────────────────────
  // Unauthenticated state → login page
  // ─────────────────────────────────────────────────────────────

  it('shows the login page heading when there is no active session', async () => {
    // getSession resolves with session: null → AuthProvider sets user to null
    // → ProtectedRoute redirects to /login → LoginPage renders
    // Expected: main heading "專案管理系統" is visible
    render(<App />)
    await screen.findByText('專案管理系統', {}, { timeout: 2000 })
    expect(screen.getByText('專案管理系統')).toBeInTheDocument()
  })

  it('shows the English subtitle on the login page', async () => {
    // Expected: subtitle "Project Management" is visible alongside the heading
    render(<App />)
    await screen.findByText('Project Management', {}, { timeout: 2000 })
    expect(screen.getByText('Project Management')).toBeInTheDocument()
  })

  it('renders an email input on the login page', async () => {
    // Expected: a labelled input for "電子郵件" is present
    render(<App />)
    await screen.findByLabelText('電子郵件')
    expect(screen.getByLabelText('電子郵件')).toBeInTheDocument()
  })

  it('renders a password input on the login page', async () => {
    // Expected: a labelled input for "密碼" is present
    render(<App />)
    await screen.findByLabelText('密碼')
    expect(screen.getByLabelText('密碼')).toBeInTheDocument()
  })

  it('renders a login submit button', async () => {
    // Expected: a button whose accessible name matches /登入/ is present
    render(<App />)
    await screen.findByRole('button', { name: /登入/ })
    expect(screen.getByRole('button', { name: /登入/ })).toBeInTheDocument()
  })
})