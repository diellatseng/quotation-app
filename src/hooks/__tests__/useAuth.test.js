// src/hooks/__tests__/useAuth.test.js
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../useAuth'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    }
  }
}))

describe('useAuth', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const mockSession = { user: mockUser, access_token: 'token' }

  beforeEach(() => {
    jest.clearAllMocks()
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  })

  it('provides auth context', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('signIn')
    expect(result.current).toHaveProperty('signOut')
  })

  it('loads existing session on mount', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } })

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('calls signInWithPassword correctly', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.signIn('test@example.com', 'password')

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    })
  })
})
