import React, { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  TrendingUp,
  DollarSign,
  AlertCircle,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Plus,
  ArrowUpRight,
} from 'lucide-react'
import { apiClient as api } from '../../../../api/client'

const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const HealthBadge = ({ status }) => {
  const configs = {
    OVERDUE: {
      bg: '#FEF2F2',
      color: '#DC2626',
      border: '#FCA5A5',
      icon: AlertTriangle,
      label: 'Overdue',
    },
    HIGH_EXPOSURE: {
      bg: '#FFF7ED',
      color: '#C2410C',
      border: '#FFEDD5',
      icon: TrendingUp,
      label: 'High Exposure',
    },
    WATCH: {
      bg: '#FFFBEB',
      color: '#D97706',
      border: '#FCD34D',
      icon: Clock,
      label: 'Watch List',
    },
    HEALTHY: {
      bg: '#F0FDF4',
      color: '#16A34A',
      border: '#86EFAC',
      icon: CheckCircle2,
      label: 'Healthy',
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

export default function CreditIntelligenceTab({ onOpenRepayModal }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('outstanding')
  const [page, setPage] = useState(1)

  // Selected Account Modal
  const [selectedAccount, setSelectedAccount] = useState(null)

  const fetchCreditIntelligence = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '10')
      params.set('sort', sortBy)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await api(`/analytics/credit-intelligence?${params.toString()}`)
      if (res && res.success) {
        setData(res)
      } else {
        setError(res?.message || 'Failed to load Credit Intelligence data.')
      }
    } catch (err) {
      setError(err.message || 'Error fetching Credit Intelligence analytics.')
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, statusFilter, searchQuery])

  useEffect(() => {
    fetchCreditIntelligence()
  }, [fetchCreditIntelligence])

  const summary = data?.summary || {}
  const accounts = data?.accounts || []
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0, hasNextPage: false, hasPreviousPage: false }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
          borderRadius: 14,
          padding: '24px 28px',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.4)',
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
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <CreditCard size={22} />
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
              Credit Intelligence Platform V1
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#E0F2FE', margin: '2px 0 0 0' }}>
              Actionable credit exposure monitoring, payment consistency metrics, overdue balances, and risk classifications.
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Overview Cards */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 14,
          }}
        >
          {/* Total Outstanding & Exposure */}
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
              Total Outstanding Due
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
              {fmtCurrency(summary.totalOutstanding)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Total Exposure Limit: <strong style={{ color: 'var(--blue)' }}>{fmtCurrency(summary.totalCreditExposure)}</strong>
            </div>
          </div>

          {/* Overdue Amount */}
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
              Total Overdue Balance
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: summary.totalOverdue > 0 ? '#DC2626' : '#16A34A', marginTop: 4 }}>
              {fmtCurrency(summary.totalOverdue)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: 4 }}>
              {summary.retailersOverdue || 0} retailers currently overdue
            </div>
          </div>

          {/* High Exposure Accounts */}
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
              High Exposure Accounts
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: summary.highExposureAccounts > 0 ? '#C2410C' : 'var(--text)', marginTop: 4 }}>
              {summary.highExposureAccounts || 0} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>accounts</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Accounts with $\ge$85% credit limit utilization
            </div>
          </div>

          {/* Average Payment Consistency */}
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
              Network Payment Consistency
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: summary.averagePaymentConsistency >= 80 ? '#16A34A' : '#D97706', marginTop: 4 }}>
              {summary.averagePaymentConsistency !== null ? `${summary.averagePaymentConsistency}%` : 'N/A'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Across {summary.retailersWithCredit || 0} active credit accounts
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
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
            placeholder="Search retailer name, contact, city..."
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
              <option value="ALL">All Accounts</option>
              <option value="OVERDUE">Overdue Accounts</option>
              <option value="HIGH_EXPOSURE">High Exposure ($\ge$85%)</option>
              <option value="WATCH">Watch List ($\ge$60%)</option>
              <option value="HEALTHY">Healthy</option>
              <option value="INSUFFICIENT_DATA">Insufficient Data</option>
            </select>
          </div>

          {/* Sort Selector */}
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
              <option value="outstanding">Highest Outstanding</option>
              <option value="utilization">Utilization %</option>
              <option value="overdue">Overdue Balance</option>
              <option value="consistency">Payment Consistency</option>
              <option value="limit">Credit Limit</option>
              <option value="name">Retailer Name</option>
            </select>
          </div>

          <button
            onClick={fetchCreditIntelligence}
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
            onClick={fetchCreditIntelligence}
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
            Analyzing credit exposure & payment consistency...
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && accounts.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--surface)',
            borderRadius: 12,
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>💳</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0' }}>
            No Credit Accounts Found
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
            Try adjusting your search query or status filter.
          </p>
        </div>
      )}

      {/* Accounts Table */}
      {!loading && !error && accounts.length > 0 && (
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
                    Retailer
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Credit Limit
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Outstanding & Utilization
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Overdue Balance
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Payment Consistency
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Account Health
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc, idx) => {
                  const r = acc.retailer
                  return (
                    <tr
                      key={r.id || idx}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Retailer Info */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.88rem' }}>{r.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                          {r.contactName && <span>{r.contactName}</span>}
                          {r.city && <span>• {r.city}</span>}
                        </div>
                      </td>

                      {/* Credit Limit */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>{fmtCurrency(acc.creditLimit)}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Available: {fmtCurrency(acc.availableCredit)}
                        </div>
                      </td>

                      {/* Outstanding & Utilization Progress Bar */}
                      <td style={{ padding: '14px 16px', minWidth: 160 }}>
                        <div style={{ fontWeight: 800, color: acc.creditUtilization >= 85 ? '#C2410C' : 'var(--text)' }}>
                          {fmtCurrency(acc.outstanding)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <div
                            style={{
                              flex: 1,
                              height: 6,
                              borderRadius: 999,
                              background: 'var(--bg)',
                              overflow: 'hidden',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, acc.creditUtilization)}%`,
                                height: '100%',
                                background: acc.creditUtilization >= 85 ? '#DC2626' : acc.creditUtilization >= 60 ? '#D97706' : '#16A34A',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', width: 36, textAlign: 'right' }}>
                            {acc.creditUtilization}%
                          </span>
                        </div>
                      </td>

                      {/* Overdue */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: acc.overdueAmount > 0 ? '#DC2626' : 'var(--text)' }}>
                          {acc.overdueAmount > 0 ? fmtCurrency(acc.overdueAmount) : '₹0'}
                        </div>
                        {acc.overdueAmount > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 500 }}>
                            {acc.overduePercentage}% of due
                          </div>
                        )}
                      </td>

                      {/* Payment Consistency */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                          {acc.paymentConsistency !== null ? `${acc.paymentConsistency}%` : 'N/A (<2 pmts)'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {acc.paymentBehavior.repaymentCount} repayments
                        </div>
                      </td>

                      {/* Health Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <HealthBadge status={acc.creditHealthStatus} />
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => setSelectedAccount(acc)}
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
            Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total credit accounts)
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

      {/* Retailer Detail Modal */}
      {selectedAccount && (
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
              maxWidth: 520,
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
                  {selectedAccount.retailer.name}
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {selectedAccount.retailer.city} • Contact: {selectedAccount.retailer.contactName}
                </div>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <HealthBadge status={selectedAccount.creditHealthStatus} />
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
                  Credit Limit
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                  {fmtCurrency(selectedAccount.creditLimit)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Outstanding Due
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: selectedAccount.outstanding > 0 ? '#C2410C' : 'var(--text)', marginTop: 2 }}>
                  {fmtCurrency(selectedAccount.outstanding)} ({selectedAccount.creditUtilization}%)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Overdue Balance
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: selectedAccount.overdueAmount > 0 ? '#DC2626' : '#16A34A', marginTop: 2 }}>
                  {fmtCurrency(selectedAccount.overdueAmount)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Payment Consistency
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--blue)', marginTop: 2 }}>
                  {selectedAccount.paymentConsistency !== null ? `${selectedAccount.paymentConsistency}%` : 'INSUFFICIENT_DATA'}
                </div>
              </div>
            </div>

            {/* Explanation Note */}
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
              <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--blue)' }}>Deterministic Credit Assessment</div>
              {selectedAccount.explanation}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedAccount(null)}
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
