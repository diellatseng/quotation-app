// src/pages/admin/AdminLayout.jsx
import { NavLink, Outlet } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/admin/clients',   label: '客戶資料庫' },
  { to: '/admin/templates', label: '工程範本' },
  { to: '/admin/services',  label: '服務資料庫' },
]

export default function AdminLayout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="header-title">管理介面</span>
        <nav className="topbar-nav">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/dashboard" className="admin-back-link">
          ← 返回
        </NavLink>
      </header>
      <main className="page-body page-body--narrow">
        <Outlet />
      </main>
    </div>
  )
}
