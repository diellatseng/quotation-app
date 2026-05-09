// src/pages/admin/AdminLayout.jsx
import { NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <header style={s.bar}>
        <span style={s.title}>管理介面</span>
        <nav style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {[
            { to: '/admin/clients',   label: '客戶資料庫' },
            { to: '/admin/templates', label: '工程範本' },
            { to: '/admin/services',  label: '服務資料庫' },
          ].map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              color: isActive ? 'var(--color-text)' : 'rgba(255,255,255,0.7)',
              background: isActive ? 'var(--color-bg-surface)' : 'transparent',
              textDecoration: 'none',
              minHeight: 'var(--tap-min)',
              display: 'flex', alignItems: 'center',
            })}>
              {label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/dashboard" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
          ← 返回
        </NavLink>
      </header>
      <main style={{ flex: 1, maxWidth: 900, width: '100%', margin: '0 auto', padding: 'var(--space-8) var(--space-5)' }}>
        <Outlet />
      </main>
    </div>
  )
}

const s = {
  bar: {
    background: 'var(--color-text)', color: '#fff',
    padding: 'var(--space-3) var(--space-6)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap',
  },
  title: { fontWeight: 700, fontSize: 'var(--text-md)', letterSpacing: '0.04em' },
}
