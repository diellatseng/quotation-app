// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNotification } from '../context/NotificationContext'
import Button from '../components/Button'
import packageJson from '../../package.json'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading]   = useState(false)
  const { user, loading: authLoading, signIn } = useAuth()
  const { error }               = useNotification()
  const navigate                = useNavigate()

  // 初始化時：從 localStorage 載入記住的 email
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  // 監聽 email 或 rememberMe 變化，更新 localStorage
  useEffect(() => {
    if (rememberMe && email) {
      localStorage.setItem('rememberedEmail', email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }
  }, [email, rememberMe])

  // 如果已登入，自動重定向到 dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, authLoading, navigate])

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

  // 如果正在檢查認證狀態，顯示載入中
  if (authLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', color: 'var(--color-text-muted)',
      }}>
        檢查登入狀態…
      </div>
    )
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

          <div style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="rememberMe" style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              記住我的帳號
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ width: '100%', fontSize: 'var(--text-md)' }}
          >
            {loading ? '登入中…' : '登入'}
          </Button>
        </form>

        <p className="login-hint">帳號由管理員建立，如需帳號請聯繫管理員。</p>
        <p className="login-hint">v{packageJson.version}</p>
      </div>
    </div>
  )
}
