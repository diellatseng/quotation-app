// src/__tests__/App.test.js
import { render, screen } from '@testing-library/react'
import App from '../App'

// Mock Supabase to prevent real API calls
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      }),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    }
  }
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeInTheDocument()
  })

  it('shows login page when not authenticated', async () => {
    render(<App />)
    
    // Wait for auth to load
    await screen.findByText('報價管理系統', {}, { timeout: 2000 })
    
    expect(screen.getByText('報價管理系統')).toBeInTheDocument()
    expect(screen.getByText('Quotation Management')).toBeInTheDocument()
  })

  it('has email and password inputs on login page', async () => {
    render(<App />)
    
    await screen.findByLabelText('電子郵件')
    
    expect(screen.getByLabelText('電子郵件')).toBeInTheDocument()
    expect(screen.getByLabelText('密碼')).toBeInTheDocument()
  })

  it('has login button', async () => {
    render(<App />)
    
    await screen.findByRole('button', { name: /登入/ })
    
    expect(screen.getByRole('button', { name: /登入/ })).toBeInTheDocument()
  })
})
