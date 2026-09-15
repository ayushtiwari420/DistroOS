import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Store,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  Calendar,
  CreditCard,
  ShoppingBag,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  PackageCheck,
  Receipt,
  History,
} from 'lucide-react'
import { apiClient as api } from '../../../../api/client'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const formatDate = (d) => {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const Badge = ({ status }) => {
  const map = {
    pending: { bg: '#FFFBEB', color: '#D97706', label: 'Pending' },
    approved: { bg: '#EFF4FF', color: '#2563EB', label: 'Approved' },
    dispatched: { bg: '#F0FDF4', color: '#16A34A', label: 'Dispatched' },
    delivered: { bg: '#F0FDF4', color: '#15803D', label: 'Delivered' },
    cancelled: { bg: '#FEF2F2', color: '#DC2626', label: 'Cancelled' },
    active: { bg: '#F0FDF4', color: '#16A34A', label: 'Active' },
    suspended: { bg: '#FEF2F2', color: '#DC2626', label: 'Suspended' },
    overdue: { bg: '#FFFBEB', color: '#D97706', label: 'Overdue' },
    clear: { bg: '#F0FDF4', color: '#16A34A', label: 'Clear' },
    blocked: { bg: '#FEF2F2', color: '#DC2626', label: 'Blocked' },
  }
  const s = map[status] || { bg: '#F5F6FA', color: '#64748B', label: status || 'Unknown' }
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: '4px 12px',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'capitalize',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {s.label}
    </span>
  )
}

const StatTile = ({ label, value, subtext, icon: Icon, color = 'var(--blue)' }) => (
  <div
    style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px 20px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}
      >
        <Icon size={16} />
      </div>
    </div>
    <div>
      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
        {value}
      </div>
      {subtext && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{subtext}</div>}
    </div>
  </div>
)

