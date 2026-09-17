import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Store,
  CreditCard,
  Users,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Sparkles
} from 'lucide-react'
import BrandLogo from '../ui/BrandLogo'

const navConfig = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard/wholesaler', icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', path: '/dashboard/wholesaler/orders', icon: ShoppingCart, badge: 12 },
  { key: 'inventory', label: 'Inventory', path: '/dashboard/wholesaler/inventory', icon: Package },
  { key: 'retailers', label: 'Retailers', path: '/dashboard/wholesaler/retailers', icon: Store },
  { key: 'credit', label: 'Credit Risk', path: '/dashboard/wholesaler/credit', icon: CreditCard },
  { key: 'salesmen', label: 'Salesmen', path: '/dashboard/wholesaler/salesmen', icon: Users },
  { key: 'analytics', label: 'Analytics', path: '/dashboard/wholesaler/analytics', icon: BarChart2 },
]

const intelConfig = [
  { key: 'smart-reorder', label: 'Smart Reorder', path: '/dashboard/wholesaler/smart-reorder', icon: Sparkles },
  { key: 'inventory-intel', label: 'Inventory Intel', path: '/dashboard/wholesaler/inventory-intel', icon: BrainCircuit },
]

const bottomConfig = [
  { key: 'settings', label: 'Settings', path: '/dashboard/wholesaler/settings', icon: Settings },
  { key: 'logout', label: 'Logout', path: '/login', icon: LogOut },
]

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-200 shadow-xs ${
          collapsed ? 'w-[60px]' : 'w-[232px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div
          className={`h-15 border-b border-slate-100 flex items-center shrink-0 ${
            collapsed ? 'justify-center px-0' : 'justify-between px-4'
          }`}
        >
          <BrandLogo size="md" variant="dark" collapsed={collapsed} />

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-600 transition-colors shadow-xs"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Main Menu Section */}
          <div>
            {!collapsed && (
              <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase select-none">
                MAIN NAVIGATION
              </div>
            )}
            <div className="space-y-0.5">
              {navConfig.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : ''}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors group relative ${
                      active
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 stroke-[2] transition-colors ${
                        active
                          ? 'text-blue-600'
                          : 'text-slate-500 group-hover:text-slate-700'
                      }`}
                    />

                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}

                    {!collapsed && item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-200 leading-none">
                        {item.badge}
                      </span>
                    )}

                    {/* Active Bar Indicator */}
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Intelligence Section */}
          <div>
            {!collapsed && (
              <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase select-none flex items-center justify-between">
                <span>INTELLIGENCE</span>
              </div>
            )}
            <div className="space-y-0.5">
              {intelConfig.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : ''}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors group relative ${
                      active
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 stroke-[2] transition-colors ${
                        active
                          ? 'text-blue-600'
                          : 'text-slate-500 group-hover:text-slate-700'
                      }`}
                    />

                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}

                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-2 border-t border-slate-100 space-y-1">
          {bottomConfig.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : ''}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors ${
                  collapsed ? 'justify-center px-0' : ''
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0 stroke-[2] text-slate-500" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}

          {/* User Profile */}
          <div
            className={`pt-2 mt-2 border-t border-slate-100 flex items-center gap-3 px-2 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 shrink-0">
              RM
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-900 truncate">
                  Rajesh Mehta
                </span>
                <span className="text-[11px] text-slate-500 truncate">
                  Wholesaler Admin
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

    </>
  )
}
