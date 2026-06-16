// src/pages/LoginPage.jsx
import { useState, useEffect, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import packageJson from '../../package.json'

export default function LoginPage() {
  const emailId = useId()
  const passwordId = useId()
  const rememberId = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading, signIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  useEffect(() => {
    if (rememberMe && email) {
      localStorage.setItem('rememberedEmail', email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }
  }, [email, rememberMe])

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
      toast.error('電子郵件或密碼錯誤，請再試一次。', { duration: 6000 })
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        檢查登入狀態…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-sm [--card-spacing:--spacing(8)]" role="main">
        <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground" aria-hidden="true">
            報
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">報價管理系統</h1>
            <p className="text-sm text-muted-foreground">Quotation Management</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor={emailId}>電子郵件</FieldLabel>
              <Input
                id={emailId}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                aria-required="true"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={passwordId}>密碼</FieldLabel>
              <Input
                id={passwordId}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                aria-required="true"
              />
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id={rememberId}
                checked={rememberMe}
                onCheckedChange={setRememberMe}
              />
              <Label htmlFor={rememberId} className="font-normal text-muted-foreground">
                記住我的帳號
              </Label>
            </Field>

            <Button
              type="submit"
              variant="default"
              size="md"
              disabled={loading}
              className="w-full font-semibold text-base py-2"
            >
              {loading ? '登入中…' : '登入'}
            </Button>
          </FieldGroup>
        </form>

        <div className="space-y-1 pt-2 text-center">
          <p className="text-xs text-muted-foreground">帳號由管理員建立，如需帳號請聯繫管理員。</p>
          <p className="text-xs text-muted-foreground/70">v{packageJson.version}</p>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}
