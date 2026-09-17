import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  ShoppingCart,
  CheckCircle2,
  Truck,
  XCircle,
  Clock,
  RefreshCw,
  MoreVertical,
  Building2,
  User,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  AlertTriangle,
  Package,
  Calendar,
  DollarSign,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'
import Button from '../../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card'
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../../../components/ui/Modal'
import { SkeletonCard, SkeletonTable } from '../../../../components/ui/Skeleton'
import Badge from '../../../../components/ui/Badges'
import EmptyState from '../../../../components/ui/EmptyState'
import { apiClient } from '../../../../api/client'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const formatDate = (isoString) => {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrderDetailView({ orderId, onBack, onNavigateToProduct, onNavigateToRetailer }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  // Status transition state
  const [transitioning, setTransitioning] = useState(false)
  const [transitionError, setTransitionError] = useState(null)
  const [transitionSuccess, setTransitionSuccess] = useState(null)

  // Cancel order modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  // Fetch Order Details
  const fetchOrder = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    setTransitionError(null)
    setNotFound(false)

    try {
      const res = await apiClient(`/orders/${orderId}`)
      if (res.order) {
        setOrder(res.order)
      } else {
        setNotFound(true)
      }
    } catch (err) {
      console.error('Fetch order details error:', err)
      if (err.status === 404 || err.message?.includes('not found')) {
        setNotFound(true)
      } else {
        setError(err.message || 'Failed to load order details.')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // Handle status transition
  const handleStatusTransition = async (targetStatus, reason = '') => {
    setTransitioning(true)
    setTransitionError(null)
    setTransitionSuccess(null)

    try {
      const payload = { status: targetStatus }
      if (reason) payload.rejectionReason = reason

      const res = await apiClient(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      if (res.order) {
        setOrder(res.order)
        setTransitionSuccess(res.message || `Order successfully updated to ${targetStatus}.`)
        setCancelModalOpen(false)
        setRejectionReason('')
      }
    } catch (err) {
      console.error('Status transition error:', err)
      setTransitionError(err.message || `Failed to update order status to ${targetStatus}.`)
    } finally {
      setTransitioning(false)
    }
  }

  // SKELETON LOADING STATE
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonTable rows={4} cols={4} />
            <SkeletonCard />
          </div>
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  // NOT FOUND STATE
  if (notFound) {
    return (
      <div className="p-6">
        <EmptyState
          icon={ShoppingCart}
          title="Order Not Found"
          description="The order you are looking for does not exist or may have been removed."
          action={
            <Button variant="secondary" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Orders
            </Button>
          }
        />
      </div>
    )
  }

  // API ERROR STATE
  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-xl p-6 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold font-display text-slate-900">
              Couldn't load order details
            </h3>
            <p className="text-xs text-slate-500">
              {error}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
            <Button variant="primary" size="sm" onClick={() => fetchOrder()}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Valid Backend Transitions
  const status = order.status
  const canApprove = status === 'pending'
  const canDispatch = status === 'approved'
  const canDeliver = status === 'dispatched'
  const canCancel = status === 'pending' || status === 'approved'

  // Build Real Timeline Nodes
  const timelineEvents = [
    {
      title: 'Order Placed',
      time: order.createdAt,
      done: true,
      icon: Clock,
      desc: `Created via ${order.paymentType?.toUpperCase() || 'Cash'} payment`,
    },
    {
      title: 'Order Approved',
      time: order.approvedAt,
      done: !!order.approvedAt || status === 'dispatched' || status === 'delivered',
      icon: CheckCircle2,
      desc: order.approvedAt ? 'Approved by Wholesaler' : 'Awaiting approval',
    },
    {
      title: 'Order Dispatched',
      time: order.dispatchedAt,
      done: !!order.dispatchedAt || status === 'delivered',
      icon: Truck,
      desc: order.dispatchedAt ? 'Dispatched from inventory' : 'Awaiting dispatch',
    },
    {
      title: 'Order Delivered',
      time: order.deliveredAt,
      done: !!order.deliveredAt || status === 'delivered',
      icon: ShieldCheck,
      desc: order.deliveredAt ? 'Successfully delivered to retailer' : 'Pending delivery',
    },
  ]

  if (status === 'cancelled') {
    timelineEvents.push({
      title: 'Order Cancelled / Rejected',
      time: order.updatedAt,
      done: true,
      isCancelled: true,
      icon: XCircle,
      desc: order.rejectionReason ? `Reason: ${order.rejectionReason}` : 'Order was cancelled',
    })
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. BREADCRUMBS & PAGE HEADER
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Orders
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
              {order.orderNumber || `Order #${order._id.slice(-6)}`}
            </h2>
            <Badge status={order.status} />
          </div>

          <p className="text-xs text-slate-500">
            Created on {formatDate(order.createdAt)} • {order.items?.length || 0} Products
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrder(true)}
            loading={refreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            Refresh
          </Button>

          {/* Valid Primary Transition Action */}
          {canApprove && (
            <Button
              variant="primary"
              size="sm"
              loading={transitioning}
              onClick={() => handleStatusTransition('approved')}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Approve Order
            </Button>
          )}

          {canDispatch && (
            <Button
              variant="primary"
              size="sm"
              loading={transitioning}
              onClick={() => handleStatusTransition('dispatched')}
            >
              <Truck className="w-4 h-4 mr-1.5" />
              Dispatch Order
            </Button>
          )}

          {canDeliver && (
            <Button
              variant="primary"
              size="sm"
              loading={transitioning}
              onClick={() => handleStatusTransition('delivered')}
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Mark Delivered
            </Button>
          )}

          {/* Secondary Action: Cancel Order */}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:border-red-200"
              onClick={() => setCancelModalOpen(true)}
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Transition Feedback Messages */}
      {transitionError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{transitionError}</span>
          </div>
          <button onClick={() => setTransitionError(null)} className="text-red-500 hover:text-red-800">
            ×
          </button>
        </div>
      )}

      {transitionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{transitionSuccess}</span>
          </div>
          <button onClick={() => setTransitionSuccess(null)} className="text-emerald-500 hover:text-emerald-800">
            ×
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN OPERATIONAL GRID (Items Table & Parties)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: ORDER ITEMS & FINANCIAL SUMMARY (65-70%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">Order Line Items</CardTitle>
                <p className="text-xs text-slate-500">
                  {order.items?.length || 0} product line items in this order
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Total Units: {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
              </span>
            </CardHeader>

            <CardContent className="p-0 border-t border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                        Product
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px] text-right">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px] text-center">
                        Qty
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px] text-right">
                        Line Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items?.map((item, idx) => {
                      const prodId = item.product?._id || item.product
                      const prodName = item.productName || item.product?.name || 'Product'
                      const prodCategory = item.product?.category || ''

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3.5">
                            <div>
                              {onNavigateToProduct && prodId ? (
                                <button
                                  onClick={() => onNavigateToProduct(prodId)}
                                  className="font-semibold text-slate-900 hover:text-blue-600 text-left transition-colors truncate max-w-xs block"
                                >
                                  {prodName}
                                </button>
                              ) : (
                                <span className="font-semibold text-slate-900 truncate max-w-xs block">
                                  {prodName}
                                </span>
                              )}

                              {prodCategory && (
                                <span className="text-[10px] text-slate-400 font-medium capitalize">
                                  {prodCategory}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                            {fmt(item.unitPrice)}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                              {item.quantity}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right font-bold text-slate-900 font-display">
                            {fmt(item.totalPrice)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>

                </table>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary Card */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
                Financial Summary
              </h3>

              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-900">{fmt(order.totalAmount)}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900 font-display">Order Total</span>
                  <span className="text-xl font-extrabold text-slate-900 font-display">
                    {fmt(order.totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real Timeline Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Order History & Progress</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timelineEvents.map((ev, idx) => {
                  const IconComp = ev.icon
                  return (
                    <div key={idx} className="relative">
                      <div
                        className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          ev.isCancelled
                            ? 'bg-red-500 text-white'
                            : ev.done
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <IconComp className="w-3 h-3" />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`font-semibold ${
                              ev.isCancelled
                                ? 'text-red-600'
                                : ev.done
                                ? 'text-slate-900'
                                : 'text-slate-400'
                            }`}
                          >
                            {ev.title}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {ev.time ? formatDate(ev.time) : 'Pending'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          {ev.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: PARTY DETAILS & PAYMENT METADATA (30-35%) */}
        <div className="space-y-6">
          {/* Retailer Info Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
                Retailer Information
              </CardTitle>
              <Building2 className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <div className="font-bold text-sm text-slate-900">
                  {order.retailer?.businessName || order.retailer?.name || 'Retailer Account'}
                </div>
                {order.retailer?.name && (
                  <div className="text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <User className="w-3 h-3 text-slate-400" />
                    {order.retailer.name}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-slate-600 pt-2 border-t border-slate-100">
                {order.retailer?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{order.retailer.phone}</span>
                  </div>
                )}
                {order.retailer?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{order.retailer.city}</span>
                  </div>
                )}
              </div>

              {onNavigateToRetailer && order.retailer?._id && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => onNavigateToRetailer(order.retailer._id)}
                  >
                    View Retailer Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Salesman Info Card (if assigned) */}
          {order.salesman && (
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
                  Assigned Salesman
                </CardTitle>
                <User className="w-4 h-4 text-slate-400" />
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="font-semibold text-slate-900">
                  {order.salesman.name}
                </div>
                {order.salesman.phone && (
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {order.salesman.phone}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment & Credit Metadata Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
                Payment & Credit
              </CardTitle>
              <CreditCard className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Payment Mode</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                  {order.paymentType || 'Cash'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Payment Status</span>
                <Badge status={order.paymentStatus || 'unpaid'} />
              </div>

              {order.paymentType === 'credit' && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-blue-700 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Retailer Credit Account Charged
                  </div>
                  <p className="text-[10px] text-blue-600">
                    Order value added to retailer's outstanding balance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Notes Card */}
          {order.notes && (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed italic">
                  "{order.notes}"
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. CANCEL ORDER MODAL
         ───────────────────────────────────────────────────────────── */}
      <Modal open={cancelModalOpen} onClose={() => setCancelModalOpen(false)}>
        <ModalHeader onClose={() => setCancelModalOpen(false)}>
          <ModalTitle>Cancel Order #{order.orderNumber || order._id.slice(-6)}</ModalTitle>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to cancel this order? This action will set the order status to cancelled and update inventory/credit records accordingly.
          </p>

          <div className="space-y-1">
            <label className="form-label text-xs">
              Reason for Cancellation (Optional)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Out of stock, retailer requested cancellation..."
              className="textarea text-xs"
              rows={3}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={() => setCancelModalOpen(false)}>
            Keep Order
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={transitioning}
            onClick={() => handleStatusTransition('cancelled', rejectionReason)}
          >
            Cancel Order
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
