// src/hooks/useAuth.js
import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { supabase, SESSION_TIMEOUT_HOURS } from '../lib/supabase'

const AuthContext = createContext(null)
const SESSION_TIMESTAMP_KEY = 'auth_session_timestamp'
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_HOURS * 60 * 60 * 1000

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const timeoutRef = useRef(null)
  const checkIntervalRef = useRef(null)

  // 檢查 session 是否過期
  const checkSessionTimeout = async () => {
    const lastLoginTime = localStorage.getItem(SESSION_TIMESTAMP_KEY)
    if (!lastLoginTime) return

    const elapsed = Date.now() - parseInt(lastLoginTime)
    if (elapsed > SESSION_TIMEOUT_MS) {
      console.log('❌ Session 已過期，自動登出')
      await signOut()
    }
  }

  // 重置超時計時器
  const resetSessionTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString())
    
    // 在超時前 5 分鐘發出警告（可選）
    timeoutRef.current = setTimeout(() => {
      console.warn('⚠️ Session 即將過期，請重新登入')
    }, SESSION_TIMEOUT_MS - 5 * 60 * 1000)
  }

  // 初始化認證
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // 檢查 session 是否過期
      await checkSessionTimeout()
      
      setSession(session)
      setUser(session?.user ?? null)
      if (session) {
        resetSessionTimer()
      }
      setLoading(false)
    }
    
    initAuth()

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession) {
        resetSessionTimer()
      }
    })

    // 定期檢查 session 是否過期（每分鐘檢查一次）
    checkIntervalRef.current = setInterval(() => {
      checkSessionTimeout()
    }, 60 * 1000)

    return () => {
      subscription.unsubscribe()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
    }
  }, [])

  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (result.data?.session) {
      setSession(result.data.session)
      setUser(result.data.session.user ?? null)
      resetSessionTimer() // 登入時重置計時器
    }
    return result
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    localStorage.removeItem(SESSION_TIMESTAMP_KEY)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  // 手動刷新 session 並重置計時器（用戶活動時調用）
  const refreshSession = () => {
    resetSessionTimer()
  }

  // 提供存取 session credentials 的方法
  const getCredentials = () => {
    if (typeof window === 'undefined') return null
    const sessionData = window.localStorage.getItem('sb-' + import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0])
    return sessionData ? JSON.parse(sessionData) : null
  }

  return (
    <AuthContext.Provider value={{ user, loading, session, signIn, signOut, refreshSession, getCredentials }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
