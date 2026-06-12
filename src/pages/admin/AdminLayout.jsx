// src/pages/admin/AdminLayout.jsx
import { NavLink, Outlet } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/admin/clients', label: '客戶資料庫' },
  { to: '/admin/templates', label: '工程範本' },
  { to: '/admin/services', label: '服務資料庫' },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 flex items-center justify-between gap-6">
          <span className="text-lg font-bold">管理介面</span>
          <nav className="flex items-center gap-6">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <NavLink to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto">
            ← 返回
          </NavLink>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <Outlet />
      </main>
    </div>
  )
}
