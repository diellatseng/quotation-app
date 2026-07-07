// src/App.js
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AppearanceProvider } from './context/AppearanceContext'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLoadingSkeleton } from '@/components/skeletons'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProjectSetupPage = lazy(() => import('./pages/ProjectSetupPage'))
const ProjectEditPage = lazy(() => import('./pages/ProjectEditPage'))
const WizardPage = lazy(() => import('./pages/wizard/WizardPage'))
const QuotationDetailPage = lazy(() => import('./pages/QuotationDetailPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
const InvoiceDetailPage = lazy(() => import('./pages/InvoiceDetailPage'))
const ContractDetailPage = lazy(() => import('./pages/ContractDetailPage'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const ClientsAdmin = lazy(() => import('./pages/admin/ClientsAdmin'))
const TemplatesAdmin = lazy(() => import('./pages/admin/TemplatesAdmin'))
const ServicesAdmin = lazy(() => import('./pages/admin/ServicesAdmin'))
const OtherAdmin = lazy(() => import('./pages/admin/OtherAdmin'))

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <AppLoadingSkeleton />
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Suspense fallback={<AppLoadingSkeleton />}>
      <Toaster richColors />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/projects/new" element={<ProtectedRoute><ProjectSetupPage /></ProtectedRoute>} />
        <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectEditPage /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
        <Route path="/projects/:projectId/invoices/:invoiceId" element={<ProtectedRoute><InvoiceDetailPage /></ProtectedRoute>} />
        <Route path="/quotation/new" element={<ProtectedRoute><WizardPage /></ProtectedRoute>} />
        <Route path="/quotation/:id" element={<ProtectedRoute><QuotationDetailPage /></ProtectedRoute>} />
        <Route path="/quotation/:quotationId/contract/new" element={<ProtectedRoute><ContractDetailPage /></ProtectedRoute>} />
        <Route path="/contracts/:id" element={<ProtectedRoute><ContractDetailPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/clients" replace />} />
          <Route path="clients"   element={<ClientsAdmin />} />
          <Route path="templates" element={<TemplatesAdmin />} />
          <Route path="services"  element={<ServicesAdmin />} />
          <Route path="other"     element={<OtherAdmin />} />
          <Route path="companies" element={<Navigate to="/admin/other" replace />} />
          <Route path="banks"     element={<Navigate to="/admin/other" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
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
