import { useState } from 'react'

export default function TopBar({ title, subtitle }) {
  const [notifOpen, setNotifOpen] = useState(false)

  const notifications = [
    { icon: '📦', text: 'Order #1049 needs approval', time: '2m ago',  unread: true },
    { icon: '💳', text: 'Credit overdue — Gupta Bros', time: '1h ago', unread: true },
    { icon: '🏭', text: 'Basmati 25kg stock low (4 left)', time: '3h ago', unread: true },
    { icon: '✅', text: 'Order #1045 dispatched', time: '5h ago', unread: false },
  ]

  return (
    <header className="topbar">
      {/* Left */}
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
      </div>

      {/* Right */}
      <div className="topbar-right">
        {/* Search */}
        <div className="topbar-search">
          <span className="topbar-search-icon">🔍</span>
          <input type="text" placeholder="Search orders, retailers..." />
        </div>

        {/* Notifications */}
        <div className="topbar-notif-wrap">
          <button
            className="topbar-icon-btn"
            onClick={() => setNotifOpen((o) => !o)}
          >
            🔔
            <span className="topbar-notif-dot" />
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifications</span>
                <span className="notif-count">3 new</span>
              </div>
              {notifications.map((n, i) => (
                <div key={i} className={`notif-item ${n.unread ? 'unread' : ''}`}>
                  <span className="notif-item-icon">{n.icon}</span>
                  <div className="notif-item-body">
                    <p>{n.text}</p>
                    <span>{n.time}</span>
                  </div>
                  {n.unread && <div className="notif-unread-dot" />}
                </div>
              ))}
              <div className="notif-footer">View all notifications</div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="topbar-profile">
          <div className="topbar-avatar">RM</div>
          <div className="topbar-profile-info">
            <span className="topbar-profile-name">Rajesh Mehta</span>
            <span className="topbar-profile-role">Wholesaler</span>
          </div>
        </div>
      </div>
    </header>
  )
}
