import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import { apiClient } from '../../../../api/client'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const Badge = ({ status }) => {
  const map = {
    pending: { bg: '#FFFBEB', color: '#D97706', label: 'Pending' },
    approved: { bg: '#EFF4FF', color: '#2563EB', label: 'Approved' },
    dispatched: { bg: '#F0FDF4', color: '#16A34A', label: 'Dispatched' },
    delivered: { bg: '#F0FDF4', color: '#15803D', label: 'Delivered' },
    cancelled: { bg: '#FEF2F2', color: '#DC2626', label: 'Cancelled' },
  }
  const s = map[status] || { bg: '#F5F6FA', color: '#64748B', label: status }
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: '0.72rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  )
}

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
    <div
      style={{
        width: 32,
        height: 32,
        border: '2.5px solid var(--border)',
        borderTopColor: 'var(--blue)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  </div>
)

const Empty = ({ icon = '📭', title = 'No data found', sub = '' }) => (
  <div style={{ textAlign: 'center', padding: '52px 20px', color: 'var(--text-muted)' }}>
    <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>{icon}</div>
    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4, fontSize: '0.95rem' }}>
      {title}
    </div>
    {sub && <div style={{ fontSize: '0.82rem' }}>{sub}</div>}
  </div>
)

const thStyle = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
}
const tdStyle = { padding: '12px 14px' }

export default function DashboardOverviewTab() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient('/orders/stats'),
      apiClient('/orders?limit=5')
    ])
      .then(([s, o]) => {
        setStats(s.stats)
        setOrders(o.orders)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const cards = [
    { label: 'Total Orders', value: stats?.total || 0, color: '#2563EB', bg: '#EFF4FF' },
    { label: 'Pending', value: stats?.pending || 0, color: '#D97706', bg: '#FFFBEB' },
    { label: 'Monthly Revenue', value: fmt(stats?.monthlyRevenue), color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Total Revenue', value: fmt(stats?.revenue), color: '#7C3AED', bg: '#F5F3FF' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.25rem', fontWeight: 800, marginBottom: 3 }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Here's your business overview for today.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              {c.label}
            </div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.7rem', fontWeight: 800, color: c.color }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700 }}>
          Recent Orders
        </div>
        {orders.length === 0 ? (
          <Empty icon="📦" title="No orders yet" sub="Orders placed by your retailers will appear here" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  {['Order', 'Retailer', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--blue)' }}>{o.orderNumber}</td>
                    <td style={tdStyle}>{o.retailer?.businessName || o.retailer?.name || '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{fmt(o.totalAmount)}</td>
                    <td style={tdStyle}><Badge status={o.status} /></td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
