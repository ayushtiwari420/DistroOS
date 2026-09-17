import React, { useState, useEffect, useCallback } from 'react'
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
  Pencil,
  Trash2,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  PieChart as PieIcon,
  X,
  Plus,
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { apiClient as api } from '../../../../api/client'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// ─────────────────────────────────────────────────────────────
// HELPER FORMATTERS
// ─────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const formatDate = (d) => {
  if (!d) return 'N/A'
  const date = new Date(d)
  if (isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatDateTime = (d) => {
  if (!d) return 'N/A'
  const date = new Date(d)
  if (isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─────────────────────────────────────────────────────────────
// UI PRIMITIVES
// ─────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    pending: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: 'Pending' },
    approved: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', label: 'Approved' },
    dispatched: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Dispatched' },
    delivered: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', label: 'Delivered' },
    cancelled: { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', label: 'Cancelled' },
    active: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Active' },
    suspended: { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', label: 'Suspended' },
    overdue: { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', label: 'Overdue' },
    clear: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Healthy Credit' },
    blocked: { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', label: 'Blocked Credit' },
    watch: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: 'Watch Account' },
  }
  const s = map[status] || { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0', label: status || 'Unknown' }
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: '0.72rem',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  )
}

const StatTile = ({ label, value, subtext, icon: Icon, accentColor = '#2563EB' }) => (
  <div
    style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      padding: '16px 18px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>
        {label}
      </span>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </div>
    </div>
    <div>
      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.35rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
        {value}
      </div>
      {subtext && <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: 4 }}>{subtext}</div>}
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────
// SKELETON LOADER COMPONENT
// ─────────────────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'pulse 1.5s infinite ease-in-out' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
      {/* Header Skeleton */}
      <div style={{ height: 110, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14 }} />

      {/* Metric Tiles Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ height: 90, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }} />
        ))}
      </div>

      {/* Main Content 2-Column Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ height: 180, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14 }} />
          <div style={{ height: 240, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ height: 220, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14 }} />
          <div style={{ height: 200, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14 }} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN RETAILER DETAIL VIEW COMPONENT
// ─────────────────────────────────────────────────────────────
export default function RetailerDetailView({ retailerId, onBack, onNavigateToOrder, onNavigateToProduct }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Edit Retailer Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', businessName: '', city: '', status: 'active', creditLimit: '' })
  const [updating, setUpdating] = useState(false)
  const [modalError, setModalError] = useState(null)

  // Delete / Unlink Modal State
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false)
  const [unlinking, setUnlinking] = useState(false)

  // Actions Dropdown Menu State
  const [actionsOpen, setActionsOpen] = useState(false)

  // Active Tab for Main Section
  const [activeTab, setActiveTab] = useState('overview')

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api(`/retailers/${retailerId}/insights`)
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load retailer information.')
    } finally {
      setLoading(false)
    }
  }, [retailerId])

  useEffect(() => {
    if (retailerId) {
      fetchInsights()
    }
  }, [retailerId, fetchInsights])

  // Populate Edit Form when modal opens
  const openEditModal = () => {
    if (!data?.retailer) return
    const r = data.retailer
    const credit = data.creditOverview || {}
    setEditForm({
      name: r.name || '',
      phone: r.phone || '',
      businessName: r.businessName || '',
      city: r.city || '',
      status: r.status || 'active',
      creditLimit: credit.creditLimit !== undefined ? credit.creditLimit : '',
    })
    setModalError(null)
    setEditModalOpen(true)
    setActionsOpen(false)
  }

  // Handle Edit Form Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setModalError(null)
    try {
      await api(`/retailers/${retailerId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          businessName: editForm.businessName,
          city: editForm.city,
          status: editForm.status,
          creditLimit: editForm.creditLimit !== '' ? Number(editForm.creditLimit) : undefined,
        }),
      })
      setEditModalOpen(false)
      fetchInsights()
    } catch (err) {
      setModalError(err.message || 'Failed to update retailer details.')
    } finally {
      setUpdating(false)
    }
  }

  // Handle Delete / Unlink Retailer
  const handleUnlinkSubmit = async () => {
    setUnlinking(true)
    setModalError(null)
    try {
      await api(`/retailers/${retailerId}`, { method: 'DELETE' })
      setUnlinkModalOpen(false)
      onBack?.()
    } catch (err) {
      setModalError(err.message || 'Failed to remove retailer.')
    } finally {
      setUnlinking(false)
    }
  }

  // ── SKELETON LOADING STATE ──
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={15} /> Retailers List
          </button>
        </div>
        <SkeletonLoader />
      </div>
    )
  }

  // ── ERROR STATE ──
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40, fontFamily: 'Inter, sans-serif' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#374151',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          <ArrowLeft size={16} /> Back to Retailers List
        </button>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #FCA5A5',
            borderRadius: 14,
            padding: '40px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: '#DC2626',
            }}
          >
            <AlertCircle size={24} />
          </div>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#111827', margin: '0 0 6px' }}>
            Couldn't load retailer information
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '0 auto 20px', maxWidth: 420 }}>
            {error || 'The requested retailer account details could not be retrieved.'}
          </p>
          <button
            onClick={fetchInsights}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    )
  }

  // Extract data payload safely
  const {
    retailer = {},
    metrics = {},
    purchaseBehavior = {},
    topProducts = [],
    recentOrders = [],
    creditOverview = {},
    paymentHistory = {},
    activityTimeline = [],
    trustScore = {},
  } = data || {}

  const salesmanName = retailer.assignedSalesman?.name || 'Unassigned'
  const initials = (retailer.businessName || retailer.name || 'R')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Construct chart trend data if order history exists
  const hasOrderHistory = recentOrders.length > 0
  const chartLabels = [...recentOrders].reverse().map((o) => formatDate(o.createdAt))
  const chartValues = [...recentOrders].reverse().map((o) => o.totalAmount || 0)

  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Purchase Amount (₹)',
        data: chartValues,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#2563EB',
        pointRadius: 4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Purchase: ₹${Number(ctx.raw || 0).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        ticks: {
          font: { size: 10 },
          callback: (val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`,
        },
      },
    },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, fontFamily: 'Inter, sans-serif' }}>
      {/* ── BREADCRUMB & HEADER ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Breadcrumb path */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#6B7280' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#2563EB',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Retailers
          </button>
          <ChevronRight size={13} style={{ color: '#9CA3AF' }} />
          <span style={{ fontWeight: 600, color: '#111827' }}>{retailer.businessName || retailer.name}</span>
        </div>

        {/* Clean Header Bar */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 14,
            padding: '18px 22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={onBack}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                background: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              title="Back to Retailers List"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#111827', margin: 0 }}>
                  {retailer.businessName || retailer.name}
                </h1>
                <Badge status={retailer.status} />
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 2 }}>
                Owner: <strong style={{ color: '#374151' }}>{retailer.name}</strong> {retailer.city ? `• 📍 ${retailer.city}` : ''}
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={openEditModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <Pencil size={14} /> Edit Retailer
            </button>

            <button
              onClick={fetchInsights}
              title="Refresh Insights Data"
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
            </button>

            {/* Secondary Actions Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setActionsOpen((p) => !p)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6B7280',
                  cursor: 'pointer',
                }}
              >
                <MoreVertical size={16} />
              </button>

              {actionsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: 180,
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: 50,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => {
                      setActionsOpen(false)
                      setUnlinkModalOpen(true)
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 14px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#DC2626',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Trash2 size={14} /> Remove Retailer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── RELATIONSHIP SNAPSHOT (5 KPI CARDS) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <StatTile
          label="Total Purchases"
          value={fmt(metrics.totalSpent)}
          subtext={`${metrics.deliveredCount || 0} delivered orders`}
          icon={ShoppingBag}
          accentColor="#2563EB"
        />
        <StatTile
          label="Total Orders"
          value={metrics.totalOrders || 0}
          subtext={`Avg interval: ${purchaseBehavior.avgOrderIntervalDays || 0} days`}
          icon={Receipt}
          accentColor="#2563EB"
        />
        <StatTile
          label="Avg Order Value"
          value={fmt(metrics.averageOrderValue)}
          subtext="Per fulfilled order"
          icon={TrendingUp}
          accentColor="#2563EB"
        />
        <StatTile
          label="Outstanding Credit"
          value={fmt(metrics.outstandingCredit)}
          subtext={`Credit limit: ${fmt(creditOverview.creditLimit)}`}
          icon={CreditCard}
          accentColor={creditOverview.status === 'overdue' ? '#DC2626' : '#2563EB'}
        />
        <StatTile
          label="Last Purchase Date"
          value={formatDate(metrics.lastOrderDate)}
          subtext={metrics.lastOrderDate ? 'Most recent purchase' : 'No purchase history'}
          icon={Calendar}
          accentColor="#2563EB"
        />
      </div>

      {/* ── 2-COLUMN MAIN WORKSPACE LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        {/* LEFT COLUMN: FINANCIALS, TRENDS, PRODUCTS, ORDERS, PAYMENTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {/* FINANCIAL SUMMARY & CREDIT UTILIZATION CARD */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} style={{ color: '#2563EB' }} />
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Financial Summary & Credit Health
                </h3>
              </div>
              <Badge status={creditOverview.status || 'clear'} />
            </div>

            {!creditOverview.hasCredit ? (
              <div style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: '0.8rem', color: '#6B7280' }}>
                No credit account has been set up for this retailer yet. Click <strong>Edit Retailer</strong> above to assign a credit limit.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 3 Metrics Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div style={{ padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10 }}>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600 }}>Outstanding Balance</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: creditOverview.status === 'overdue' ? '#DC2626' : '#111827', marginTop: 2 }}>
                      {fmt(creditOverview.currentDue)}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10 }}>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600 }}>Assigned Credit Limit</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', marginTop: 2 }}>
                      {fmt(creditOverview.creditLimit)}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10 }}>
                    <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600 }}>Available Credit</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2563EB', marginTop: 2 }}>
                      {fmt(creditOverview.availableCredit)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>Credit Limit Utilization</span>
                    <span style={{ fontWeight: 800, color: creditOverview.creditUtilization > 85 ? '#DC2626' : '#2563EB' }}>
                      {creditOverview.creditUtilization}% Used
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, creditOverview.creditUtilization || 0)}%`,
                        background: creditOverview.creditUtilization > 85 ? '#DC2626' : '#2563EB',
                        borderRadius: 999,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PURCHASE ACTIVITY & TREND CHART */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: '0 0 14px' }}>
              Sales & Order Velocity Trend
            </h3>

            {hasOrderHistory ? (
              <div style={{ height: 210, width: '100%' }}>
                <Line data={lineChartData} options={chartOptions} />
              </div>
            ) : (
              <div style={{ padding: '36px 20px', textAlign: 'center', background: '#F8FAFC', border: '1px border-dashed #E5E7EB', borderRadius: 10, color: '#6B7280', fontSize: '0.82rem' }}>
                Not enough order history for a trend yet.
              </div>
            )}
          </div>

          {/* TOP PURCHASED PRODUCTS */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                Top Purchased Products
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600 }}>By Order Volume</span>
            </div>

            {topProducts.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#6B7280', fontSize: '0.82rem' }}>
                No purchase history found for this retailer.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase', fontSize: '0.68rem', color: '#6B7280' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Product Name</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Category</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Units Purchased</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p) => (
                      <tr key={p.productId} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111827' }}>{p.productName}</td>
                        <td style={{ padding: '10px 12px', color: '#6B7280' }}>{p.category || 'General'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>{p.totalQuantity}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#2563EB' }}>{fmt(p.totalSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RECENT ORDERS LIST */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                Recent Orders
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600 }}>Showing last {recentOrders.length} orders</span>
            </div>

            {recentOrders.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#6B7280', fontSize: '0.82rem' }}>
                No orders have been placed by this retailer yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase', fontSize: '0.68rem', color: '#6B7280' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Order #</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Payment Mode</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#2563EB' }}>
                          #{o.orderNumber || o._id.toString().slice(-6)}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#6B7280' }}>{formatDate(o.createdAt)}</td>
                        <td style={{ padding: '10px 12px', textTransform: 'capitalize', color: '#374151' }}>
                          {o.paymentType} • <span style={{ fontWeight: 600, color: '#6B7280' }}>{o.paymentStatus}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <Badge status={o.status} />
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>{fmt(o.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RETAILER IDENTITY, TRUST SCORE, ACTIVITY TIMELINE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {/* RETAILER IDENTITY CARD */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#EFF6FF',
                  border: '2px solid #2563EB',
                  color: '#2563EB',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                  {retailer.businessName || retailer.name}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 2 }}>{retailer.name}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.78rem', color: '#374151', borderTop: '1px solid #E5E7EB', paddingTop: 12 }}>
              {retailer.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={14} style={{ color: '#2563EB', flexShrink: 0 }} /> <span>{retailer.phone}</span>
                </div>
              )}
              {retailer.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} style={{ color: '#2563EB', flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{retailer.email}</span>
                </div>
              )}
              {retailer.city && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={14} style={{ color: '#2563EB', flexShrink: 0 }} /> <span>{retailer.city}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCheck size={14} style={{ color: '#2563EB', flexShrink: 0 }} /> Sales Rep: <strong style={{ color: '#111827' }}>{salesmanName}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={14} style={{ color: '#2563EB', flexShrink: 0 }} /> Member Since: <strong style={{ color: '#111827' }}>{formatDate(retailer.createdAt)}</strong>
              </div>
            </div>
          </div>

          {/* TRUST SCORE & CREDIT INTELLIGENCE */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} style={{ color: '#2563EB' }} />
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.92rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Credit Trust Score
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                {trustScore.tier || 'Good'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#111827' }}>
                {trustScore.score !== undefined ? trustScore.score : 85}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>/ 100</span>
            </div>

            {/* Score Factors List */}
            {trustScore.factors && trustScore.factors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.72rem', color: '#6B7280', borderTop: '1px solid #E5E7EB', paddingTop: 10 }}>
                {trustScore.factors.slice(0, 3).map((factor, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ color: '#2563EB' }}>•</span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                Evaluated based on fulfillment history, credit utilization, and status.
              </div>
            )}
          </div>

          {/* REAL ACTIVITY TIMELINE STREAM */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.92rem', fontWeight: 800, color: '#111827', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={16} style={{ color: '#2563EB' }} /> Activity Stream
            </h3>

            {activityTimeline.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: '#6B7280', fontSize: '0.8rem' }}>
                No recorded activities yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activityTimeline.slice(0, 5).map((evt) => (
                  <div key={evt.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.78rem' }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {evt.type === 'account_created' ? <Store size={13} /> : evt.type === 'order_placed' ? <ShoppingBag size={13} /> : <CreditCard size={13} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{evt.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>{evt.description}</div>
                      <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: 2 }}>{formatDateTime(evt.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── EDIT RETAILER MODAL ── */}
      {editModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 500, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1rem', margin: 0, color: '#111827' }}>Edit Retailer Details</h3>
              <button onClick={() => setEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: '20px' }}>
              {modalError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', marginBottom: 14 }}>
                  {modalError}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Business Name *</label>
                  <input
                    required
                    value={editForm.businessName}
                    onChange={(e) => setEditForm((p) => ({ ...p, businessName: e.target.value }))}
                    className="input"
                    style={{ width: '100%', height: 38, fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Owner Name *</label>
                  <input
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="input"
                    style={{ width: '100%', height: 38, fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Phone</label>
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                      className="input"
                      style={{ width: '100%', height: 38, fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>City</label>
                    <input
                      value={editForm.city}
                      onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                      className="input"
                      style={{ width: '100%', height: 38, fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Account Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                      className="input"
                      style={{ width: '100%', height: 38, fontSize: '0.85rem', background: '#FFF' }}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Credit Limit (₹)</label>
                    <input
                      type="number"
                      value={editForm.creditLimit}
                      onChange={(e) => setEditForm((p) => ({ ...p, creditLimit: e.target.value }))}
                      className="input"
                      style={{ width: '100%', height: 38, fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
                <button type="button" onClick={() => setEditModalOpen(false)} style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={updating} style={{ padding: '8px 18px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UNLINK / REMOVE RETAILER MODAL ── */}
      {unlinkModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Trash2 size={20} />
            </div>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.05rem', margin: '0 0 6px', color: '#111827' }}>
              Remove Retailer Connection?
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{retailer.businessName || retailer.name}</strong> from your wholesale network?
            </p>
            {modalError && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem', marginBottom: 12 }}>{modalError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setUnlinkModalOpen(false)} style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleUnlinkSubmit} disabled={unlinking} style={{ padding: '8px 18px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                {unlinking ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
