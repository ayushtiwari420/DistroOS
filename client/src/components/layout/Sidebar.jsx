import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Package,
  Store, CreditCard, Users, BarChart2,
  Settings, LogOut,
} from 'lucide-react'
import BrandLogo from '../ui/Brandlogo'

const navConfig = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard/wholesaler',           icon: LayoutDashboard },
  { key: 'orders',    label: 'Orders',    path: '/dashboard/wholesaler/orders',    icon: ShoppingCart, badge: 12 },
  { key: 'inventory', label: 'Inventory', path: '/dashboard/wholesaler/inventory', icon: Package },
  { key: 'retailers', label: 'Retailers', path: '/dashboard/wholesaler/retailers', icon: Store },
  { key: 'credit',    label: 'Credit',    path: '/dashboard/wholesaler/credit',    icon: CreditCard },
  { key: 'salesmen',  label: 'Salesmen',  path: '/dashboard/wholesaler/salesmen',  icon: Users },
  { key: 'analytics', label: 'Analytics', path: '/dashboard/wholesaler/analytics', icon: BarChart2 },
]

const bottomConfig = [
  { key: 'settings', label: 'Settings', path: '/dashboard/wholesaler/settings', icon: Settings },
  { key: 'logout',   label: 'Logout',   path: '/login',                         icon: LogOut },
]

const iconProps = { size: 16, strokeWidth: 1.75 }

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: collapsed ? 60 : 232,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 50, transition: 'width 0.25s ease',
      overflow: 'visible',
      boxShadow: 'var(--shadow-sm)',
    }}>

      {/* Brand */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: collapsed ? '14px 0' : '14px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid var(--border)',
        minHeight: 60, flexShrink: 0, gap: 0,
      }}>
        <BrandLogo size="md" variant="dark" collapsed={collapsed} />
      </div>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          position: 'absolute', top: 17, right: -13,
          width: 26, height: 26,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          color: 'var(--text-muted)',
          fontSize: '0.7rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', zIndex: 60,
          boxShadow: 'var(--shadow-sm)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--blue)'
          e.currentTarget.style.color = '#fff'
          e.currentTarget.style.borderColor = 'var(--blue)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--surface)'
          e.currentTarget.style.color = 'var(--text-muted)'
          e.currentTarget.style.borderColor = 'var(--border)'
        }}
      >
        {collapsed ? '›' : '‹'}
      </button>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 0 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {!collapsed && (
          <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-faint)', padding: '0 14px 6px' }}>
            MAIN MENU
          </div>
        )}

        {navConfig.map(item => {
          const Icon   = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : ''}
              style={{
                display: 'flex', alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '9px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: active ? 'var(--blue)' : 'var(--text-muted)',
                background: active ? 'var(--blue-light)' : 'transparent',
                borderLeft: active ? '2px solid var(--blue)' : '2px solid transparent',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: active ? 600 : 500,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg)'
                  e.currentTarget.style.color = 'var(--text)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }
              }}
            >
              <Icon {...iconProps} />
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && item.badge && (
                <span style={{
                  background: 'var(--blue)', color: '#fff',
                  fontSize: '0.62rem', fontWeight: 700,
                  padding: '1px 6px', borderRadius: 999,
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ paddingBottom: 12, borderTop: '1px solid var(--border)' }}>
        {!collapsed && (
          <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-faint)', padding: '10px 14px 6px' }}>
            ACCOUNT
          </div>
        )}

        {bottomConfig.map(item => {
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 0' : '9px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: 'var(--text-muted)', textDecoration: 'none',
                fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.15s',
                borderLeft: '2px solid transparent',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <Icon {...iconProps} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}

        {/* Profile */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : 10,
          padding: collapsed ? '10px 0' : '10px 14px 0',
          justifyContent: collapsed ? 'center' : 'flex-start',
          marginTop: 6, borderTop: '1px solid var(--border)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--blue-light)',
            border: '1.5px solid var(--blue-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 700,
            color: 'var(--blue)', flexShrink: 0,
          }}>
            RM
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>Rajesh Mehta</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Wholesaler</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
