// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useNotification } from '../context/NotificationContext'
import { Button } from '@/components/ui/button'
import packageJson from '../../package.json'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading, signIn } = useAuth()
  const { error } = useNotification()
  const navigate = useNavigate()

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
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        檢查登入狀態…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm text-card-foreground" role="main">

        {/* Brand */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground" aria-hidden="true">
            報
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">報價管理系統</h1>
            <p className="text-sm text-muted-foreground">Quotation Management</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-foreground">
              電子郵件
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-foreground">
              密碼
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              aria-required="true"
            />
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-border cursor-pointer accent-primary"
            />
            <label htmlFor="rememberMe" className="text-sm text-muted-foreground select-none cursor-pointer">
              記住我的帳號
            </label>
          </div>

          <Button
            type="submit"
            variant="default"
            size="md"
            disabled={loading}
            className="w-full font-semibold text-base py-2"
          >
            {loading ? '登入中…' : '登入'}
          </Button>
        </form>

        <div className="space-y-1 pt-2 text-center">
          <p className="text-xs text-muted-foreground">帳號由管理員建立，如需帳號請聯繫管理員。</p>
          <p className="text-xs text-muted-foreground/70">v{packageJson.version}</p>
        </div>
      </div>
    </div>
  )
}