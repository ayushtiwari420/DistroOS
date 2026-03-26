import { Navigate } from 'react-router-dom'
import { useAuth }  from '../context/AuthContext'

/**
 * ProtectedRoute
 * Wraps any route that requires authentication.
 * Optionally restricts to specific roles.
 *
 * Usage:
 *   <Route path="/dashboard/admin" element={
 *     <ProtectedRoute roles={['admin']}>
 *       <AdminDashboard />
 *     </ProtectedRoute>
 *   } />
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth()

  // Still checking session — show nothing (or a spinner)
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', fontFamily: 'Inter, sans-serif',
        fontSize: '0.875rem', color: 'var(--text-muted)',
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 32, height: 32,
            border: '2.5px solid var(--border)',
            borderTopColor: 'var(--blue)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          Loading...
        </div>
      </div>
    )
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Logged in but wrong role → redirect to their own dashboard
  if (roles.length > 0 && !roles.includes(user.role)) {
    const routes = {
      admin:      '/dashboard/admin',
      wholesaler: '/dashboard/wholesaler',
      salesman:   '/dashboard/salesman',
      retailer:   '/dashboard/retailer',
    }
    return <Navigate to={routes[user.role] || '/'} replace />
  }

  return children
}
