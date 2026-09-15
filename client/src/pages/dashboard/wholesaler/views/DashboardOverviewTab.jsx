import React, { useState, useEffect } from 'react'
import {
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  Boxes,
  CreditCard,
  ShoppingCart,
  Store,
  ArrowRight,
  ArrowUpRight,
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  DollarSign
} from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext'
import { apiClient } from '../../../../api/client'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const formatTimeAgo = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
    <div
      style={{
        width: 36,
        height: 36,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--blue)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  </div>
)

const EmptyState = ({ icon = '📭', title = 'No items found', sub = '' }) => (
  <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
    <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2, fontSize: '0.9rem' }}>
      {title}
    </div>
    {sub && <div style={{ fontSize: '0.8rem' }}>{sub}</div>}
  </div>
)

export default function DashboardOverviewTab({ onNavigate }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [hoveredTrendBar, setHoveredTrendBar] = useState(null)

  const fetchCommandCenter = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await apiClient('/analytics/command-center')
      setData(res)
    } catch (err) {
      console.error('Command Center load error:', err)
      setError(err.message || 'Failed to load Command Center intelligence.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCommandCenter()
  }, [])

  if (loading) return <Spinner />

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Error Loading Command Center</div>
          <div style={{ fontSize: '0.875rem', marginBottom: 16 }}>{error}</div>
          <button
            onClick={() => fetchCommandCenter()}
            style={{
              padding: '8px 16px',
              background: '#DC2626',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.83rem',
            }}
          >
            Retry Loading
          </button>
        </div>
      </div>
    )
  }

  const {
    attention = {},
    snapshot = {},
    smartReorderSpotlight = [],
    inventoryAttentionSpotlight = [],
    creditAttentionSpotlight = [],
    salesTrend = [],
    recentActivity = [],
  } = data || {}

  // Compute slow moving count from inventory spotlight
  const slowMovingCount = inventoryAttentionSpotlight.filter(
    (item) => item.attentionStatus === 'slow_moving' || item.attentionStatus === 'dead_stock'
  ).length

  // Prioritized attention cards
  const attentionCards = [
    {
      key: 'stockout_risk',
      label: 'Stockout Risk',
      count: attention.stockoutRiskCount || 0,
      sub: 'Products at immediate risk of depletion',
      bg: '#FEF2F2',
      border: '#FCA5A5',
      color: '#DC2626',
      icon: ShieldAlert,
      tab: 'inventory-intelligence',
      priority: 1,
    },
    {
      key: 'overdue_credit',
      label: 'Overdue Credit',
      count: attention.creditOverdueCount || 0,
      sub: `${fmt(attention.totalOverdueAmount || 0)} overdue balance`,
      bg: '#FFF1F2',
      border: '#FECDD3',
      color: '#E11D48',
      icon: CreditCard,
      tab: 'credit-intelligence',
      priority: 2,
    },
    {
      key: 'reorder_due',
      label: 'Reorder Due',
      count: attention.reorderDueCount || 0,
      sub: 'Retailers expected to reorder now',
      bg: '#FFFBEB',
      border: '#FDE68A',
      color: '#D97706',
      icon: Sparkles,
      tab: 'smart-reorder',
      priority: 3,
    },
    {
      key: 'low_stock',
      label: 'Low Stock',
      count: attention.lowStockCount || 0,
      sub: 'Items below reorder point',
      bg: '#FEF3C7',
      border: '#FCD34D',
      color: '#B45309',
      icon: Boxes,
      tab: 'inventory-intelligence',
      priority: 4,
    },
    {
      key: 'high_exposure',
      label: 'High Credit Exposure',
      count: attention.highExposureCount || 0,
      sub: 'Retailers near credit limit',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      color: '#7C3AED',
      icon: AlertTriangle,
      tab: 'credit-intelligence',
      priority: 5,
    },
    {
      key: 'slow_moving',
      label: 'Slow Moving Stock',
      count: slowMovingCount,
      sub: 'Items with low turnover velocity',
      bg: '#EEF2FF',
      border: '#C7D2FE',
      color: '#4F46E5',
      icon: PackageCheck,
      tab: 'inventory-intelligence',
      priority: 6,
    },
  ]

  // Snapshot KPI items
  const kpis = [
    { label: '30-Day Revenue', value: fmt(snapshot.thirtyDayRevenue), color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', icon: TrendingUp },
    { label: "Today's Revenue", value: fmt(snapshot.todayRevenue), color: '#2563EB', bg: '#EFF4FF', border: '#BFDBFE', icon: DollarSign },
    { label: "Today's Orders", value: snapshot.todayOrders || 0, color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE', icon: ShoppingCart },
    { label: 'Total Outstanding Credit', value: fmt(snapshot.totalOutstandingCredit), color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: CreditCard },
    { label: 'Active Retailers', value: snapshot.activeRetailers || 0, color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4', icon: Store },
  ]

  // Max revenue for trend chart bar height calculation
  const maxRevenue = Math.max(...salesTrend.map((d) => d.revenue || 0), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ─────────────────────────────────────────────────────────────
          COMMAND CENTER HEADER & TOP BAR
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          background: 'var(--surface)',
          padding: '20px 24px',
          borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ display: 'inline-flex', padding: 4, background: 'var(--blue-light)', color: 'var(--blue)', borderRadius: 6 }}>
              <Activity size={18} />
            </span>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              Command Center
            </h2>
            <span
              style={{
                background: '#F0FDF4',
                color: '#16A34A',
                border: '1px solid #86EFAC',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              V1 LIVE
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Real-time operational intelligence & attention metrics for {user?.name || 'Wholesaler'}.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => fetchCommandCenter(true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh Signals'}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          QUICK ACTION TOOLBAR
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', marginRight: 4 }}>
          Quick Actions:
        </div>
        <button
          onClick={() => onNavigate && onNavigate('smart-reorder')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            background: '#FFFBEB',
            color: '#B45309',
            border: '1px solid #FDE68A',
            borderRadius: 999,
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles size={14} /> Smart Reorder ({attention.reorderDueCount || 0} Due)
        </button>

        <button
          onClick={() => onNavigate && onNavigate('inventory-intelligence')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            background: '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FCA5A5',
            borderRadius: 999,
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Boxes size={14} /> Stock Risks ({attention.stockoutRiskCount || 0} Stockout, {attention.lowStockCount || 0} Low)
        </button>

        <button
          onClick={() => onNavigate && onNavigate('credit-intelligence')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            background: '#FFF1F2',
            color: '#E11D48',
            border: '1px solid #FECDD3',
            borderRadius: 999,
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <CreditCard size={14} /> Overdue Credit ({attention.creditOverdueCount || 0} Overdue)
        </button>

        <button
          onClick={() => onNavigate && onNavigate('orders')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <ShoppingCart size={14} /> Manage Orders
        </button>

        <button
          onClick={() => onNavigate && onNavigate('retailers')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Store size={14} /> Retailer Directory
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: TODAY'S ATTENTION CARDS (PRIORITIZED)
         ───────────────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={16} style={{ color: '#DC2626' }} /> Today's Action Items
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prioritized operational signals requiring attention</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {attentionCards.map((card) => {
            const Icon = card.icon
            const hasItems = card.count > 0

            return (
              <div
                key={card.key}
                onClick={() => onNavigate && onNavigate(card.tab)}
                style={{
                  background: card.bg,
                  border: `1.5px solid ${card.border}`,
                  borderRadius: 14,
                  padding: '16px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: card.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {card.label}
                    </span>
                    <Icon size={18} style={{ color: card.color, opacity: 0.8 }} />
                  </div>

                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '2rem', fontWeight: 800, color: card.color, lineHeight: 1.1, marginBottom: 4 }}>
                    {card.count}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {card.sub}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 14,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: card.color,
                  }}
                >
                  <span>Resolve in {card.label.split(' ')[0]}</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: BUSINESS SNAPSHOT
         ───────────────────────────────────────────────────────────── */}
      <div>
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Business Snapshot
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <div
                key={kpi.label}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '16px 18px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{kpi.label}</span>
                  <span style={{ padding: 4, background: kpi.bg, borderRadius: 6, color: kpi.color }}>
                    <Icon size={14} />
                  </span>
                </div>
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: kpi.color }}>
                  {kpi.value}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SPOTLIGHT GRID (SMART REORDER, INVENTORY, CREDIT)
         ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* ── SMART REORDER SPOTLIGHT ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ padding: 6, background: '#FFFBEB', color: '#D97706', borderRadius: 8 }}>
                <Sparkles size={16} />
              </span>
              <div>
                <h4 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Smart Reorder Spotlight
                </h4>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Retailers ready to reorder</div>
              </div>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('smart-reorder')}
              style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          {smartReorderSpotlight.length === 0 ? (
            <EmptyState icon="🎯" title="No Reorders Pending" sub="All retailers are within normal order cycles" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {smartReorderSpotlight.slice(0, 4).map((item) => {
                const isOverdue = item.status === 'overdue'
                const statusColor = isOverdue ? '#DC2626' : item.status === 'due_now' ? '#D97706' : '#2563EB'
                const statusBg = isOverdue ? '#FEF2F2' : item.status === 'due_now' ? '#FFFBEB' : '#EFF4FF'

                return (
                  <div
                    key={item.retailerId}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.retailerName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {item.recommendedProductsCount} recommended items • {fmt(item.estimatedReorderValue)} est.
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span
                        style={{
                          background: statusBg,
                          color: statusColor,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 999,
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
                        {item.daysSinceLastOrder}d since last order
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── INVENTORY ATTENTION SPOTLIGHT ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ padding: 6, background: '#FEF2F2', color: '#DC2626', borderRadius: 8 }}>
                <Boxes size={16} />
              </span>
              <div>
                <h4 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Inventory Attention Spotlight
                </h4>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Critical stockout & turnover alerts</div>
              </div>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('inventory-intelligence')}
              style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          {inventoryAttentionSpotlight.length === 0 ? (
            <EmptyState icon="📦" title="Stock Levels Healthy" sub="No immediate inventory risks detected" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {inventoryAttentionSpotlight.slice(0, 4).map((item) => {
                const isRisk = item.attentionStatus === 'stockout_risk'
                const isLow = item.attentionStatus === 'low_stock'
                const statusColor = isRisk ? '#DC2626' : isLow ? '#D97706' : '#4F46E5'
                const statusBg = isRisk ? '#FEF2F2' : isLow ? '#FFFBEB' : '#EEF2FF'

                return (
                  <div
                    key={item.productId}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Stock: {item.stock} units • Supply: {item.daysOfSupply} days
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span
                        style={{
                          background: statusBg,
                          color: statusColor,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 999,
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.attentionStatus.replace('_', ' ')}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
                        {item.velocityUnitsPerDay || 0} u/day
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── CREDIT ATTENTION SPOTLIGHT ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ padding: 6, background: '#FFF1F2', color: '#E11D48', borderRadius: 8 }}>
                <CreditCard size={16} />
              </span>
              <div>
                <h4 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Credit Attention Spotlight
                </h4>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Overdue accounts & high utilization</div>
              </div>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('credit-intelligence')}
              style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          {creditAttentionSpotlight.length === 0 ? (
            <EmptyState icon="💳" title="Credit Accounts Healthy" sub="No overdue or high risk accounts" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {creditAttentionSpotlight.slice(0, 4).map((item) => {
                const isCritical = item.riskCategory === 'CRITICAL' || item.riskCategory === 'HIGH'
                const badgeColor = isCritical ? '#DC2626' : '#D97706'
                const badgeBg = isCritical ? '#FEF2F2' : '#FFFBEB'

                return (
                  <div
                    key={item.retailerId}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.retailerName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Bal: {fmt(item.currentBalance)} / {fmt(item.creditLimit)} ({item.utilizationRate}%)
                      </div>

                      {/* Mini utilization bar */}
                      <div style={{ width: '100%', height: 4, background: '#E2E8F0', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(item.utilizationRate || 0, 100)}%`,
                            height: '100%',
                            background: item.utilizationRate >= 90 ? '#DC2626' : item.utilizationRate >= 75 ? '#D97706' : '#2563EB',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span
                        style={{
                          background: badgeBg,
                          color: badgeColor,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 999,
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.riskCategory} RISK
                      </span>
                      {item.overdueAmount > 0 && (
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#DC2626', marginTop: 3 }}>
                          Overdue: {fmt(item.overdueAmount)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6 & 7: SALES TREND & RECENT ACTIVITY
         ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* ── SALES TREND CHART ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h4 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                Sales Revenue Trend (Last 30 Days)
              </h4>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Daily revenue trajectory</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: 'var(--blue)' }}>
                {fmt(snapshot.thirtyDayRevenue)}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>30D Total Revenue</div>
            </div>
          </div>

          {salesTrend.length === 0 ? (
            <EmptyState icon="📈" title="No Revenue Data" sub="Sales activity will populate the daily trend" />
          ) : (
            <div>
              {/* Bar chart canvas wrapper */}
              <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 3, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                {salesTrend.map((d, idx) => {
                  const pct = Math.max((d.revenue / maxRevenue) * 100, 3)
                  const isHovered = hoveredTrendBar === idx

                  return (
                    <div
                      key={d.date}
                      onMouseEnter={() => setHoveredTrendBar(idx)}
                      onMouseLeave={() => setHoveredTrendBar(null)}
                      style={{
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Tooltip on hover */}
                      {isHovered && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: `${pct + 8}%`,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#1E293B',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }}
                        >
                          <div>{d.date}</div>
                          <div style={{ color: '#60A5FA', fontWeight: 700 }}>{fmt(d.revenue)}</div>
                          <div>{d.orders} order(s)</div>
                        </div>
                      )}

                      <div
                        style={{
                          height: `${pct}%`,
                          background: isHovered ? '#1D4ED8' : 'var(--blue)',
                          borderRadius: '3px 3px 0 0',
                          transition: 'all 0.15s ease',
                          opacity: d.revenue > 0 ? 1 : 0.25,
                        }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* X Axis dates label preview */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 8 }}>
                <span>{salesTrend[0]?.date || ''}</span>
                <span>{salesTrend[Math.floor(salesTrend.length / 2)]?.date || ''}</span>
                <span>{salesTrend[salesTrend.length - 1]?.date || ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── RECENT ACTIVITY TIMELINE ── */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h4 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                Recent Operational Activity
              </h4>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Latest orders and payment events</div>
            </div>
            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
          </div>

          {recentActivity.length === 0 ? (
            <EmptyState icon="📋" title="No Recent Activity" sub="Events will appear here as orders & credit transactions occur" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
              {recentActivity.map((act, idx) => {
                const isCredit = act.type === 'credit'
                const Icon = isCredit ? CreditCard : ShoppingCart
                const iconBg = isCredit ? '#F0FDF4' : '#EFF4FF'
                const iconColor = isCredit ? '#16A34A' : '#2563EB'

                return (
                  <div
                    key={`${act.referenceId}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      paddingBottom: 10,
                      borderBottom: idx < recentActivity.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span style={{ padding: 6, background: iconBg, color: iconColor, borderRadius: 8, flexShrink: 0, marginTop: 2 }}>
                      <Icon size={14} />
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {act.event}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                          {formatTimeAgo(act.timestamp)}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {act.description || act.retailerName}
                      </div>
                    </div>

                    {act.amount > 0 && (
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isCredit ? '#16A34A' : 'var(--text)', flexShrink: 0 }}>
                        {fmt(act.amount)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
