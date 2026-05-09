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
    <div style={s.bg}>
      <div style={s.card} role="main">
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.logoBox} aria-hidden="true">報</div>
          <div>
            <h1 style={s.title}>報價管理系統</h1>
            <p style={s.subtitle}>Quotation Management</p>
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

        <p style={s.hint}>帳號由管理員建立，如需帳號請聯繫管理員。</p>
      </div>
    </div>
  )
}

const s = {
  bg: {
    minHeight: '100vh',
    background: 'var(--color-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-6)',
  },
  card: {
    background: 'var(--color-bg-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-10)',
    width: '100%',
    maxWidth: 420,
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--color-border)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-8)',
  },
  logoBox: {
    width: 56, height: 56,
    background: 'var(--color-text)',
    color: 'var(--color-text-inverse)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--text-xl)',
    fontWeight: 700,
    flexShrink: 0,
    letterSpacing: 0,
  },
  title: {
    margin: 0,
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    color: 'var(--color-text)',
    letterSpacing: '0.04em',
  },
  subtitle: {
    margin: 0,
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.1em',
    marginTop: 4,
  },
  hint: {
    marginTop: 'var(--space-6)',
    textAlign: 'center',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    lineHeight: 1.6,
  },
}
