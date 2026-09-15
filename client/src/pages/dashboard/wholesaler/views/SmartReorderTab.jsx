import React, { useState, useEffect, useCallback } from 'react'
import {
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Package,
  Store,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { apiClient as api } from '../../../../api/client'

const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const StatusBadge = ({ status }) => {
  const configs = {
    REORDER_DUE: {
      bg: '#FEF2F2',
      color: '#DC2626',
      border: '#FCA5A5',
      icon: AlertCircle,
      label: 'Reorder Due',
    },
    DUE_SOON: {
      bg: '#FFFBEB',
      color: '#D97706',
      border: '#FCD34D',
      icon: Clock,
      label: 'Due Soon',
    },
    NOT_DUE: {
      bg: '#F0FDF4',
      color: '#16A34A',
      border: '#86EFAC',
      icon: CheckCircle2,
      label: 'On Track (Not Due)',
    },
    INSUFFICIENT_DATA: {
      bg: '#F8FAFC',
      color: '#64748B',
      border: '#E2E8F0',
      icon: HelpCircle,
      label: 'Insufficient Data',
    },
  }

  const conf = configs[status] || configs.INSUFFICIENT_DATA
  const Icon = conf.icon

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 999,
        background: conf.bg,
        color: conf.color,
        border: `1px solid ${conf.border}`,
        fontSize: '0.72rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={12} strokeWidth={2.2} />
      {conf.label}
    </span>
  )
}

export default function SmartReorderTab({ onNavigateToOrder }) {
  const [recommendations, setRecommendations] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter state
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const fetchRecommendations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '10')
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter)
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }

      const res = await api(`/analytics/reorder-recommendations?${params.toString()}`)
      if (res && res.success) {
        setRecommendations(res.recommendations || [])
        setPagination(
          res.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          }
        )
      } else {
        setError(res?.message || 'Failed to fetch Smart Reorder recommendations.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading recommendations.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
  }

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Description Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          borderRadius: 14,
          padding: '24px 28px',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FDE047',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h2
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Smart Reorder Recommendations V1
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#C7D2FE', margin: '2px 0 0 0' }}>
              Deterministic predictive engine analyzing historical purchase cycles to suggest optimal reorder timing and quantities.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 12,
          padding: '16px 20px',
          border: '1px solid var(--border)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <form
          onSubmit={handleSearchSubmit}
          style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 280px', maxWidth: 400 }}
        >
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="input"
              placeholder="Search retailer or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 36,
                paddingRight: 12,
                fontSize: '0.85rem',
                height: 38,
                borderRadius: 8,
              }}
            />
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.83rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="REORDER_DUE">Reorder Due</option>
              <option value="DUE_SOON">Due Soon</option>
              <option value="NOT_DUE">On Track (Not Due)</option>
              <option value="INSUFFICIENT_DATA">Insufficient Data</option>
            </select>
          </div>

          <button
            onClick={fetchRecommendations}
            title="Refresh Recommendations"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '0.83rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#DC2626',
            borderRadius: 10,
            padding: '14px 18px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertCircle size={18} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={fetchRecommendations}
            style={{
              background: '#DC2626',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            background: 'var(--surface)',
            borderRadius: 12,
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: '2.5px solid var(--border)',
              borderTopColor: 'var(--blue)',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              marginBottom: 12,
            }}
          />
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Analyzing retailer ordering patterns & intervals...
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && recommendations.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--surface)',
            borderRadius: 12,
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📦</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0' }}>
            No Smart Reorder Recommendations Found
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
            {statusFilter !== 'ALL' || searchQuery
              ? 'Try adjusting your filter or search criteria.'
              : 'As retailers place repeat orders, deterministic reorder intervals will be automatically calculated.'}
          </p>
        </div>
      )}

      {/* Recommendations Cards / Table */}
      {!loading && !error && recommendations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {recommendations.map((rec, idx) => {
            return (
              <div
                key={`${rec.retailer.id}-${rec.product.id}-${idx}`}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  padding: '18px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Top Row: Retailer Name, Status & Stock */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'var(--blue-light)',
                        border: '1px solid var(--blue-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--blue)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    >
                      <Store size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                        {rec.retailer.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
                        {rec.retailer.contactName && <span>Contact: {rec.retailer.contactName}</span>}
                        {rec.retailer.city && <span>• {rec.retailer.city}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status={rec.status} />
                  </div>
                </div>

                {/* Middle Grid: Product Details & Reorder Metrics */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    background: 'var(--bg)',
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Product */}
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Target Product
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
                      {rec.product.name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {rec.product.category} • {fmtCurrency(rec.product.price)} / {rec.product.unit}
                    </div>
                  </div>

                  {/* Purchase Interval */}
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Typical Reorder Interval
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
                      {rec.averageOrderInterval > 0 ? `Every ${rec.averageOrderInterval} days` : 'N/A (< 2 orders)'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Total orders: {rec.totalOrdersCount}
                    </div>
                  </div>

                  {/* Days Since Last Purchase */}
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Last Purchased
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
                      {rec.daysSinceLastPurchase} days ago
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Date: {new Date(rec.lastPurchaseDate).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  {/* Suggested Quantity */}
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Suggested Reorder Quantity
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--blue)', marginTop: 2 }}>
                      {rec.suggestedQuantity} {rec.product.unit}s
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Current Stock: {rec.product.stock} {rec.product.unit}s
                    </div>
                  </div>
                </div>

                {/* Explanation Card */}
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    background: '#F8FAFC',
                    padding: '10px 14px',
                    borderRadius: 8,
                    borderLeft: '3px solid var(--blue)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Sparkles size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                  <span>{rec.explanation}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {!loading && !error && pagination.totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
            padding: '12px 18px',
            borderRadius: 10,
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total recommendations)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPreviousPage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: pagination.hasPreviousPage ? 'var(--text)' : 'var(--text-muted)',
                cursor: pagination.hasPreviousPage ? 'pointer' : 'not-allowed',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <ChevronLeft size={15} /> Previous
            </button>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: pagination.hasNextPage ? 'var(--text)' : 'var(--text-muted)',
                cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
