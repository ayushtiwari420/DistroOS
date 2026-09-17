import React, { useState, useEffect, useCallback } from 'react'
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  User,
  Building2,
  Store,
  ExternalLink,
  Eye,
  X,
  FileText
} from 'lucide-react'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, TablePagination } from '../../../../components/ui/Table'
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../../../components/ui/Modal'
import { SkeletonTable, SkeletonCard } from '../../../../components/ui/Skeleton'
import EmptyState from '../../../../components/ui/EmptyState'
import Badge from '../../../../components/ui/Badges'
import * as svc from '../../../../services/wholesaler.service'
import RetailerDetailView from './RetailerDetailView'
import OrderDetailView from './OrderDetailView'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'N/A'
  }
}

export default function PaymentsTab({ onNavigateRetailer, onNavigateOrder }) {
  const [creditAccounts, setCreditAccounts] = useState([])
  const [summaryData, setSummaryData] = useState(null)
  const [paymentTransactions, setPaymentTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Navigation Drill-Down States
  const [selectedRetailerId, setSelectedRetailerId] = useState(null)
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  // Filter & Search Controls
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL') // 'ALL' | 'CREDIT' (Repayments) | 'DEBIT' (Credit Sales)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  // Record Payment Modal State
  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [selectedRetailerIdForRepay, setSelectedRetailerIdForRepay] = useState('')
  const [repayAmount, setRepayAmount] = useState('')
  const [repayNote, setRepayNote] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [successToast, setSuccessToast] = useState(null)

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState(null)

  // Fetch all payment transactions across retailer credit accounts
  const loadPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      // Fetch credit intelligence summary and all retailer credit records
      const intelRes = await svc.getCreditIntelligence('?limit=100')
      const allCreditRes = await svc.getAllCredit()

      const accounts = intelRes?.accounts || []
      setSummaryData(intelRes?.summary || null)
      setCreditAccounts(accounts)

      // Fetch transaction histories for accounts with transaction activity
      const txPromises = accounts.map(async (acc) => {
        if (!acc.retailer?.id) return []
        try {
          const rCredit = await svc.getRetailerCredit(acc.retailer.id)
          const txs = rCredit.transactions || []
          return txs.map((t) => ({
            ...t,
            retailer: acc.retailer,
            accountStatus: acc.creditHealthStatus,
            currentDue: acc.outstanding,
          }))
        } catch {
          return []
        }
      })

      const txResults = await Promise.all(txPromises)
      const mergedTxs = txResults.flat()

      // Sort by newest date by default
      mergedTxs.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
      setPaymentTransactions(mergedTxs)
    } catch (err) {
      setError(err.message || 'Failed to load payment transactions. Please check your network connection.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  // Open Record Payment Modal
  const openRecordModal = (preselectedAccount = null) => {
    setModalError(null)
    if (preselectedAccount) {
      setSelectedRetailerIdForRepay(preselectedAccount.retailer?.id || preselectedAccount.id || '')
      setRepayAmount(preselectedAccount.outstanding ? String(preselectedAccount.outstanding) : '')
    } else {
      setSelectedRetailerIdForRepay('')
      setRepayAmount('')
    }
    setRepayNote('')
    setRecordModalOpen(true)
  }

  // Submit Payment Repayment
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault()
    setModalError(null)

    if (!selectedRetailerIdForRepay) {
      setModalError('Please select a retailer account for payment.')
      return
    }

    const amt = Number(repayAmount)
    if (!amt || amt <= 0) {
      setModalError('Payment amount must be a positive number greater than zero.')
      return
    }

    // Find account to validate against current due
    const targetAcc = creditAccounts.find((a) => a.retailer?.id === selectedRetailerIdForRepay)
    if (targetAcc && amt > targetAcc.outstanding) {
      setModalError(`Payment amount (₹${amt.toLocaleString('en-IN')}) cannot exceed current outstanding due (₹${targetAcc.outstanding.toLocaleString('en-IN')}).`)
      return
    }

    setSubmittingPayment(true)
    try {
      await svc.recordRepayment(selectedRetailerIdForRepay, amt, repayNote.trim())
      setRecordModalOpen(false)
      setSuccessToast(`Payment of ₹${amt.toLocaleString('en-IN')} successfully recorded.`)
      setTimeout(() => setSuccessToast(null), 4000)
      loadPayments(true)
    } catch (err) {
      setModalError(err.message || 'Failed to record payment transaction.')
    } finally {
      setSubmittingPayment(false)
    }
  }

  // Filter & Sort Logic
  const filteredTransactions = paymentTransactions.filter((tx) => {
    const q = search.toLowerCase().trim()
    const rName = (tx.retailer?.name || tx.retailer?.contactName || '').toLowerCase()
    const rCity = (tx.retailer?.city || '').toLowerCase()
    const note = (tx.note || '').toLowerCase()
    const txId = (tx._id || '').toLowerCase()

    const matchesSearch = !q || rName.includes(q) || rCity.includes(q) || note.includes(q) || txId.includes(q)

    const isCreditRepayment = tx.type === 'credit'
    const matchesType =
      typeFilter === 'ALL' ||
      (typeFilter === 'CREDIT' && isCreditRepayment) ||
      (typeFilter === 'DEBIT' && !isCreditRepayment)

    return matchesSearch && matchesType
  })

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sort === 'oldest') return new Date(a.date || 0) - new Date(b.date || 0)
    if (sort === 'amount_high') return (b.amount || 0) - (a.amount || 0)
    if (sort === 'amount_low') return (a.amount || 0) - (b.amount || 0)
    return new Date(b.date || 0) - new Date(a.date || 0) // 'newest' default
  })

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage) || 1
  const paginatedTransactions = sortedTransactions.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const handleResetFilters = () => {
    setSearch('')
    setTypeFilter('ALL')
    setSort('newest')
    setPage(1)
  }

  // Handle drill-down navigation
  if (selectedRetailerId) {
    return (
      <RetailerDetailView
        retailerId={selectedRetailerId}
        onBack={() => setSelectedRetailerId(null)}
      />
    )
  }

  if (selectedOrderId) {
    return (
      <OrderDetailView
        orderId={selectedOrderId}
        onBack={() => setSelectedOrderId(null)}
      />
    )
  }

  const handleRetailerClick = (rId) => {
    if (onNavigateRetailer) onNavigateRetailer(rId)
    else setSelectedRetailerId(rId)
  }

  const handleOrderClick = (oId) => {
    if (onNavigateOrder) onNavigateOrder(oId)
    else setSelectedOrderId(oId)
  }

  // Summary Metrics calculations
  const totalCollected = paymentTransactions
    .filter((t) => t.type === 'credit')
    .reduce((acc, t) => acc + (t.amount || 0), 0)

  const activeAccountsCount = creditAccounts.filter((a) => a.outstanding > 0 || (a.paymentBehavior?.repaymentCount || 0) > 0).length
  const totalOutstanding = summaryData?.totalOutstanding || 0
  const totalOverdue = summaryData?.totalOverdue || 0

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
            Payments
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: '0.8125rem', color: '#6B7280' }}>
            Track retailer payments and payment activity across your business.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPayments(true)}
            disabled={refreshing || loading}
            icon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => openRecordModal()} icon={<Plus size={15} />}>
            Record Payment
          </Button>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {successToast && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: 10,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#15803D',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
          <span>{successToast}</span>
        </div>
      )}

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
          <Button variant="outline" size="sm" onClick={() => loadPayments(true)}>
            Try Again
          </Button>
        </div>
      )}

      {/* SUMMARY METRICS */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {/* Total Collected */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <CardContent style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Payments Collected
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={18} style={{ color: '#2563EB' }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563EB', fontFamily: 'Manrope, Inter, sans-serif' }}>
                  {fmt(totalCollected)}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                Total repayments processed
              </div>
            </CardContent>
          </Card>

          {/* Active Payment Accounts */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <CardContent style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Credit Accounts
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={18} style={{ color: '#2563EB' }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', fontFamily: 'Manrope, Inter, sans-serif' }}>
                  {activeAccountsCount}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                Retailers with active credit profile
              </div>
            </CardContent>
          </Card>

          {/* Outstanding Balance */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <CardContent style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Outstanding Credit
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} style={{ color: '#2563EB' }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', fontFamily: 'Manrope, Inter, sans-serif' }}>
                  {fmt(totalOutstanding)}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                Current outstanding receivables
              </div>
            </CardContent>
          </Card>

          {/* Overdue Amount (Calm healthy treatment when 0) */}
          <Card style={{ background: '#FFFFFF', border: `1px solid ${totalOverdue > 0 ? '#FCA5A5' : '#E5E7EB'}`, borderRadius: 12 }}>
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
                    background: totalOverdue > 0 ? '#FEF2F2' : '#F0FDF4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={18} style={{ color: totalOverdue > 0 ? '#DC2626' : '#16A34A' }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: totalOverdue > 0 ? '#DC2626' : '#111827', fontFamily: 'Manrope, Inter, sans-serif' }}>
                  {fmt(totalOverdue)}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: totalOverdue > 0 ? '#DC2626' : '#6B7280', marginTop: 4 }}>
                {totalOverdue > 0 ? 'Past due payments require follow-up' : 'All accounts within agreed terms'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SEARCH + FILTER CONTROLS */}
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
              placeholder="Search retailer, reference, note..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
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

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
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
            <option value="ALL">All Transaction Types</option>
            <option value="CREDIT">Repayments (Collections)</option>
            <option value="DEBIT">Credit Sales (Debits)</option>
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
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
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="amount_high">Sort: Amount (High to Low)</option>
            <option value="amount_low">Sort: Amount (Low to High)</option>
          </select>

          {(search || typeFilter !== 'ALL' || sort !== 'newest') && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} icon={<X size={14} />}>
              Reset Filters
            </Button>
          )}
        </div>

        <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500 }}>
          Showing <strong>{filteredTransactions.length}</strong> of {paymentTransactions.length} payment records
        </div>
      </div>

      {/* PAYMENT TRANSACTIONS TABLE */}
      {loading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : sortedTransactions.length === 0 ? (
        <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
          <CardContent style={{ padding: '48px 24px' }}>
            <EmptyState
              icon={Receipt}
              title={search || typeFilter !== 'ALL' ? 'No payment records match your search' : 'No payment records found'}
              description={
                search || typeFilter !== 'ALL'
                  ? 'Try adjusting your search query or transaction filters.'
                  : 'Record payments from retailers to track collections and maintain up-to-date credit balances.'
              }
              action={
                search || typeFilter !== 'ALL' ? (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => openRecordModal()} icon={<Plus size={15} />}>
                    Record First Payment
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          {/* Desktop Table */}
          <div className="hidden md:block" style={{ overflowX: 'auto' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ background: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Type & Reference
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Retailer
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Amount
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Date & Time
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Note / Reference
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Status
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase', textAlign: 'right' }}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((tx) => {
                  const isRepayment = tx.type === 'credit'
                  const r = tx.retailer || {}
                  return (
                    <TableRow key={tx._id || Math.random()} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      {/* Type & Reference */}
                      <TableCell style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: isRepayment ? '#F0FDF4' : '#EFF6FF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isRepayment ? '#16A34A' : '#2563EB',
                              flexShrink: 0,
                            }}
                          >
                            {isRepayment ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <button
                              onClick={() => {
                                setSelectedTransactionDetail(tx)
                                setDetailModalOpen(true)
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                fontWeight: 600,
                                color: '#111827',
                                fontSize: '0.84375rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              {isRepayment ? 'Repayment Received' : 'Credit Extension'}
                            </button>
                            <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                              ID: #{tx._id ? tx._id.slice(-6).toUpperCase() : 'PAY-REF'}
                            </div>
                          </div>
                        </div>
                      </TableCell>

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
                              fontSize: '0.84375rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {r.name || 'Retailer'}
                            <ExternalLink size={11} style={{ color: '#9CA3AF' }} />
                          </button>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 1 }}>
                            {r.city || r.phone || ''}
                          </div>
                        </div>
                      </TableCell>

                      {/* Amount */}
                      <TableCell style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: isRepayment ? '#16A34A' : '#2563EB', fontSize: '0.875rem' }}>
                          {isRepayment ? `+${fmt(tx.amount)}` : fmt(tx.amount)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                          Bal: {fmt(tx.runningBalance)}
                        </div>
                      </TableCell>

                      {/* Date & Time */}
                      <TableCell style={{ padding: '14px 18px', fontSize: '0.78125rem', color: '#374151' }}>
                        {formatDate(tx.date || tx.createdAt)}
                      </TableCell>

                      {/* Note / Reference */}
                      <TableCell style={{ padding: '14px 18px', fontSize: '0.78125rem', color: '#4B5563', maxWidth: 180 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.note || 'Direct transaction entry'}
                        </div>
                        {tx.order && (
                          <button
                            onClick={() => handleOrderClick(tx.order)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              fontSize: '0.72rem',
                              color: '#2563EB',
                              cursor: 'pointer',
                              fontWeight: 500,
                              marginTop: 2,
                            }}
                          >
                            View Linked Order
                          </button>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            background: '#F0FDF4',
                            color: '#16A34A',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            onClick={() => {
                              setSelectedTransactionDetail(tx)
                              setDetailModalOpen(true)
                            }}
                            title="View Payment Details"
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
                            <Eye size={13} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="block md:hidden" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {paginatedTransactions.map((tx) => {
              const isRepayment = tx.type === 'credit'
              const r = tx.retailer || {}
              return (
                <div
                  key={tx._id || Math.random()}
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
                          fontSize: '0.875rem',
                          color: '#111827',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {r.name || 'Retailer'}
                      </button>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                        {isRepayment ? 'Repayment Received' : 'Credit Extension'}
                      </div>
                    </div>
                    <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600 }}>
                      Completed
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase' }}>Amount</div>
                      <div style={{ fontWeight: 700, color: isRepayment ? '#16A34A' : '#2563EB', fontSize: '0.9375rem' }}>
                        {fmt(tx.amount)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase' }}>Balance Due</div>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>{fmt(tx.runningBalance)}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{formatDate(tx.date || tx.createdAt)}</span>
                    <span>{tx.note || 'No reference'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, pt: 4 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTransactionDetail(tx)
                        setDetailModalOpen(true)
                      }}
                      icon={<Eye size={13} />}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid #E5E7EB', background: '#F8FAFC' }}>
              <TablePagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
            </div>
          )}
        </Card>
      )}

      {/* MODAL: RECORD PAYMENT */}
      <Modal open={recordModalOpen} onClose={() => setRecordModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>Record Retailer Payment</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleRecordPaymentSubmit}>
          <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {modalError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 14px', borderRadius: 8, color: '#991B1B', fontSize: '0.8125rem' }}>
                {modalError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Select Retailer Account <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select
                value={selectedRetailerIdForRepay}
                onChange={(e) => {
                  const rId = e.target.value
                  setSelectedRetailerIdForRepay(rId)
                  const acc = creditAccounts.find((a) => a.retailer?.id === rId)
                  if (acc && acc.outstanding > 0) {
                    setRepayAmount(String(acc.outstanding))
                  }
                }}
                required
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 8,
                  border: '1px solid #D1D5DB',
                  padding: '0 12px',
                  fontSize: '0.8125rem',
                  color: '#374151',
                  background: '#FFFFFF',
                }}
              >
                <option value="">-- Choose a Retailer --</option>
                {creditAccounts.map((acc) => (
                  <option key={acc.retailer?.id} value={acc.retailer?.id}>
                    {acc.retailer?.name} (Outstanding Due: ₹{acc.outstanding?.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Payment Amount (₹) <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <Input
                type="number"
                placeholder="Enter repayment amount in ₹"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Payment Reference / Note
              </label>
              <Input
                placeholder="e.g. UPI Ref #1042, Bank Cheque, Cash Collection"
                value={repayNote}
                onChange={(e) => setRepayNote(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => setRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submittingPayment}>
              {submittingPayment ? 'Recording...' : 'Confirm Payment'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL: PAYMENT TRANSACTION DETAILS */}
      <Modal open={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>Payment Transaction Record</ModalTitle>
        </ModalHeader>
        <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {selectedTransactionDetail && (
            <>
              <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', padding: 16, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78125rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                    Transaction #{selectedTransactionDetail._id ? selectedTransactionDetail._id.slice(-8).toUpperCase() : 'REF'}
                  </span>
                  <span style={{ background: '#F0FDF4', color: '#16A34A', padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>
                    Completed
                  </span>
                </div>

                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: selectedTransactionDetail.type === 'credit' ? '#16A34A' : '#2563EB', fontFamily: 'Manrope, Inter, sans-serif' }}>
                  {selectedTransactionDetail.type === 'credit' ? `+${fmt(selectedTransactionDetail.amount)}` : fmt(selectedTransactionDetail.amount)}
                </div>

                <div style={{ fontSize: '0.8125rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div><strong>Retailer:</strong> {selectedTransactionDetail.retailer?.name}</div>
                  <div><strong>Date & Time:</strong> {formatDate(selectedTransactionDetail.date || selectedTransactionDetail.createdAt)}</div>
                  <div><strong>Payment Note:</strong> {selectedTransactionDetail.note || 'No note recorded'}</div>
                  <div><strong>Remaining Due:</strong> {fmt(selectedTransactionDetail.runningBalance)}</div>
                </div>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" size="sm" onClick={() => setDetailModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
