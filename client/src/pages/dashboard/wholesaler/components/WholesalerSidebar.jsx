import React from 'react'
import {
  LayoutDashboard, ShoppingCart, Package, Store, CreditCard, Users, LogOut,
  ChevronLeft, ChevronRight, User, Sparkles, Boxes, Receipt, BarChart2
} from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext'
import BrandLogo from '../../../../components/ui/BrandLogo'

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'analytics', label: 'Analytics', icon: BarChart2 },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'inventory-intelligence', label: 'Inventory Intel', icon: Boxes },
  { key: 'smart-reorder', label: 'Smart Reorder', icon: Sparkles },
  { key: 'retailers', label: 'Retailers', icon: Store },
  { key: 'salesmen', label: 'Salesmen', icon: Users },
  { key: 'credit', label: 'Credit', icon: CreditCard },
  { key: 'payments', label: 'Payments', icon: Receipt },
]


export default function WholesalerSidebar({ active, setActive, collapsed, setCollapsed }) {
  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: collapsed ? 60 : 232,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transition: 'width 0.25s ease',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'visible',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '14px 0' : '14px 16px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid var(--border)',
          minHeight: 60,
          flexShrink: 0,
        }}
      >
        <BrandLogo size="md" variant="dark" collapsed={collapsed} />
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          position: 'absolute',
          top: 17,
          right: -13,
          width: 26,
          height: 26,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s',
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {!collapsed && (
          <div
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--text-faint)',
              padding: '0 14px 6px',
            }}
          >
            MAIN MENU
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              title={collapsed ? item.label : ''}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '9px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? 'var(--blue)' : 'var(--text-muted)',
                background: isActive ? 'var(--blue-light)' : 'transparent',
                borderLeft: `2.5px solid ${isActive ? 'var(--blue)' : 'transparent'}`,
                borderRight: 'none', borderTop: 'none', borderBottom: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.15s',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={18} strokeWidth={2} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.85 }} />
              {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

