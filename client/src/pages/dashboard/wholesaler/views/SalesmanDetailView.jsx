import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Building2,
  Store,
  CheckCircle,
  X
} from 'lucide-react'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../../../components/ui/Table'
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../../../components/ui/Modal'
import { SkeletonCard, SkeletonTable } from '../../../../components/ui/Skeleton'
import Badge from '../../../../components/ui/Badges'
import * as svc from '../../../../services/wholesaler.service'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const getInitials = (name) => {
  if (!name) return 'SM'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return 'N/A'
  }
}

export default function SalesmanDetailView({ salesmanId, onBack, onNavigateOrder, onNavigateRetailer }) {
  const [salesman, setSalesman] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    city: '',
    route: '',
    status: 'active'
  })
  const [updating, setUpdating] = useState(false)
  const [modalError, setModalError] = useState(null)

  // Delete / Deactivate Modal State
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  // Load Salesman Details
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await svc.getSalesman(salesmanId)
      if (res && res.salesman) {
        setSalesman(res.salesman)
      } else {
        setError('Salesman profile not found.')
      }
    } catch (err) {
      setError(err.message || 'Failed to load salesman information.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [salesmanId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Open Edit Modal
  const openEditModal = () => {
    if (!salesman) return
    setEditForm({
      name: salesman.name || '',
      phone: salesman.phone || '',
      city: salesman.city || '',
      route: salesman.businessName || '',
      status: salesman.status || 'active'
    })
    setModalError(null)
    setEditModalOpen(true)
  }

  // Submit Edit Form
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setModalError(null)

    if (!editForm.name.trim()) {
      setModalError('Salesman name is required.')
      return
    }

    setUpdating(true)
    try {
      await svc.updateSalesman(salesmanId, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        city: editForm.city.trim(),
        businessName: editForm.route.trim(),
        status: editForm.status
      })
      setEditModalOpen(false)
      loadData(true)
    } catch (err) {
      setModalError(err.message || 'Failed to update salesman profile.')
    } finally {
      setUpdating(false)
    }
  }

  // Toggle Deactivation
  const handleDeactivateToggle = async () => {
    if (!salesman) return
    setDeactivating(true)
    try {
      if (salesman.status === 'active') {
        await svc.deleteSalesman(salesmanId)
      } else {
        await svc.updateSalesman(salesmanId, { status: 'active' })
      }
      setDeactivateModalOpen(false)
      loadData(true)
    } catch (err) {
      setError(err.message || 'Failed to change salesman status.')
    } finally {
      setDeactivating(false)
    }
  }

  // Render Skeleton Loading State
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="outline" size="sm" onClick={onBack} icon={<ArrowLeft size={15} />}>
            Back to Salesmen
          </Button>
          <div style={{ height: 24, width: 200, background: '#E5E7EB', borderRadius: 6 }} className="animate-pulse" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
          <SkeletonCard />
          <SkeletonTable rows={5} cols={5} />
        </div>
      </div>
    )
  }

  // Render Not Found / Error State
  if (error || !salesman) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="outline" size="sm" onClick={onBack} icon={<ArrowLeft size={15} />}>
            Back to Salesmen
          </Button>
        </div>

        <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <CardContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <ShieldAlert size={24} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'Manrope, Inter, sans-serif' }}>
              {error || 'Salesman Not Found'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, maxWidth: 450 }}>
              The requested salesman profile does not exist or may have been removed from your distribution network.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Button variant="outline" size="sm" onClick={() => loadData(true)} icon={<RefreshCw size={14} />}>
                Retry Loading
              </Button>
              <Button variant="primary" size="sm" onClick={onBack}>
                Return to Salesmen List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Process Real Backend Metrics & Data
  const recentOrders = salesman.recentOrders || []
  const totalRevenue = salesman.totalRevenue || 0
  const totalOrdersCount = recentOrders.length
  const deliveredCount = recentOrders.filter((o) => o.status === 'delivered').length
  const pendingCount = recentOrders.filter((o) => ['pending', 'approved', 'dispatched'].includes(o.status)).length

  // Extract unique assigned retailers from recent orders
  const assignedRetailersMap = {}
  recentOrders.forEach((o) => {
    if (o.retailer && o.retailer._id) {
      const rId = o.retailer._id
      if (!assignedRetailersMap[rId]) {
        assignedRetailersMap[rId] = {
          _id: rId,
          name: o.retailer.name || 'Retailer',
          businessName: o.retailer.businessName || '',
          phone: o.retailer.phone || '',
          city: o.retailer.city || '',
          orderCount: 1,
          totalSpent: o.totalAmount || 0,
        }
      } else {
        assignedRetailersMap[rId].orderCount += 1
        assignedRetailersMap[rId].totalSpent += o.totalAmount || 0
      }
    }
  })
  const assignedRetailersList = Object.values(assignedRetailersMap)

  const isSuspended = salesman.status !== 'active'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* BREADCRUMB & HEADER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: '#6B7280' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontWeight: 500, padding: 0 }}
          >
            Salesmen
          </button>
          <ChevronRight size={14} style={{ color: '#9CA3AF' }} />
          <span style={{ color: '#111827', fontWeight: 600 }}>{salesman.name}</span>
        </div>

        {/* PAGE HEADER BAR */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Salesman Initial Avatar */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                color: '#2563EB',
                fontWeight: 700,
                fontSize: '1.125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getInitials(salesman.name)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1
                  style={{
                    fontFamily: 'Manrope, Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '1.35rem',
                    color: '#111827',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {salesman.name}
                </h1>
                {isSuspended ? (
                  <span
                    style={{
                      background: '#F3F4F6',
                      color: '#6B7280',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <UserX size={12} /> Suspended
                  </span>
                ) : (
                  <span
                    style={{
                      background: '#EFF6FF',
                      color: '#2563EB',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <UserCheck size={12} /> Active
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 4, fontSize: '0.8125rem', color: '#6B7280' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Mail size={13} style={{ color: '#9CA3AF' }} /> {salesman.email}
                </span>
                {salesman.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={13} style={{ color: '#9CA3AF' }} /> {salesman.phone}
                  </span>
                )}
                {salesman.businessName && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2563EB', fontWeight: 500 }}>
                    <MapPin size={13} /> Route: {salesman.businessName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={refreshing}
              icon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
            >
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={openEditModal} icon={<Edit2 size={14} />}>
              Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeactivateModalOpen(true)}
              style={{
                color: isSuspended ? '#2563EB' : '#DC2626',
                borderColor: isSuspended ? '#BFDBFE' : '#FCA5A5',
                background: isSuspended ? '#EFF6FF' : '#FFFFFF',
              }}
              icon={isSuspended ? <UserCheck size={14} /> : <UserX size={14} />}
            >
              {isSuspended ? 'Reactivate Salesman' : 'Deactivate'}
            </Button>
          </div>
        </div>
      </div>

      {/* OPERATIONAL SNAPSHOT METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        {/* Total Sales Revenue */}
        <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
          <CardContent style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Delivered Sales Value
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} style={{ color: '#2563EB' }} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563EB', fontFamily: 'Manrope, Inter, sans-serif' }}>
                {fmt(totalRevenue)}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
              Total fulfilled order revenue
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
          <CardContent style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Orders Logged
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={18} style={{ color: '#2563EB' }} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', fontFamily: 'Manrope, Inter, sans-serif' }}>
                {totalOrdersCount}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
              Recent order history entries
            </div>
          </CardContent>
        </Card>

        {/* Delivered Orders */}
        <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
          <CardContent style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Fulfilled Orders
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} style={{ color: '#16A34A' }} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', fontFamily: 'Manrope, Inter, sans-serif' }}>
                {deliveredCount}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
              Successfully delivered
            </div>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
          <CardContent style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pending / Processing
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} style={{ color: '#D97706' }} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', fontFamily: 'Manrope, Inter, sans-serif' }}>
                {pendingCount}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
              Awaiting fulfillment
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT GRID (2-Column Layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 20 }}>
        {/* LEFT COLUMN: Profile Details & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Salesman Profile Card */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <CardHeader style={{ padding: '16px 18px', borderBottom: '1px solid #F3F4F6' }}>
              <CardTitle style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} style={{ color: '#2563EB' }} /> Salesman Profile
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500, display: 'block', marginBottom: 2 }}>Full Name</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{salesman.name}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500, display: 'block', marginBottom: 2 }}>Email Address</span>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>{salesman.email}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500, display: 'block', marginBottom: 2 }}>Phone Number</span>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>{salesman.phone || 'Not provided'}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500, display: 'block', marginBottom: 2 }}>Assigned Route / Territory</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2563EB' }}>
                  {salesman.businessName || 'Unassigned'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500, display: 'block', marginBottom: 2 }}>City / Location</span>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>{salesman.city || 'Not provided'}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500, display: 'block', marginBottom: 2 }}>Account Role</span>
                <span style={{ fontSize: '0.8125rem', color: '#374151', textTransform: 'capitalize', fontWeight: 500 }}>
                  {salesman.role || 'Sales Representative'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500, display: 'block', marginBottom: 2 }}>Joined Date</span>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>{formatDate(salesman.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <CardHeader style={{ padding: '16px 18px', borderBottom: '1px solid #F3F4F6' }}>
              <CardTitle style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button variant="outline" size="sm" onClick={openEditModal} style={{ justifyContent: 'flex-start' }} icon={<Edit2 size={14} />}>
                Edit Salesman Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeactivateModalOpen(true)}
                style={{
                  justifyContent: 'flex-start',
                  color: isSuspended ? '#2563EB' : '#DC2626',
                  borderColor: isSuspended ? '#BFDBFE' : '#FCA5A5'
                }}
                icon={isSuspended ? <UserCheck size={14} /> : <UserX size={14} />}
              >
                {isSuspended ? 'Reactivate Account' : 'Deactivate Account'}
              </Button>
              <Button variant="ghost" size="sm" onClick={onBack} style={{ justifyContent: 'flex-start', color: '#6B7280' }} icon={<ArrowLeft size={14} />}>
                Return to Salesmen List
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Order Activity & Assigned Retailers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Order Activity Section */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <CardHeader style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <CardTitle style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingBag size={16} style={{ color: '#2563EB' }} /> Recent Order Activity
              </CardTitle>
              <span style={{ fontSize: '0.78125rem', color: '#6B7280', fontWeight: 500 }}>
                {recentOrders.length} orders recorded
              </span>
            </CardHeader>
            <CardContent style={{ padding: 0 }}>
              {recentOrders.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6B7280', fontSize: '0.875rem' }}>
                  No order activity recorded for this salesman yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHeader>
                      <TableRow style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
                        <TableHead style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Order #</TableHead>
                        <TableHead style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Retailer</TableHead>
                        <TableHead style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</TableHead>
                        <TableHead style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableHead>
                        <TableHead style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</TableHead>
                        {onNavigateOrder && (
                          <TableHead style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Action</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((ord) => (
                        <TableRow key={ord._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <TableCell style={{ padding: '12px 16px', fontWeight: 600, color: '#111827', fontSize: '0.8125rem' }}>
                            #{ord.orderNumber || ord._id.slice(-6)}
                          </TableCell>
                          <TableCell style={{ padding: '12px 16px', fontSize: '0.8125rem', color: '#374151' }}>
                            {ord.retailer?.name || ord.retailer?.businessName || 'Retailer'}
                          </TableCell>
                          <TableCell style={{ padding: '12px 16px', fontWeight: 700, color: '#2563EB', fontSize: '0.8125rem' }}>
                            {fmt(ord.totalAmount)}
                          </TableCell>
                          <TableCell style={{ padding: '12px 16px' }}>
                            <Badge status={ord.status} />
                          </TableCell>
                          <TableCell style={{ padding: '12px 16px', fontSize: '0.78125rem', color: '#6B7280' }}>
                            {formatDate(ord.createdAt)}
                          </TableCell>
                          {onNavigateOrder && (
                            <TableCell style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <button
                                onClick={() => onNavigateOrder(ord._id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#2563EB',
                                  cursor: 'pointer',
                                  fontSize: '0.78125rem',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                View <ExternalLink size={12} />
                              </button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Retailers Section */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <CardHeader style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <CardTitle style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Store size={16} style={{ color: '#2563EB' }} /> Served & Assigned Retailers
              </CardTitle>
              <span style={{ fontSize: '0.78125rem', color: '#6B7280', fontWeight: 500 }}>
                {assignedRetailersList.length} retailers served
              </span>
            </CardHeader>
            <CardContent style={{ padding: 0 }}>
              {assignedRetailersList.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: '#6B7280', fontSize: '0.875rem' }}>
                  No order history with retailers registered yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHeader>
                      <TableRow style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
                        <TableHead style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Retailer Name</TableHead>
                        <TableHead style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Orders Served</TableHead>
                        <TableHead style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total Sales Value</TableHead>
                        {onNavigateRetailer && (
                          <TableHead style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Action</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedRetailersList.map((ret) => (
                        <TableRow key={ret._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <TableCell style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.8125rem' }}>{ret.name}</div>
                            {ret.businessName && (
                              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{ret.businessName}</div>
                            )}
                          </TableCell>
                          <TableCell style={{ padding: '12px 16px', fontSize: '0.8125rem', color: '#374151' }}>
                            {ret.orderCount} order{ret.orderCount > 1 ? 's' : ''}
                          </TableCell>
                          <TableCell style={{ padding: '12px 16px', fontWeight: 600, color: '#2563EB', fontSize: '0.8125rem' }}>
                            {fmt(ret.totalSpent)}
                          </TableCell>
                          {onNavigateRetailer && (
                            <TableCell style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <button
                                onClick={() => onNavigateRetailer(ret._id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#2563EB',
                                  cursor: 'pointer',
                                  fontSize: '0.78125rem',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                Retailer 360 <ExternalLink size={12} />
                              </button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL: EDIT SALESMAN */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>Edit Salesman Profile</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleEditSubmit}>
          <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {modalError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 14px', borderRadius: 8, color: '#991B1B', fontSize: '0.8125rem' }}>
                {modalError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Full Name <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Phone Number
                </label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  City / Location
                </label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Assigned Route / Territory
                </label>
                <Input
                  value={editForm.route}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, route: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Account Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
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
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={updating}>
              {updating ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL: DEACTIVATION / REACTIVATION CONFIRMATION */}
      <Modal open={deactivateModalOpen} onClose={() => setDeactivateModalOpen(false)}>
        <ModalHeader>
          <ModalTitle style={{ color: isSuspended ? '#2563EB' : '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} /> {isSuspended ? 'Reactivate Salesman Account' : 'Deactivate Salesman Account'}
          </ModalTitle>
        </ModalHeader>
        <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>
            Are you sure you want to {isSuspended ? 'reactivate' : 'deactivate'}{' '}
            <strong style={{ color: '#111827' }}>{salesman.name}</strong>?
          </p>
          <div
            style={{
              background: isSuspended ? '#EFF6FF' : '#FEF2F2',
              border: `1px solid ${isSuspended ? '#BFDBFE' : '#FCA5A5'}`,
              padding: '12px 14px',
              borderRadius: 8,
              fontSize: '0.8125rem',
              color: isSuspended ? '#1E40AF' : '#991B1B'
            }}
          >
            <strong>Consequences:</strong>
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              {isSuspended ? (
                <li>The salesman will be restored and allowed to log into the mobile app again.</li>
              ) : (
                <li>The salesman will be suspended from logging into the mobile application.</li>
              )}
              <li>All historical orders and performance data remain intact.</li>
            </ul>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" size="sm" onClick={() => setDeactivateModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDeactivateToggle}
            disabled={deactivating}
            style={{
              background: isSuspended ? '#2563EB' : '#DC2626',
              borderColor: isSuspended ? '#2563EB' : '#DC2626'
            }}
          >
            {deactivating ? (isSuspended ? 'Reactivating...' : 'Deactivating...') : isSuspended ? 'Confirm Reactivation' : 'Confirm Deactivation'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
