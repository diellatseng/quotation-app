// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AppearanceProvider } from './context/AppearanceContext'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLoadingSkeleton } from '@/components/skeletons'

import LoginPage             from './pages/LoginPage'
import DashboardPage         from './pages/DashboardPage'
import ProjectSetupPage     from './pages/ProjectSetupPage'
import ProjectEditPage      from './pages/ProjectEditPage'
import WizardPage            from './pages/wizard/WizardPage'
import QuotationDetailPage   from './pages/QuotationDetailPage'
import ProjectDetailPage     from './pages/ProjectDetailPage'
import InvoiceDetailPage     from './pages/InvoiceDetailPage'
import AdminLayout           from './pages/admin/AdminLayout'
import ClientsAdmin          from './pages/admin/ClientsAdmin'
import TemplatesAdmin        from './pages/admin/TemplatesAdmin'
import ServicesAdmin         from './pages/admin/ServicesAdmin'
import CompanyProfilesAdmin  from './pages/admin/CompanyProfilesAdmin'
import BankAccountsAdmin     from './pages/admin/BankAccountsAdmin'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <AppLoadingSkeleton />
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <>
      <Toaster richColors />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/projects/new" element={<ProtectedRoute><ProjectSetupPage /></ProtectedRoute>} />
        <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectEditPage /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
        <Route path="/projects/:projectId/invoices/:invoiceId" element={<ProtectedRoute><InvoiceDetailPage /></ProtectedRoute>} />
        <Route path="/quotation/new" element={<ProtectedRoute><WizardPage /></ProtectedRoute>} />
        <Route path="/quotation/:id" element={<ProtectedRoute><QuotationDetailPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/clients" replace />} />
          <Route path="clients"   element={<ClientsAdmin />} />
          <Route path="templates" element={<TemplatesAdmin />} />
          <Route path="services"  element={<ServicesAdmin />} />
          <Route path="companies" element={<CompanyProfilesAdmin />} />
          <Route path="banks"     element={<BankAccountsAdmin />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AppearanceProvider>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </AppearanceProvider>
  )
}
