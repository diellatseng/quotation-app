// src/pages/admin/AdminLayout.jsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppBreadcrumbBar } from '@/components/AppShellHeader'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ADMIN_TABS = [
  { value: 'clients', to: '/admin/clients', label: '客戶資料庫' },
  { value: 'templates', to: '/admin/templates', label: '工程範本' },
  { value: 'services', to: '/admin/services', label: '服務資料庫' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = ADMIN_TABS.find(tab => location.pathname.startsWith(tab.to))?.value ?? 'clients'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppBreadcrumbBar backTo="/dashboard" segments={['管理']} />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            const tab = ADMIN_TABS.find(item => item.value === value)
            if (tab) navigate(tab.to)
          }}
          className="mb-6"
        >
          <TabsList variant="line" className="h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0">
            {ADMIN_TABS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value} className="rounded-none px-4 py-2.5">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Outlet />
      </main>
    </div>
  )
}
