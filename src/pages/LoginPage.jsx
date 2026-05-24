// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNotification } from '../context/NotificationContext'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const { signIn }              = useAuth()
  const { error }               = useNotification()
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error: err } = await signIn(email, password)
    if (err) {
      error('電子郵件或密碼錯誤，請再試一次。')
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="login-bg">
      <div className="login-card" role="main">

        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo" aria-hidden="true">報</div>
          <div>
            <h1 className="login-title">報價管理系統</h1>
            <p className="login-subtitle">Quotation Management</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label htmlFor="email" className="field-label">電子郵件</label>
            <input
              id="email"
              type="email"
              className="field-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              required
              aria-required="true"
            />
          </div>

          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label htmlFor="password" className="field-label">密碼</label>
            <input
              id="password"
              type="password"
              className="field-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              aria-required="true"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', fontSize: 'var(--text-md)' }}
          >
            {loading ? '登入中…' : '登入'}
          </button>
        </form>

        <p className="login-hint">帳號由管理員建立，如需帳號請聯繫管理員。</p>
        <p className="login-hint">{process.env.REACT_APP_VERSION}</p>
      </div>
    </div>
  )
}
