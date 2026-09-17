import React, { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './Topbar'

export default function DashboardLayout({ children, title, subtitle }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#111827] flex flex-col antialiased">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col transition-all duration-200 ease-in-out"
        style={{
          paddingLeft: collapsed ? '60px' : '232px'
        }}
      >
        <TopBar
          title={title}
          subtitle={subtitle}
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
        />

        <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
