import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  Bell,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Package,
  CreditCard,
  X
} from 'lucide-react'

export default function TopBar({ title, subtitle, onMenuToggle }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  const notifications = [
    { id: 1, icon: Package, text: 'Order #1049 needs approval', time: '2m ago', unread: true },
    { id: 2, icon: CreditCard, text: 'Credit overdue — Gupta Bros', time: '1h ago', unread: true },
    { id: 3, icon: AlertTriangle, text: 'Basmati 25kg stock low (4 left)', time: '3h ago', unread: true },
    { id: 4, icon: CheckCircle2, text: 'Order #1045 dispatched', time: '5h ago', unread: false },
  ]

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 bg-white backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4">
      {/* Left Title & Mobile Menu Toggle */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <h1 className="text-lg font-bold font-display text-slate-900 tracking-tight truncate leading-tight">
            {title || 'Dashboard'}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Tools: Search, Notifications, Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Search Input */}
        <div className="relative hidden md:block w-64 lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders, inventory, retailers..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
          />
          <kbd className="hidden lg:inline-flex items-center gap-0.5 absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded">
            ⌘K
          </kbd>
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold font-display text-slate-900">
                  Notifications
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                  3 new
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => {
                  const IconComponent = n.icon
                  return (
                    <div
                      key={n.id}
                      className={`px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50 cursor-pointer ${
                        n.unread ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                        <IconComponent className="w-3.5 h-3.5 stroke-[2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-800 leading-snug font-medium">
                          {n.text}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {n.time}
                        </span>
                      </div>
                      {n.unread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                <button className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Header Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center shadow-xs">
            RM
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-slate-900 leading-tight">
              Rajesh Mehta
            </span>
            <span className="text-[10px] text-slate-500">
              Wholesaler
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
