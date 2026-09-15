import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Check, X, Truck, CheckCircle } from 'lucide-react'
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

const ErrBox = ({ msg }) =>
  msg ? (
    <div
      style={{
        background: '#FEF2F2',
        border: '1px solid #FCA5A5',
        color: '#DC2626',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: '0.83rem',
        marginBottom: 14,
      }}
    >
      {msg}
    </div>
  ) : null

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

export default function OrdersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiClient(`/orders${filter !== 'all' ? `?status=${filter}` : ''}`)
      setOrders(data.orders)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const handleStatus = async (id, status) => {
    setUpdating(id)
    try {
      await apiClient(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)))
    } catch (e) {
      setError(e.message)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>
          Orders
        </h2>
        <button
          onClick={load}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.83rem',
            color: 'var(--text-muted)',
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'dispatched', 'delivered', 'cancelled'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: '5px 14px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: filter === t ? 'var(--blue)' : 'var(--surface)',
              color: filter === t ? '#fff' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <ErrBox msg={error} />

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <Spinner />
        ) : orders.length === 0 ? (
          <Empty icon="📋" title="No orders found" sub="Try a different filter or wait for retailers to place orders" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  {['Order', 'Retailer', 'Items', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--blue)', whiteSpace: 'nowrap' }}>
                      {o.orderNumber}
                    </td>
                    <td style={tdStyle}>{o.retailer?.businessName || o.retailer?.name || '—'}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>
                      {o.items?.length} item{o.items?.length !== 1 ? 's' : ''}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {fmt(o.totalAmount)}
                    </td>
                    <td style={{ ...tdStyle, textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                      {o.paymentType}
                    </td>
                    <td style={tdStyle}><Badge status={o.status} /></td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {o.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatus(o._id, 'approved')}
                              disabled={updating === o._id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                                background: '#F0FDF4', color: '#16A34A', border: '1px solid #86EFAC',
                                borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                              }}
                            >
                              <Check size={11} /> Approve
                            </button>
                            <button
                              onClick={() => handleStatus(o._id, 'cancelled')}
                              disabled={updating === o._id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                                background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5',
                                borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                              }}
                            >
                              <X size={11} /> Reject
                            </button>
                          </>
                        )}
                        {o.status === 'approved' && (
                          <button
                            onClick={() => handleStatus(o._id, 'dispatched')}
                            disabled={updating === o._id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                              background: '#EFF4FF', color: '#2563EB', border: '1px solid #BFDBFE',
                              borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            }}
                          >
                            <Truck size={11} /> Dispatch
                          </button>
                        )}
                        {o.status === 'dispatched' && (
                          <button
                            onClick={() => handleStatus(o._id, 'delivered')}
                            disabled={updating === o._id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                              background: '#F0FDF4', color: '#15803D', border: '1px solid #86EFAC',
                              borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            }}
                          >
                            <CheckCircle size={11} /> Delivered
                          </button>
                        )}
                      </div>
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
