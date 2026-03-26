import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { loginUser, logoutUser, refreshToken, getMe } from '../services/auth.service'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

// ── Access token in memory (reset on page refresh — use silentRefresh to restore) ──
let _accessToken = null

export const getAccessToken = () => _accessToken

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate              = useNavigate()
  const refreshTimer          = useRef(null)

  // ── Schedule next silent refresh ──
  const scheduleRefresh = useCallback((fn) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    // Refresh 1 min before 15m expiry = every 14 min
    refreshTimer.current = setTimeout(fn, 14 * 60 * 1000)
  }, [])

  // ── Silent refresh — called on every page load ──
  const silentRefresh = useCallback(async () => {
    try {
      const data   = await refreshToken()   // sends cookie automatically
      _accessToken = data.accessToken
      scheduleRefresh(silentRefresh)
      return data.accessToken
    } catch (err) {
      // 401 = no session, completely normal on public pages
      _accessToken = null
      setUser(null)
      return null
    }
  }, [scheduleRefresh])

  // ── Restore session on every page load/refresh ──
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await silentRefresh()
        if (token) {
          const data = await getMe(token)
          setUser(data.user)
        }
      } catch {
        _accessToken = null
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
    }
  }, [silentRefresh])

  // ── Login ──
  const login = async (email, password, role) => {
    const data   = await loginUser({ email, password, role })
    _accessToken = data.accessToken
    setUser(data.user)
    scheduleRefresh(silentRefresh)

    const routes = {
      admin:      '/dashboard/admin',
      wholesaler: '/dashboard/wholesaler',
      salesman:   '/dashboard/salesman',
      retailer:   '/dashboard/retailer',
    }
    navigate(routes[data.user.role] || '/')
    return data
  }

  // ── Logout ──
  const logout = async () => {
    try { await logoutUser() } catch {}
    _accessToken = null
    setUser(null)
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    navigate('/login')
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isRole: (role) => user?.role === role,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
