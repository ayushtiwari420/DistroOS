import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }    from './context/AuthContext'
import ProtectedRoute      from './components/ProtectedRoute'

import LandingPage         from './pages/public/LandingPage'
import LoginPage           from './pages/public/Login'
import RegisterPage        from './pages/public/Register'

import WholesalerDashboard from './pages/dashboard/wholesaler/WholesalerDashboard'
import RetailerDashboard   from './pages/dashboard/retailer/RetailerDashboard'
import SalesmanDashboard   from './pages/dashboard/salesman/SalesmanDashboard'
import AdminDashboard      from './pages/dashboard/admin/AdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ── Public ── */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Wholesaler — all sub-routes handled internally by dashboard ── */}
          <Route path="/dashboard/wholesaler/*" element={
            <ProtectedRoute roles={['wholesaler']}>
              <WholesalerDashboard />
            </ProtectedRoute>
          } />

          {/* ── Retailer ── */}
          <Route path="/dashboard/retailer/*" element={
            <ProtectedRoute roles={['retailer']}>
              <RetailerDashboard />
            </ProtectedRoute>
          } />

          {/* ── Salesman ── */}
          <Route path="/dashboard/salesman/*" element={
            <ProtectedRoute roles={['salesman']}>
              <SalesmanDashboard />
            </ProtectedRoute>
          } />

          {/* ── Admin ── */}
          <Route path="/dashboard/admin/*" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* ── Fallback — unknown routes go to login, not home ── */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App