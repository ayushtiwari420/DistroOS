import React, { useState, useEffect, useCallback } from 'react'
import {
  Boxes,
  Search,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  DollarSign,
  AlertCircle,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Zap,
} from 'lucide-react'
import { apiClient as api } from '../../../../api/client'

const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const RiskBadge = ({ status }) => {
  const configs = {
    STOCKOUT_RISK: {
      bg: '#FEF2F2',
      color: '#DC2626',
      border: '#FCA5A5',
      icon: AlertTriangle,
      label: 'Stockout Risk',
    },
    WATCH: {
      bg: '#FFFBEB',
      color: '#D97706',
      border: '#FCD34D',
      icon: Clock,
      label: 'Watch',
    },
    SAFE: {
      bg: '#F0FDF4',
      color: '#16A34A',
      border: '#86EFAC',
      icon: CheckCircle2,
      label: 'Safe Stock',
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
        padding: '3px 9px',
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

const MovementBadge = ({ status }) => {
  const configs = {
    FAST_MOVING: {
      bg: '#EFF6FF',
      color: '#2563EB',
      border: '#BFDBFE',
      icon: TrendingUp,
      label: 'Fast Moving',
    },
    NORMAL: {
      bg: '#F8FAFC',
      color: '#475569',
      border: '#CBD5E1',
      icon: Zap,
      label: 'Normal',
    },
    SLOW_MOVING: {
      bg: '#FFF7ED',
      color: '#C2410C',
      border: '#FFEDD5',
      icon: TrendingDown,
      label: 'Slow Moving',
    },
    NO_RECENT_SALES: {
      bg: '#F1F5F9',
      color: '#64748B',
      border: '#E2E8F0',
      icon: Clock,
      label: 'No Recent Sales',
    },
  }

  const conf = configs[status] || configs.NORMAL
  const Icon = conf.icon

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 6,
        background: conf.bg,
        color: conf.color,
        border: `1px solid ${conf.border}`,
        fontSize: '0.7rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={11} strokeWidth={2} />
      {conf.label}
    </span>
  )
}

export default function InventoryIntelligenceTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('risk')
  const [page, setPage] = useState(1)

  // Selected item modal drawer
  const [selectedItem, setSelectedItem] = useState(null)

  const fetchIntelligence = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '10')
      params.set('sort', sortBy)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await api(`/analytics/inventory-intelligence?${params.toString()}`)
      if (res && res.success) {
        setData(res)
      } else {
        setError(res?.message || 'Failed to fetch Inventory Intelligence data.')
      }
    } catch (err) {
      setError(err.message || 'Error connecting to Inventory Intelligence service.')
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, statusFilter, categoryFilter, searchQuery])

  useEffect(() => {
    fetchIntelligence()
  }, [fetchIntelligence])

  const summary = data?.summary || {}
  const products = data?.products || []
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0, hasNextPage: false, hasPreviousPage: false }

  const categoriesList = Array.from(
    new Set(products.map((p) => p.product?.category).filter(Boolean))
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 14,
          padding: '24px 28px',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8',
            }}
          >
            <Boxes size={22} />
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
              Inventory Intelligence V1
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: '2px 0 0 0' }}>
              Actionable stockout risk evaluation, sales velocity tracking, movement classification, and inventory valuation.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Summary KPI Cards */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 14,
          }}
        >
          {/* Inventory Cost Value vs Potential Sales Value */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Inventory Cost Value
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
              {fmtCurrency(summary.inventoryCostValue)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Potential Sales: <strong style={{ color: 'var(--blue)' }}>{fmtCurrency(summary.potentialSalesValue)}</strong>
            </div>
          </div>

          {/* Low Stock & Out of Stock */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Low Stock & Out of Stock
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: summary.lowStockCount > 0 ? '#DC2626' : 'var(--text)', marginTop: 4 }}>
              {summary.lowStockCount || 0} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>products</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: 4 }}>
              {summary.outOfStockCount || 0} products currently out of stock
            </div>
          </div>

          {/* Movement Classifications */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Movement Dynamics
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
              <div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563EB' }}>{summary.fastMovingCount || 0}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Fast Moving</span>
              </div>
              <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
              <div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#C2410C' }}>{summary.slowMovingCount || 0}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Slow Moving</span>
              </div>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {summary.noRecentSalesCount || 0} products with no 30-day sales
            </div>
          </div>

          {/* Stockout Risk Summary */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Stockout Risk Status
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: summary.stockoutRiskCount > 0 ? '#DC2626' : '#16A34A', marginTop: 4 }}>
              {summary.stockoutRiskCount || 0} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>at risk</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {summary.watchCount || 0} products on watch list • {summary.safeCount || 0} safe
            </div>
          </div>
        </div>
      )}

      {/* Toolbar & Filter Bar */}
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
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
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
            placeholder="Search product name, SKU, category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="STOCKOUT_RISK">Stockout Risk</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="FAST_MOVING">Fast Moving</option>
              <option value="SLOW_MOVING">Slow Moving</option>
              <option value="NO_RECENT_SALES">No Recent Sales</option>
              <option value="WATCH">Watch List</option>
              <option value="SAFE">Safe Stock</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setPage(1)
              }}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <option value="risk">Highest Risk</option>
              <option value="velocity">Sales Velocity</option>
              <option value="value">Inventory Value</option>
              <option value="stock">Stock Quantity</option>
              <option value="name">Product Name</option>
            </select>
          </div>

          <button
            onClick={fetchIntelligence}
            title="Refresh Data"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
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
            onClick={fetchIntelligence}
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

      {/* Loading Spinner */}
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
            Analyzing inventory movement & stockout risks...
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
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
            No Products Found
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
            Try adjusting your search query or filter selection.
          </p>
        </div>
      )}

      {/* Main Actionable Table */}
      {!loading && !error && products.length > 0 && (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Product Details
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Current Stock
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    30-Day Velocity
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Est. Coverage
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Movement & Risk
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Cost / Sales Value
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((item, idx) => {
                  const p = item.product
                  return (
                    <tr
                      key={p.id || idx}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Product Name & SKU */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.88rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                          <span>{p.category}</span>
                          {p.sku && <span>• SKU: {p.sku}</span>}
                        </div>
                      </td>

                      {/* Stock & Low Stock Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: item.stock === 0 ? '#DC2626' : item.isLowStock ? '#D97706' : 'var(--text)' }}>
                          {item.stock} {p.unit}s
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Threshold: {item.lowStockAt}
                        </div>
                      </td>

                      {/* Velocity */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                          {item.dailySalesVelocity} <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500 }}>units/day</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Total 30D: {item.unitsSold30Days} units
                        </div>
                      </td>

                      {/* Est. Coverage */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: item.estimatedDaysOfStock <= 7 ? '#DC2626' : 'var(--text)' }}>
                          {item.estimatedDaysOfStock === 999
                            ? 'N/A (No velocity)'
                            : `${item.estimatedDaysOfStock} days`}
                        </div>
                        {item.lastSaleDate && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Last sale: {new Date(item.lastSaleDate).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Movement & Risk Badges */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <RiskBadge status={item.stockoutRiskStatus} />
                          <MovementBadge status={item.movementStatus} />
                        </div>
                      </td>

                      {/* Cost / Sales Value */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                          Cost: {fmtCurrency(item.inventoryCostValue)}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--blue)', fontWeight: 600 }}>
                          Sales: {fmtCurrency(item.potentialSalesValue)}
                        </div>
                      </td>

                      {/* Actions / Inspect */}
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => setSelectedItem(item)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            background: 'var(--bg)',
                            color: 'var(--blue)',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Info size={13} /> Details
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
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
            Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total items)
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

      {/* Product Detail Modal */}
      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 500,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  {selectedItem.product.name}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Category: {selectedItem.product.category} • Unit: {selectedItem.product.unit}
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <RiskBadge status={selectedItem.stockoutRiskStatus} />
              <MovementBadge status={selectedItem.movementStatus} />
            </div>

            <div
              style={{
                background: 'var(--bg)',
                borderRadius: 10,
                padding: '14px 16px',
                border: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Current Stock
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                  {selectedItem.stock} {selectedItem.product.unit}s
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Low threshold: {selectedItem.lowStockAt}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Daily Velocity
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                  {selectedItem.dailySalesVelocity} units/day
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>30D Total: {selectedItem.unitsSold30Days}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Cost Value
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                  {fmtCurrency(selectedItem.inventoryCostValue)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Unit Cost: {fmtCurrency(selectedItem.product.costPrice)}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Potential Sales
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--blue)', marginTop: 2 }}>
                  {fmtCurrency(selectedItem.potentialSalesValue)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Unit Price: {fmtCurrency(selectedItem.product.price)}</div>
              </div>
            </div>

            {/* Explanation card */}
            <div
              style={{
                fontSize: '0.83rem',
                color: 'var(--text)',
                background: '#F8FAFC',
                padding: '12px 16px',
                borderRadius: 8,
                borderLeft: '3px solid var(--blue)',
                lineHeight: 1.4,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--blue)' }}>Deterministic Calculation Note</div>
              {selectedItem.explanation}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
