import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Search,
  RefreshCw,
  Check,
  X,
  Truck,
  CheckCircle2,
  Clock,
  CreditCard,
  ShoppingCart,
  Store,
  Eye,
  ArrowUpDown,
  Filter,
  AlertTriangle,
  ChevronRight,
  User,
  Package
} from 'lucide-react'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { Card, CardContent } from '../../../../components/ui/Card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, TablePagination } from '../../../../components/ui/Table'
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../../../components/ui/Modal'
import Drawer, { DrawerHeader, DrawerTitle, DrawerBody, DrawerFooter } from '../../../../components/ui/Drawer'
import Skeleton, { SkeletonTable, SkeletonCard } from '../../../../components/ui/Skeleton'
import EmptyState from '../../../../components/ui/EmptyState'
import Badge from '../../../../components/ui/Badges'
import { apiClient } from '../../../../api/client'
import OrderDetailView from './OrderDetailView'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const formatDate = (isoString) => {
  if (!isoString) return '—'
  const date = new Date(isoString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
  if (isYesterday) return `Yesterday`
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export default function OrdersTab({ onNavigateToProduct, onNavigateToRetailer }) {
  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    dispatched: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0,
  })
  const [retailers, setRetailers] = useState([])
  const [productsList, setProductsList] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')

  // Search & Filter State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'pending' | 'processing' | 'approved' | 'dispatched' | 'delivered' | 'cancelled'
  const [retailerFilter, setRetailerFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  // Drawer / Modal States
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // Create Order Form State
  const [createForm, setCreateForm] = useState({
    retailerId: '',
    paymentType: 'credit',
    notes: '',
    items: [{ productId: '', quantity: 1 }],
  })

  // Fetch Order Stats & Retailers once
  const loadInitialData = useCallback(async () => {
    try {
      const [statsRes, retailersRes, productsRes] = await Promise.all([
        apiClient('/orders/stats').catch(() => ({})),
        apiClient('/users/retailers').catch(() => ({ retailers: [] })),
        apiClient('/products?limit=100').catch(() => ({ products: [] })),
      ])

      if (statsRes) {
        setStats({
          total: statsRes.total || 0,
          pending: statsRes.pending || 0,
          approved: statsRes.approved || 0,
          dispatched: statsRes.dispatched || 0,
          delivered: statsRes.delivered || 0,
          cancelled: statsRes.cancelled || 0,
          revenue: statsRes.revenue || 0,
        })
      }

      if (retailersRes.retailers) setRetailers(retailersRes.retailers)
      if (productsRes.products) setProductsList(productsRes.products)
    } catch (err) {
      console.error('Error loading initial order metadata:', err)
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Fetch Orders List
  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')

      if (statusFilter === 'processing') {
        params.set('status', 'approved')
      } else if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const res = await apiClient(`/orders?${params.toString()}`)
      let fetched = res.orders || []

      // Client-side filtering refinement for search or retailer if backend doesn't support them directly in list query
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        fetched = fetched.filter(
          (o) =>
            o.orderNumber?.toLowerCase().includes(q) ||
            o.retailer?.name?.toLowerCase().includes(q) ||
            o.retailer?.businessName?.toLowerCase().includes(q)
        )
      }

      if (retailerFilter) {
        fetched = fetched.filter(
          (o) => o.retailer?._id === retailerFilter || o.retailer?.id === retailerFilter
        )
      }

      // Sort
      if (sort === 'oldest') {
        fetched.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      } else if (sort === 'amount_desc') {
        fetched.sort((a, b) => b.totalAmount - a.totalAmount)
      } else if (sort === 'amount_asc') {
        fetched.sort((a, b) => a.totalAmount - b.totalAmount)
      } else {
        fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }

      setOrders(fetched)
      setPagination(
        res.pagination || {
          page: 1,
          limit: 20,
          total: fetched.length,
          totalPages: Math.ceil(fetched.length / 20) || 1,
        }
      )
    } catch (e) {
      console.error('Fetch orders error:', e)
      setError(e.message || 'Failed to load orders.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, statusFilter, search, retailerFilter, sort])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Debounced Search Handler
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleStatusTransition = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    setError('')

    try {
      await apiClient(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      )

      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }))
      }

      loadInitialData()
    } catch (e) {
      setError(e.message || 'Failed to update order status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault()
    if (!createForm.retailerId) {
      setError('Please select a retailer.')
      return
    }
    const validItems = createForm.items.filter((i) => i.productId && Number(i.quantity) > 0)
    if (validItems.length === 0) {
      setError('Please select at least one product with quantity > 0.')
      return
    }

    setCreating(true)
    setError('')

    try {
      await apiClient('/orders', {
        method: 'POST',
        body: JSON.stringify({
          retailerId: createForm.retailerId,
          paymentType: createForm.paymentType,
          notes: createForm.notes,
          items: validItems,
        }),
      })

      setCreateDrawerOpen(false)
      setCreateForm({
        retailerId: '',
        paymentType: 'credit',
        notes: '',
        items: [{ productId: '', quantity: 1 }],
      })
      loadOrders()
      loadInitialData()
    } catch (err) {
      setError(err.message || 'Failed to create order.')
    } finally {
      setCreating(false)
    }
  }

  const handleAddCreateItem = () => {
    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1 }],
    }))
  }

  const handleRemoveCreateItem = (index) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setRetailerFilter('')
    setSort('newest')
    setPage(1)
  }

  const hasActiveFilters = Boolean(search.trim() || statusFilter !== 'all' || retailerFilter || sort !== 'newest')

  const openOrderDetails = (order) => {
    setSelectedOrderId(order._id || order.id)
  }

  // Processing count = approved + dispatched
  const processingCount = (stats.approved || 0) + (stats.dispatched || 0)

  // Renders OrderDetailView when selectedOrderId is set
  if (selectedOrderId) {
    return (
      <OrderDetailView
        orderId={selectedOrderId}
        onBack={() => {
          setSelectedOrderId(null)
          loadOrders(true)
        }}
        onNavigateToProduct={onNavigateToProduct}
        onNavigateToRetailer={onNavigateToRetailer}
      />
    )
  }

  return (
    <div className="space-y-6 pb-8">

      {/* ─────────────────────────────────────────────────────────────
          1. PAGE HEADER
         ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          1. PAGE HEADER
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
              Orders
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Manage incoming and outgoing orders across retailer accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" onClick={() => loadOrders(true)} loading={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            Refresh
          </Button>

          <Button variant="primary" size="sm" onClick={() => setCreateDrawerOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create Order
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 4 KPI STAT CARDS ROW (Matching Wireframe)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* All Orders Card */}
        <Card
          onClick={() => {
            setStatusFilter('all')
            setPage(1)
          }}
          className={`cursor-pointer transition-all duration-150 ${
            statusFilter === 'all'
              ? 'border-blue-600 shadow-sm ring-1 ring-blue-600/20'
              : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                All
              </span>
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                <ShoppingCart className="w-4 h-4 stroke-[1.75]" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-display text-slate-900 tracking-tight">
                {stats.total.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Total orders received</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Card */}
        <Card
          onClick={() => {
            setStatusFilter('pending')
            setPage(1)
          }}
          className={`cursor-pointer transition-all duration-150 ${
            statusFilter === 'pending'
              ? 'border-amber-500 shadow-sm ring-1 ring-amber-500/20'
              : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                Pending
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="w-4 h-4 stroke-[1.75]" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-display text-slate-900 tracking-tight">
                {stats.pending}
              </div>
              <span className="text-[10px] text-slate-500">Requires approval</span>
            </div>
          </CardContent>
        </Card>

        {/* Processing Card */}
        <Card
          onClick={() => {
            setStatusFilter('processing')
            setPage(1)
          }}
          className={`cursor-pointer transition-all duration-150 ${
            statusFilter === 'processing'
              ? 'border-blue-600 shadow-sm ring-1 ring-blue-600/20'
              : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                Processing
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Truck className="w-4 h-4 stroke-[1.75]" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-display text-slate-900 tracking-tight">
                {processingCount}
              </div>
              <span className="text-[10px] text-slate-500">Approved & dispatched</span>
            </div>
          </CardContent>
        </Card>

        {/* Completed Card */}
        <Card
          onClick={() => {
            setStatusFilter('delivered')
            setPage(1)
          }}
          className={`cursor-pointer transition-all duration-150 ${
            statusFilter === 'delivered'
              ? 'border-emerald-600 shadow-sm ring-1 ring-emerald-600/20'
              : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                Completed
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 stroke-[1.75]" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-display text-slate-900 tracking-tight">
                {stats.delivered.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Successfully delivered</span>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* ─────────────────────────────────────────────────────────────
          3. SEARCH & TOOLBAR FILTERS (Matching Wireframe)
         ───────────────────────────────────────────────────────────── */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status ▼ */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="all">Status: All</option>
              <option value="pending">Status: Pending</option>
              <option value="processing">Status: Processing</option>
              <option value="approved">Status: Approved</option>
              <option value="dispatched">Status: Dispatched</option>
              <option value="delivered">Status: Delivered / Completed</option>
              <option value="cancelled">Status: Cancelled</option>
            </select>

            {/* Retailer ▼ */}
            <select
              value={retailerFilter}
              onChange={(e) => {
                setRetailerFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-600 max-w-[180px]"
            >
              <option value="">Retailer: All</option>
              {retailers.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.businessName || r.name}
                </option>
              ))}
            </select>

            {/* Sort ▼ */}
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="amount_desc">Sort: Amount (High → Low)</option>
              <option value="amount_asc">Sort: Amount (Low → High)</option>
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-blue-600">
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          4. ORDERS DATA TABLE (DESKTOP) / CARDS (MOBILE)
         ───────────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={7} cols={7} />
      ) : orders.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={ShoppingCart}
            title={hasActiveFilters ? 'No orders match your filter criteria' : 'No orders recorded yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search terms or status filters.'
                : 'Orders placed by connected retailers will appear here automatically.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setCreateDrawerOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create First Order
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Retailer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o._id}>
                    {/* Order Number Link */}
                    <TableCell>
                      <button
                        onClick={() => openOrderDetails(o)}
                        className="font-semibold text-blue-600 hover:underline font-mono text-xs"
                      >
                        {o.orderNumber || `#ORD-${o._id.slice(-6)}`}
                      </button>
                    </TableCell>

                    {/* Retailer */}
                    <TableCell>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-900 truncate">
                          {o.retailer?.businessName || o.retailer?.name || '—'}
                        </span>
                        {o.retailer?.phone && (
                          <span className="text-[11px] text-slate-400">{o.retailer.phone}</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-slate-600 whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="font-semibold font-display text-slate-900 whitespace-nowrap">
                      {fmt(o.totalAmount)}
                    </TableCell>

                    {/* Payment Mode */}
                    <TableCell>
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600 capitalize">
                        {o.paymentType || 'cash'}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge status={o.status} />
                    </TableCell>

                    {/* Quick Status Action Buttons */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {o.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusTransition(o._id, 'approved')}
                              disabled={updatingId === o._id}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleStatusTransition(o._id, 'cancelled')}
                              disabled={updatingId === o._id}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors inline-flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}

                        {o.status === 'approved' && (
                          <button
                            onClick={() => handleStatusTransition(o._id, 'dispatched')}
                            disabled={updatingId === o._id}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                          >
                            <Truck className="w-3 h-3" /> Dispatch
                          </button>
                        )}

                        {o.status === 'dispatched' && (
                          <button
                            onClick={() => handleStatusTransition(o._id, 'delivered')}
                            disabled={updatingId === o._id}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Deliver
                          </button>
                        )}

                        <button
                          onClick={() => openOrderDetails(o)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <TablePagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages || pagination.pages || 1}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={(p) => setPage(p)}
            />
          </div>

          {/* Mobile Card Grid View */}
          <div className="block sm:hidden space-y-3">
            {orders.map((o) => (
              <Card key={o._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <button
                      onClick={() => openOrderDetails(o)}
                      className="font-bold font-mono text-xs text-blue-600 hover:underline"
                    >
                      {o.orderNumber || `#ORD-${o._id.slice(-6)}`}
                    </button>
                    <h4 className="font-semibold text-slate-900 text-xs mt-0.5">
                      {o.retailer?.businessName || o.retailer?.name || '—'}
                    </h4>
                  </div>
                  <Badge status={o.status} />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">AMOUNT</span>
                    <span className="font-bold font-display text-slate-900">
                      {fmt(o.totalAmount)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">DATE</span>
                    <span className="text-slate-600 text-[11px]">{formatDate(o.createdAt)}</span>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => openOrderDetails(o)}>
                    Details
                  </Button>
                </div>
              </Card>
            ))}

            <TablePagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages || pagination.pages || 1}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. CREATE ORDER DRAWER / MODAL
         ───────────────────────────────────────────────────────────── */}
      <Drawer isOpen={createDrawerOpen} onClose={() => setCreateDrawerOpen(false)} size="lg">
        <DrawerHeader onClose={() => setCreateDrawerOpen(false)}>
          <DrawerTitle>Create New Order</DrawerTitle>
        </DrawerHeader>

        <form onSubmit={handleCreateOrderSubmit} className="flex flex-col flex-1">
          <DrawerBody className="space-y-4 flex-1">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-xs text-red-600 border border-red-200">
                {error}
              </div>
            )}

            {/* Select Retailer */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 block">
                Select Retailer Account *
              </label>
              <select
                value={createForm.retailerId}
                onChange={(e) => setCreateForm({ ...createForm, retailerId: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="">Choose a retailer...</option>
                {retailers.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.businessName || r.name} ({r.city || 'Retailer'})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Mode & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Payment Mode"
                select
                value={createForm.paymentType}
                onChange={(e) => setCreateForm({ ...createForm, paymentType: e.target.value })}
              >
                <option value="credit">Credit Account</option>
                <option value="cash">Cash on Delivery</option>
                <option value="upi">UPI / Direct Payment</option>
              </Input>

              <Input
                label="Order Notes"
                placeholder="Optional delivery instructions..."
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              />
            </div>

            {/* Line Items */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
                  Order Line Items
                </h4>
                <Button type="button" variant="ghost" size="sm" onClick={handleAddCreateItem} className="text-blue-600">
                  + Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {createForm.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex-1">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const val = e.target.value
                          setCreateForm((prev) => {
                            const newItems = [...prev.items]
                            newItems[idx].productId = val
                            return { ...prev, items: newItems }
                          })
                        }}
                        required
                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-900"
                      >
                        <option value="">Select product...</option>
                        {productsList.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({fmt(p.price)}) — Stock: {p.stock}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setCreateForm((prev) => {
                            const newItems = [...prev.items]
                            newItems[idx].quantity = val
                            return { ...prev, items: newItems }
                          })
                        }}
                        className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-900"
                      />
                    </div>

                    {createForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCreateItem(idx)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DrawerBody>

          <DrawerFooter>
            <Button variant="ghost" size="sm" type="button" onClick={() => setCreateDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={creating}>
              Create Order
            </Button>
          </DrawerFooter>
        </form>
      </Drawer>

      {/* ─────────────────────────────────────────────────────────────
          6. ORDER DETAILS DRAWER
         ───────────────────────────────────────────────────────────── */}
      <Drawer isOpen={detailDrawerOpen} onClose={() => setDetailDrawerOpen(false)} size="md">
        <DrawerHeader onClose={() => setDetailDrawerOpen(false)}>
          <DrawerTitle>
            {selectedOrder?.orderNumber || 'Order Details'}
          </DrawerTitle>
        </DrawerHeader>

        <DrawerBody className="space-y-6">
          {selectedOrder && (
            <>
              {/* Top Header Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 font-mono">
                    {selectedOrder.orderNumber || `#ORD-${selectedOrder._id.slice(-6)}`}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Placed on {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <Badge status={selectedOrder.status} />
              </div>

              {/* Retailer Info Card */}
              <Card className="p-4">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display mb-2">
                  Retailer Details
                </h5>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-slate-900">
                    {selectedOrder.retailer?.businessName || selectedOrder.retailer?.name || '—'}
                  </div>
                  {selectedOrder.retailer?.name && (
                    <div className="text-slate-500">Contact: {selectedOrder.retailer.name}</div>
                  )}
                  {selectedOrder.retailer?.phone && (
                    <div className="text-slate-500">Phone: {selectedOrder.retailer.phone}</div>
                  )}
                </div>
              </Card>

              {/* Line Items Breakdown Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs">Order Line Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0 border-t border-slate-100">
                  <div className="divide-y divide-slate-100 text-xs">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-800 block truncate">
                            {item.productName || item.product?.name || 'Product'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {fmt(item.unitPrice)} × {item.quantity} units
                          </span>
                        </div>

                        <div className="font-bold font-display text-slate-900 shrink-0">
                          {fmt(item.totalPrice)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs font-bold font-display">
                    <span>Total Order Amount</span>
                    <span className="text-base text-blue-600">
                      {fmt(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </DrawerBody>

        <DrawerFooter>
          {selectedOrder?.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleStatusTransition(selectedOrder._id, 'cancelled')
                  setDetailDrawerOpen(false)
                }}
              >
                Reject Order
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleStatusTransition(selectedOrder._id, 'approved')
                  setDetailDrawerOpen(false)
                }}
              >
                Approve Order
              </Button>
            </>
          )}

          {selectedOrder?.status === 'approved' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                handleStatusTransition(selectedOrder._id, 'dispatched')
                setDetailDrawerOpen(false)
              }}
            >
              Dispatch Order
            </Button>
          )}

          {selectedOrder?.status === 'dispatched' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                handleStatusTransition(selectedOrder._id, 'delivered')
                setDetailDrawerOpen(false)
              }}
            >
              Mark Delivered
            </Button>
          )}
        </DrawerFooter>
      </Drawer>
    </div>
  )
}
