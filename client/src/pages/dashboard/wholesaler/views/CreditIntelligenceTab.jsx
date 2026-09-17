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
  ShieldAlert,
  Edit2,
  Receipt,
  ExternalLink,
  ShieldCheck,
  Building2,
  Store
} from 'lucide-react'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, TablePagination } from '../../../../components/ui/Table'
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../../../components/ui/Modal'
import { SkeletonTable, SkeletonCard } from '../../../../components/ui/Skeleton'
import EmptyState from '../../../../components/ui/EmptyState'
import * as svc from '../../../../services/wholesaler.service'
import RetailerDetailView from './RetailerDetailView'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const formatDate = (dateStr) => {
  if (!dateStr) return 'No payments yet'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return 'No payments yet'
  }
}

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
      bg: '#EFF6FF',
      color: '#2563EB',
      border: '#BFDBFE',
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

export default function CreditIntelligenceTab({ onNavigateRetailer }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [selectedRetailerId, setSelectedRetailerId] = useState(null)

  // Search & Filter State
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('outstanding')
  const [page, setPage] = useState(1)
  const limit = 10

  // Repayment Modal State
  const [repayModalOpen, setRepayModalOpen] = useState(false)
  const [selectedRepayAccount, setSelectedRepayAccount] = useState(null)
  const [repayAmount, setRepayAmount] = useState('')
  const [repayNote, setRepayNote] = useState('')
  const [submittingRepay, setSubmittingRepay] = useState(false)
  const [repayError, setRepayError] = useState(null)

  // Credit Limit Adjustment Modal State
  const [limitModalOpen, setLimitModalOpen] = useState(false)
  const [selectedLimitAccount, setSelectedLimitAccount] = useState(null)
  const [newCreditLimit, setNewCreditLimit] = useState('')
  const [submittingLimit, setSubmittingLimit] = useState(false)
  const [limitError, setLimitError] = useState(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch Credit Intelligence data from backend
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      if (debouncedSearch) queryParams.set('search', debouncedSearch)
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter)
      if (sortBy) queryParams.set('sortBy', sortBy)
      queryParams.set('page', String(page))
      queryParams.set('limit', String(limit))

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''
      const res = await svc.getCreditIntelligence(queryString)
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load credit intelligence platform data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [debouncedSearch, statusFilter, sortBy, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handlers for Repayment Modal
  const openRepayModal = (account) => {
    setSelectedRepayAccount(account)
    setRepayAmount(account.outstanding ? String(account.outstanding) : '')
    setRepayNote('')
    setRepayError(null)
    setRepayModalOpen(true)
  }

  const handleRepaySubmit = async (e) => {
    e.preventDefault()
    setRepayError(null)

    const amtNum = Number(repayAmount)
    if (!amtNum || amtNum <= 0) {
      setRepayError('Please enter a valid repayment amount greater than zero.')
      return
    }

    if (!selectedRepayAccount || !selectedRepayAccount.retailer?.id) {
      setRepayError('Invalid retailer account selected.')
      return
    }

    setSubmittingRepay(true)
    try {
      await svc.recordRepayment(selectedRepayAccount.retailer.id, amtNum, repayNote.trim())
      setRepayModalOpen(false)
      loadData(true)
    } catch (err) {
      setRepayError(err.message || 'Failed to record repayment.')
    } finally {
      setSubmittingRepay(false)
    }
  }

  // Handlers for Credit Limit Modal
  const openLimitModal = (account) => {
    setSelectedLimitAccount(account)
    setNewCreditLimit(String(account.creditLimit || 0))
    setLimitError(null)
    setLimitModalOpen(true)
  }

  const handleLimitSubmit = async (e) => {
    e.preventDefault()
    setLimitError(null)

    const limitNum = Number(newCreditLimit)
    if (isNaN(limitNum) || limitNum < 0) {
      setLimitError('Please enter a valid non-negative credit limit.')
      return
    }

    if (!selectedLimitAccount || !selectedLimitAccount.retailer?.id) {
      setLimitError('Invalid retailer account selected.')
      return
    }

    setSubmittingLimit(true)
    try {
      await svc.updateCreditLimit(selectedLimitAccount.retailer.id, limitNum)
      setLimitModalOpen(false)
      loadData(true)
    } catch (err) {
      setLimitError(err.message || 'Failed to update credit limit.')
    } finally {
      setSubmittingLimit(false)
    }
  }

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setStatusFilter('ALL')
    setSortBy('outstanding')
    setPage(1)
  }

  // If a retailer is selected for drill-down, render RetailerDetailView
  if (selectedRetailerId) {
    return (
      <RetailerDetailView
        retailerId={selectedRetailerId}
        onBack={() => setSelectedRetailerId(null)}
      />
    )
  }

  const handleRetailerClick = (retailerId) => {
    if (onNavigateRetailer) {
      onNavigateRetailer(retailerId)
    } else {
      setSelectedRetailerId(retailerId)
    }
  }

  const summary = data?.summary || {
    totalCreditAccounts: 0,
    totalCreditExposure: 0,
    totalOutstanding: 0,
    totalAvailableCredit: 0,
    totalOverdue: 0,
    averageCreditUtilization: 0,
    retailersWithCredit: 0,
    retailersOverdue: 0,
    highExposureAccounts: 0,
  }

  const accounts = data?.accounts || []
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* PAGE HEADER */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          background: '#FFFFFF',
          padding: '18px 22px',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Manrope, Inter, sans-serif',
              fontWeight: 700,
              fontSize: '1.25rem',
              color: '#111827',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Credit Management
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: '0.8125rem', color: '#6B7280' }}>
            Monitor retailer credit exposure, outstanding balances, and payment behavior.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            icon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
          >
            Refresh Platform
          </Button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            color: '#991B1B',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, color: '#DC2626' }} />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadData(true)}>
            Try Again
          </Button>
        </div>
      )}

      {/* CREDIT OVERVIEW SUMMARY METRICS */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {/* Total Outstanding */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <CardContent style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Outstanding
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} style={{ color: '#2563EB' }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563EB', fontFamily: 'Manrope, Inter, sans-serif' }}>
                  {fmt(summary.totalOutstanding)}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                Active balances across {summary.totalCreditAccounts} accounts
              </div>
            </CardContent>
          </Card>

          {/* Total Credit Exposure */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <CardContent style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Credit Exposure
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={18} style={{ color: '#2563EB' }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', fontFamily: 'Manrope, Inter, sans-serif' }}>
                  {fmt(summary.totalCreditExposure)}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                Combined assigned limits
              </div>
            </CardContent>
          </Card>

          {/* Available Credit */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <CardContent style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Available Credit
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} style={{ color: '#16A34A' }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', fontFamily: 'Manrope, Inter, sans-serif' }}>
                  {fmt(summary.totalAvailableCredit)}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                Unused credit purchasing power
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Utilization */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <CardContent style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Credit Utilization
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={18} style={{ color: '#2563EB' }} />
                </div>
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', fontFamily: 'Manrope, Inter, sans-serif' }}>
                  {summary.averageCreditUtilization}%
                </span>
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>portfolio avg</span>
              </div>
              {/* Utilization Progress Bar */}
              <div style={{ width: '100%', height: 6, background: '#E5E7EB', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, summary.averageCreditUtilization)}%`,
                    background: summary.averageCreditUtilization >= 85 ? '#C2410C' : '#2563EB',
                    borderRadius: 999,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Overdue Exposure (Calm treatment when zero) */}
          <Card
            style={{
              background: '#FFFFFF',
              border: `1px solid ${summary.totalOverdue > 0 ? '#FCA5A5' : '#E5E7EB'}`,
              borderRadius: 12,
            }}
          >
            <CardContent style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Overdue Amount
                </span>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: summary.totalOverdue > 0 ? '#FEF2F2' : '#F0FDF4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={18} style={{ color: summary.totalOverdue > 0 ? '#DC2626' : '#16A34A' }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: summary.totalOverdue > 0 ? '#DC2626' : '#111827',
                    fontFamily: 'Manrope, Inter, sans-serif',
                  }}
                >
                  {fmt(summary.totalOverdue)}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: summary.totalOverdue > 0 ? '#DC2626' : '#6B7280', marginTop: 4 }}>
                {summary.totalOverdue > 0
                  ? `${summary.retailersOverdue} account${summary.retailersOverdue > 1 ? 's' : ''} past due`
                  : 'Portfolio healthy — 0 overdue'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SEARCH + FILTERS */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
          {/* Search */}
          <div style={{ position: 'relative', width: 260, maxWidth: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search retailer name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 34,
                paddingRight: search ? 30 : 12,
                height: 38,
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                fontSize: '0.8125rem',
                outline: 'none',
                background: '#FFFFFF',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 2 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Classification Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            style={{
              height: 38,
              borderRadius: 8,
              border: '1px solid #D1D5DB',
              padding: '0 12px',
              fontSize: '0.8125rem',
              color: '#374151',
              background: '#FFFFFF',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">All Classifications</option>
            <option value="HEALTHY">Healthy</option>
            <option value="WATCH">Watch List</option>
            <option value="HIGH_EXPOSURE">High Exposure</option>
            <option value="OVERDUE">Overdue Accounts</option>
            <option value="INSUFFICIENT_DATA">Insufficient Data</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              setPage(1)
            }}
            style={{
              height: 38,
              borderRadius: 8,
              border: '1px solid #D1D5DB',
              padding: '0 12px',
              fontSize: '0.8125rem',
              color: '#374151',
              background: '#FFFFFF',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="outstanding">Sort: Outstanding (High to Low)</option>
            <option value="utilization">Sort: Utilization (High to Low)</option>
            <option value="overdue">Sort: Overdue (High to Low)</option>
            <option value="limit">Sort: Credit Limit (High to Low)</option>
            <option value="consistency">Sort: Payment Consistency</option>
            <option value="name">Sort: Retailer Name (A - Z)</option>
          </select>

          {(search || statusFilter !== 'ALL' || sortBy !== 'outstanding') && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} icon={<X size={14} />}>
              Reset Filters
            </Button>
          )}
        </div>

        <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500 }}>
          Showing <strong>{accounts.length}</strong> of {pagination.total} accounts
        </div>
      </div>

      {/* CREDIT ACCOUNTS TABLE */}
      {loading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : accounts.length === 0 ? (
        <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
          <CardContent style={{ padding: '48px 24px' }}>
            <EmptyState
              icon={CreditCard}
              title={search || statusFilter !== 'ALL' ? 'No credit accounts match your filter' : 'No credit accounts found'}
              description={
                search || statusFilter !== 'ALL'
                  ? 'Try adjusting your search query or credit classification filters.'
                  : 'Link retailers or assign credit limits to manage credit exposure.'
              }
              action={
                search || statusFilter !== 'ALL' ? (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                ) : null
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          {/* Desktop Table View */}
          <div className="hidden md:block" style={{ overflowX: 'auto' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Retailer
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Credit Limit
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Outstanding
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Available
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Utilization
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Classification
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Last Payment
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase', textAlign: 'right' }}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((acc) => {
                  const r = acc.retailer || {}
                  const util = acc.creditUtilization || 0
                  return (
                    <TableRow key={r.id || Math.random()} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      {/* Retailer */}
                      <TableCell style={{ padding: '14px 18px' }}>
                        <div>
                          <button
                            onClick={() => handleRetailerClick(r.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              fontWeight: 600,
                              color: '#111827',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {r.name}
                            <ExternalLink size={12} style={{ color: '#9CA3AF' }} />
                          </button>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                            {r.city ? `${r.city} • ` : ''}{r.phone || r.email || ''}
                          </div>
                        </div>
                      </TableCell>

                      {/* Credit Limit */}
                      <TableCell style={{ padding: '14px 18px', fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                        {fmt(acc.creditLimit)}
                      </TableCell>

                      {/* Outstanding */}
                      <TableCell style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: acc.overdueAmount > 0 ? '#DC2626' : '#2563EB', fontSize: '0.875rem' }}>
                          {fmt(acc.outstanding)}
                        </div>
                        {acc.overdueAmount > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 600 }}>
                            Overdue: {fmt(acc.overdueAmount)}
                          </div>
                        )}
                      </TableCell>

                      {/* Available Credit */}
                      <TableCell style={{ padding: '14px 18px', fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>
                        {fmt(acc.availableCredit)}
                      </TableCell>

                      {/* Utilization */}
                      <TableCell style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 110 }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: util >= 85 ? '#C2410C' : '#374151' }}>
                            {util}%
                          </span>
                          <div style={{ width: '100%', height: 5, background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(100, util)}%`,
                                background: util >= 85 ? '#C2410C' : util >= 60 ? '#D97706' : '#2563EB',
                                borderRadius: 999,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Classification */}
                      <TableCell style={{ padding: '14px 18px' }}>
                        <HealthBadge status={acc.creditHealthStatus} />
                      </TableCell>

                      {/* Last Payment */}
                      <TableCell style={{ padding: '14px 18px', fontSize: '0.78125rem', color: '#6B7280' }}>
                        {formatDate(acc.paymentBehavior?.lastPaymentDate)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRepayModal(acc)}
                            icon={<Receipt size={13} />}
                            title="Record Repayment"
                          >
                            Repay
                          </Button>

                          <button
                            onClick={() => openLimitModal(acc)}
                            title="Adjust Credit Limit"
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid #E5E7EB',
                              background: '#FFFFFF',
                              color: '#374151',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="block md:hidden" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accounts.map((acc) => {
              const r = acc.retailer || {}
              const util = acc.creditUtilization || 0
              return (
                <div
                  key={r.id || Math.random()}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <button
                        onClick={() => handleRetailerClick(r.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontWeight: 700,
                          fontSize: '0.9375rem',
                          color: '#111827',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {r.name}
                      </button>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>{r.city}</div>
                    </div>
                    <HealthBadge status={acc.creditHealthStatus} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase' }}>Outstanding</div>
                      <div style={{ fontWeight: 700, color: acc.overdueAmount > 0 ? '#DC2626' : '#2563EB', fontSize: '0.9375rem' }}>
                        {fmt(acc.outstanding)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase' }}>Credit Limit</div>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>{fmt(acc.creditLimit)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78125rem' }}>
                    <span style={{ color: '#6B7280' }}>Utilization: <strong>{util}%</strong></span>
                    <span style={{ color: '#6B7280' }}>Available: <strong>{fmt(acc.availableCredit)}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                    <Button variant="outline" size="sm" onClick={() => openRepayModal(acc)} icon={<Receipt size={13} />}>
                      Record Repayment
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openLimitModal(acc)} icon={<Edit2 size={13} />}>
                      Limit
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Table Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid #E5E7EB', background: '#F8FAFC' }}>
              <TablePagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </Card>
      )}

      {/* MODAL: RECORD REPAYMENT */}
      <Modal open={repayModalOpen} onClose={() => setRepayModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>Record Credit Repayment</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleRepaySubmit}>
          <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {repayError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 14px', borderRadius: 8, color: '#991B1B', fontSize: '0.8125rem' }}>
                {repayError}
              </div>
            )}

            {selectedRepayAccount && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                  {selectedRepayAccount.retailer?.name}
                </div>
                <div style={{ fontSize: '0.78125rem', color: '#6B7280', marginTop: 2 }}>
                  Current Outstanding Balance:{' '}
                  <strong style={{ color: '#2563EB' }}>{fmt(selectedRepayAccount.outstanding)}</strong>
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Repayment Amount (₹) <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Payment Note / Reference
              </label>
              <Input
                placeholder="e.g. UPI transfer, Check #1042"
                value={repayNote}
                onChange={(e) => setRepayNote(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => setRepayModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submittingRepay}>
              {submittingRepay ? 'Recording...' : 'Confirm Repayment'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL: ADJUST CREDIT LIMIT */}
      <Modal open={limitModalOpen} onClose={() => setLimitModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>Adjust Credit Limit</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleLimitSubmit}>
          <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {limitError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 14px', borderRadius: 8, color: '#991B1B', fontSize: '0.8125rem' }}>
                {limitError}
              </div>
            )}

            {selectedLimitAccount && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                  {selectedLimitAccount.retailer?.name}
                </div>
                <div style={{ fontSize: '0.78125rem', color: '#6B7280', marginTop: 2 }}>
                  Current Credit Limit: <strong>{fmt(selectedLimitAccount.creditLimit)}</strong>
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                New Credit Limit (₹) <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <Input
                type="number"
                placeholder="e.g. 50000"
                value={newCreditLimit}
                onChange={(e) => setNewCreditLimit(e.target.value)}
                required
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => setLimitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submittingLimit}>
              {submittingLimit ? 'Updating...' : 'Update Credit Limit'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