export default function RetailerDetailView({ retailerId, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api(`/retailers/${retailerId}/insights`)
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load retailer insights.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (retailerId) {
      fetchInsights()
    }
  }, [retailerId])

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div
          style={{
            width: 36,
            height: 36,
            margin: '0 auto 16px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--blue)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Loading Retailer 360 Insights...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={16} /> Back to Retailers List
        </button>
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#DC2626',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <AlertCircle size={32} style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Error Loading Insights</div>
          <div style={{ fontSize: '0.85rem', marginBottom: 16 }}>{error}</div>
          <button
            onClick={fetchInsights}
            style={{
              padding: '8px 16px',
              background: '#DC2626',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    )
  }

  const {
    retailer = {},
    metrics = {},
    purchaseBehavior = {},
    topProducts = [],
    recentOrders = [],
    creditOverview = {},
    paymentHistory = {},
    activityTimeline = [],
  } = data || {}

  const salesmanName = retailer.assignedSalesman?.name || 'Unassigned'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── TOP NAV / BACK BUTTON ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text)',
            transition: 'all 0.15s',
          }}
        >
          <ArrowLeft size={16} /> Back to Retailers List
        </button>

        <button
          onClick={fetchInsights}
          title="Refresh Insights"
          style={{
            padding: '8px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* ── HEADER CARD ── */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 24,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: 'var(--blue-light)',
                color: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                flexShrink: 0,
              }}
            >
              <Store size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: 'var(--text)', margin: 0 }}>
                  {retailer.businessName || retailer.name}
                </h1>
                <Badge status={retailer.status} />
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {retailer.name} {retailer.city ? `• ${retailer.city}` : ''}
              </div>

              {/* Contact & Rep Strip */}
              <div style={{ display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {retailer.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={14} style={{ color: 'var(--blue)' }} /> {retailer.phone}
                  </div>
                )}
                {retailer.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={14} style={{ color: 'var(--blue)' }} /> {retailer.email}
                  </div>
                )}
                {retailer.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} style={{ color: 'var(--blue)' }} /> {retailer.city}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserCheck size={14} style={{ color: 'var(--blue)' }} /> Rep: <strong style={{ color: 'var(--text)' }}>{salesmanName}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5 KEY METRIC TILES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatTile
          label="Total Purchases"
          value={fmt(metrics.totalSpent)}
          subtext={`${metrics.deliveredCount || 0} delivered orders`}
          icon={ShoppingBag}
          color="#2563EB"
        />
        <StatTile
          label="Total Orders"
          value={metrics.totalOrders || 0}
          subtext={`Avg interval: ${purchaseBehavior.avgOrderIntervalDays || 0} days`}
          icon={Receipt}
          color="#7C3AED"
        />
        <StatTile
          label="Avg Order Value"
          value={fmt(metrics.averageOrderValue)}
          subtext="Per delivered invoice"
          icon={TrendingUp}
          color="#059669"
        />
        <StatTile
          label="Outstanding Credit"
          value={fmt(metrics.outstandingCredit)}
          subtext={`Limit: ${fmt(creditOverview.creditLimit)}`}
          icon={CreditCard}
          color={creditOverview.currentDue > 0 ? '#D97706' : '#16A34A'}
        />
        <StatTile
          label="Last Order Date"
          value={formatDate(metrics.lastOrderDate)}
          subtext={metrics.lastOrderDate ? 'Most recent purchase' : 'No order history'}
          icon={Calendar}
          color="#DB2777"
        />
      </div>

      {/* ── SECTION TABS BAR ── */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 2, overflowX: 'auto' }}>
        {[
          { key: 'overview', label: 'Purchase Behavior' },
          { key: 'products', label: `Top Products (${topProducts.length})` },
          { key: 'orders', label: `Recent Orders (${recentOrders.length})` },
          { key: 'credit', label: 'Credit Overview' },
          { key: 'payments', label: 'Payment History' },
          { key: 'activity', label: `Activity (${activityTimeline.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === t.key ? '2px solid var(--blue)' : '2px solid transparent',
              background: 'transparent',
              color: activeTab === t.key ? 'var(--blue)' : 'var(--text-muted)',
              fontWeight: activeTab === t.key ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT 1: PURCHASE BEHAVIOR ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* Order Distribution */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PackageCheck size={18} style={{ color: 'var(--blue)' }} /> Order Lifecycle Breakdown
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Delivered Orders', count: purchaseBehavior.deliveredOrdersCount || 0, color: '#16A34A', bg: '#F0FDF4' },
                { label: 'Pending Orders', count: purchaseBehavior.pendingOrdersCount || 0, color: '#D97706', bg: '#FFFBEB' },
                { label: 'Dispatched Orders', count: purchaseBehavior.dispatchedOrdersCount || 0, color: '#2563EB', bg: '#EFF4FF' },
                { label: 'Cancelled Orders', count: purchaseBehavior.cancelledOrdersCount || 0, color: '#DC2626', bg: '#FEF2F2' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: item.bg,
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontSize: '0.83rem', fontWeight: 600, color: item.color }}>{item.label}</span>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: item.color }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Type Distribution */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} style={{ color: 'var(--blue)' }} /> Payment Type Preference
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Cash Payment Orders', count: purchaseBehavior.paymentTypeDistribution?.cash || 0 },
                { label: 'Credit Line Orders', count: purchaseBehavior.paymentTypeDistribution?.credit || 0 },
                { label: 'UPI / Digital Payment Orders', count: purchaseBehavior.paymentTypeDistribution?.upi || 0 },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'var(--bg)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--blue)' }}>{item.count} orders</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 2: TOP PRODUCTS ── */}
      {activeTab === 'products' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Top Purchased Products</h3>
          {topProducts.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No purchase history found for this retailer.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Product</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Units Bought</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)' }}>{p.productName}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{p.category}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>{p.totalQuantity}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--blue)' }}>{fmt(p.totalSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT 3: RECENT ORDERS ── */}
      {activeTab === 'orders' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Order History</h3>
          {recentOrders.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No orders have been placed by this retailer yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Order #</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Items</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Payment</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--blue)' }}>{o.orderNumber || o._id.toString().slice(-6)}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{formatDate(o.createdAt)}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text)' }}>{o.items?.length || 0} items</td>
                      <td style={{ padding: '12px 14px', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                        {o.paymentType} • <span style={{ fontWeight: 600 }}>{o.paymentStatus}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Badge status={o.status} />
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>{fmt(o.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT 4: CREDIT OVERVIEW ── */}
      {activeTab === 'credit' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={18} style={{ color: 'var(--blue)' }} /> Credit Account Profile
          </h3>

          {!creditOverview.hasCredit ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No credit account has been set up for this retailer yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Credit Limit</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>{fmt(creditOverview.creditLimit)}</div>
              </div>

              <div style={{ padding: '14px 16px', background: creditOverview.currentDue > 0 ? '#FFFBEB' : '#F0FDF4', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Current Due</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: creditOverview.currentDue > 0 ? '#D97706' : '#16A34A' }}>
                  {fmt(creditOverview.currentDue)}
                </div>
              </div>

              <div style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Available Credit</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#16A34A' }}>{fmt(creditOverview.availableCredit)}</div>
              </div>

              <div style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Credit Status</div>
                <div style={{ marginTop: 4 }}>
                  <Badge status={creditOverview.status} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT 5: PAYMENT HISTORY ── */}
      {activeTab === 'payments' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Payment History & Ledger</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
            <div style={{ padding: '12px 14px', background: '#F0FDF4', borderRadius: 10, border: '1px solid #86EFAC' }}>
              <div style={{ fontSize: '0.75rem', color: '#166534' }}>Total Payments Made</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#15803D' }}>{fmt(paymentHistory.totalPaid)}</div>
            </div>

            <div style={{ padding: '12px 14px', background: '#FFFBEB', borderRadius: 10, border: '1px solid #FCD34D' }}>
              <div style={{ fontSize: '0.75rem', color: '#92400E' }}>Outstanding Balance</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#D97706' }}>{fmt(paymentHistory.totalOutstandingBalance)}</div>
            </div>
          </div>

          {paymentHistory.recentTransactions?.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No credit transactions recorded.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Note</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.recentTransactions.map((tx) => (
                    <tr key={tx._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{formatDate(tx.date)}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, textTransform: 'uppercase', color: tx.type === 'credit' ? '#16A34A' : '#DC2626' }}>
                        {tx.type}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text)' }}>{tx.note || '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: tx.type === 'credit' ? '#16A34A' : '#DC2626' }}>
                        {tx.type === 'credit' ? '-' : '+'}{fmt(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT 6: ACTIVITY TIMELINE ── */}
      {activeTab === 'activity' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} style={{ color: 'var(--blue)' }} /> Activity Stream
          </h3>

          {activityTimeline.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No recorded activities.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activityTimeline.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    padding: '12px 14px',
                    background: 'var(--bg)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: evt.type === 'account_created' ? '#EFF4FF' : evt.type === 'order_placed' ? '#F0FDF4' : '#FFFBEB',
                      color: evt.type === 'account_created' ? '#2563EB' : evt.type === 'order_placed' ? '#16A34A' : '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {evt.type === 'account_created' ? <Store size={16} /> : evt.type === 'order_placed' ? <ShoppingBag size={16} /> : <CreditCard size={16} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>{evt.title}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(evt.timestamp)}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{evt.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
