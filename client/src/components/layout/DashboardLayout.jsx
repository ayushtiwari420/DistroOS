import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar  from './Topbar'
export default function DashboardLayout({ children, title, subtitle }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="dashboard-layout">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div
        className="dashboard-main"
        style={{ marginLeft: collapsed ? 68 : 240, transition: 'margin-left 0.3s ease' }}
      >
        <TopBar title={title} subtitle={subtitle} />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  )
}
