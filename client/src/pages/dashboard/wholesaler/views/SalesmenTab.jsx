import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Filter,
  ArrowUpDown,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
  Lock
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
import SalesmanDetailView from './SalesmanDetailView'

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

export default function SalesmenTab() {
  const [salesmen, setSalesmen] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [selectedSalesmanId, setSelectedSalesmanId] = useState(null)

  // Filters & Search State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  // Add Modal State
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    route: '',
    password: '',
  })
  const [creating, setCreating] = useState(false)
  const [modalError, setModalError] = useState(null)

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    phone: '',
    city: '',
    route: '',
    status: 'active',
  })
  const [updating, setUpdating] = useState(false)

  // Delete / Deactivate Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [salesmanToDelete, setSalesmanToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Detail Modal / View State
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedSalesmanDetail, setSelectedSalesmanDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Fetch Salesmen
  const loadSalesmen = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await svc.getSalesmen()
      setSalesmen(res.salesmen || [])
    } catch (err) {
      setError(err.message || 'Failed to load salesmen. Please check your connection.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadSalesmen()
  }, [loadSalesmen])

  // Handlers for Add
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setModalError(null)

    if (!createForm.name.trim()) {
      setModalError('Salesman full name is required.')
      return
    }
    if (!createForm.email.trim()) {
      setModalError('Valid email address is required for login.')
      return
    }
    if (!createForm.password || createForm.password.length < 8) {
      setModalError('Password must be at least 8 characters long.')
      return
    }

    setCreating(true)
    try {
      await svc.createSalesman({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        city: createForm.city.trim(),
        route: createForm.route.trim(),
        password: createForm.password,
      })
      setAddModalOpen(false)
      setCreateForm({ name: '', email: '', phone: '', city: '', route: '', password: '' })
      loadSalesmen(true)
    } catch (err) {
      setModalError(err.message || 'Failed to add salesman.')
    } finally {
      setCreating(false)
    }
  }

  // Handlers for Edit
  const openEditModal = (s) => {
    setEditForm({
      id: s._id,
      name: s.name || '',
      phone: s.phone || '',
      city: s.city || '',
      route: s.businessName || '',
      status: s.status || 'active',
    })
    setModalError(null)
    setEditModalOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setModalError(null)

    if (!editForm.name.trim()) {
      setModalError('Salesman name cannot be empty.')
      return
    }

    setUpdating(true)
    try {
      await svc.updateSalesman(editForm.id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        city: editForm.city.trim(),
        businessName: editForm.route.trim(),
        status: editForm.status,
      })
      setEditModalOpen(false)
      loadSalesmen(true)
    } catch (err) {
      setModalError(err.message || 'Failed to update salesman.')
    } finally {
      setUpdating(false)
    }
  }

  // Handlers for Delete / Deactivate
  const openDeleteModal = (s) => {
    setSalesmanToDelete(s)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!salesmanToDelete) return
    setDeleting(true)
    try {
      await svc.deleteSalesman(salesmanToDelete._id)
      setDeleteModalOpen(false)
      setSalesmanToDelete(null)
      loadSalesmen(true)
    } catch (err) {
      setError(err.message || 'Failed to deactivate salesman.')
    } finally {
      setDeleting(false)
    }
  }

  // Handlers for View Details
  const openDetailModal = (s) => {
    setSelectedSalesmanId(s._id)
  }

  // Filter & Sort Logic
  const filteredSalesmen = salesmen.filter((s) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.businessName && s.businessName.toLowerCase().includes(q))

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.status === 'active') ||
      (statusFilter === 'suspended' && s.status !== 'active')

    return matchesSearch && matchesStatus
  })

  const sortedSalesmen = [...filteredSalesmen].sort((a, b) => {
    if (sort === 'name_asc') return (a.name || '').localeCompare(b.name || '')
    if (sort === 'name_desc') return (b.name || '').localeCompare(a.name || '')
    if (sort === 'orders_high') return (b.stats?.totalOrders || 0) - (a.stats?.totalOrders || 0)
    if (sort === 'revenue_high') return (b.stats?.revenue || 0) - (a.stats?.revenue || 0)
    if (sort === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0) // 'newest' default
  })

  // Pagination calculation
  const totalPages = Math.ceil(sortedSalesmen.length / itemsPerPage) || 1
  const paginatedSalesmen = sortedSalesmen.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setSort('newest')
    setPage(1)
  }

  // Calculate real metrics from backend data
  const totalCount = salesmen.length
  const activeCount = salesmen.filter((s) => s.status === 'active').length
  const inactiveCount = totalCount - activeCount
  const totalOrdersDelivered = salesmen.reduce((acc, s) => acc + (s.stats?.totalOrders || 0), 0)
  const totalRevenue = salesmen.reduce((acc, s) => acc + (s.stats?.revenue || 0), 0)

  // Render Salesman Detail view if selectedSalesmanId is set
  if (selectedSalesmanId) {
    return (
      <SalesmanDetailView
        salesmanId={selectedSalesmanId}
        onBack={() => setSelectedSalesmanId(null)}
      />
    )
  }

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
          padding: '16px 20px',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              Salesmen
            </h1>
          </div>
          <p style={{ margin: '3px 0 0 0', fontSize: '0.8125rem', color: '#6B7280' }}>
            Manage your field sales team, routes, and performance metrics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSalesmen(true)}
            disabled={refreshing || loading}
            icon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setModalError(null)
              setCreateForm({ name: '', email: '', phone: '', city: '', route: '', password: '' })
              setAddModalOpen(true)
            }}
            icon={<Plus size={15} />}
          >
            Add Salesman
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
          <Button variant="outline" size="sm" onClick={() => loadSalesmen(true)}>
            Try Again
          </Button>
        </div>
      )}

      {/* SUMMARY METRICS */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {/* Total Salesmen */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <CardContent style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Salesmen
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} style={{ color: '#2563EB' }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', fontFamily: 'Manrope, Inter, sans-serif' }}>
                  {totalCount}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                Registered team members
              </div>
            </CardContent>
          </Card>

          {/* Active Salesmen */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <CardContent style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Team
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={18} style={{ color: '#16A34A' }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', fontFamily: 'Manrope, Inter, sans-serif' }}>
                  {activeCount}
                </span>
                {inactiveCount > 0 && (
                  <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#6B7280' }}>
                    ({inactiveCount} suspended)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                Active field representatives
              </div>
            </CardContent>
          </Card>

          {/* Total Orders Delivered */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <CardContent style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Orders Delivered
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={18} style={{ color: '#2563EB' }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', fontFamily: 'Manrope, Inter, sans-serif' }}>
                  {totalOrdersDelivered.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                Fulfilled by sales team
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue Generated */}
          <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <CardContent style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Sales Revenue
                </span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={18} style={{ color: '#2563EB' }} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', fontFamily: 'Manrope, Inter, sans-serif' }}>
                  {fmt(totalRevenue)}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                Total delivered sales value
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
              placeholder="Search name, phone, email, route..."
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

          {/* Status Filter */}
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
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
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
            <option value="name_asc">Sort: Name (A - Z)</option>
            <option value="name_desc">Sort: Name (Z - A)</option>
            <option value="orders_high">Sort: Highest Orders</option>
            <option value="revenue_high">Sort: Highest Revenue</option>
          </select>

          {(search || statusFilter !== 'all' || sort !== 'newest') && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} icon={<X size={14} />}>
              Reset Filters
            </Button>
          )}
        </div>

        <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500 }}>
          Showing <strong>{filteredSalesmen.length}</strong> of {totalCount} salesmen
        </div>
      </div>

      {/* SALESMEN TABLE / CARDS */}
      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : sortedSalesmen.length === 0 ? (
        <Card style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12 }}>
          <CardContent style={{ padding: '48px 24px' }}>
            <EmptyState
              icon={Users}
              title={search || statusFilter !== 'all' ? 'No salesmen match your criteria' : 'No salesmen added yet'}
              description={
                search || statusFilter !== 'all'
                  ? 'Try adjusting your search query or status filters.'
                  : 'Add your field sales team to assign routes, manage orders, and track sales performance.'
              }
              action={
                search || statusFilter !== 'all' ? (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setModalError(null)
                      setCreateForm({ name: '', email: '', phone: '', city: '', route: '', password: '' })
                      setAddModalOpen(true)
                    }}
                    icon={<Plus size={15} />}
                  >
                    Add First Salesman
                  </Button>
                )
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
                    Salesman
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Contact & Route
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Orders
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Revenue
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Status
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase' }}>
                    Joined
                  </TableHead>
                  <TableHead style={{ padding: '12px 18px', fontWeight: 600, color: '#374151', fontSize: '0.78125rem', textTransform: 'uppercase', textAlign: 'right' }}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSalesmen.map((s) => {
                  const isSuspended = s.status !== 'active'
                  return (
                    <TableRow key={s._id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }}>
                      {/* Identity */}
                      <TableCell style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#2563EB',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(s.name)}
                          </div>
                          <div>
                            <button
                              onClick={() => openDetailModal(s)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                fontWeight: 600,
                                color: '#111827',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              {s.name}
                            </button>
                            <div style={{ fontSize: '0.78125rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Mail size={12} style={{ color: '#9CA3AF' }} />
                              {s.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact & Route */}
                      <TableCell style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.8125rem' }}>
                          <div style={{ color: '#374151', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Phone size={13} style={{ color: '#9CA3AF' }} />
                            {s.phone || 'No phone'}
                          </div>
                          <div style={{ color: '#6B7280', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <MapPin size={13} style={{ color: '#9CA3AF' }} />
                            {s.businessName || s.city ? `${s.businessName || 'Route N/A'}${s.city ? ` (${s.city})` : ''}` : 'Unassigned route'}
                          </div>
                        </div>
                      </TableCell>

                      {/* Orders */}
                      <TableCell style={{ padding: '14px 18px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                            {s.stats?.totalOrders || 0} total
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                            {s.stats?.monthlyOrders || 0} this month
                          </div>
                        </div>
                      </TableCell>

                      {/* Revenue */}
                      <TableCell style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#2563EB', fontSize: '0.875rem' }}>
                          {fmt(s.stats?.revenue || 0)}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell style={{ padding: '14px 18px' }}>
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
                      </TableCell>

                      {/* Joined */}
                      <TableCell style={{ padding: '14px 18px', fontSize: '0.78125rem', color: '#6B7280' }}>
                        {formatDate(s.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            onClick={() => openDetailModal(s)}
                            title="View Salesman Details"
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
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => openEditModal(s)}
                            title="Edit Salesman"
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid #E5E7EB',
                              background: '#FFFFFF',
                              color: '#2563EB',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => openDeleteModal(s)}
                            title="Deactivate Salesman"
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid #E5E7EB',
                              background: '#FFFFFF',
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <Trash2 size={14} />
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
            {paginatedSalesmen.map((s) => {
              const isSuspended = s.status !== 'active'
              return (
                <div
                  key={s._id}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          color: '#2563EB',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getInitials(s.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{s.email}</div>
                      </div>
                    </div>
                    {isSuspended ? (
                      <span style={{ background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600 }}>
                        Suspended
                      </span>
                    ) : (
                      <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600 }}>
                        Active
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.78125rem', color: '#4B5563', display: 'flex', flexDirection: 'column', gap: 4, background: '#F8FAFC', padding: 8, borderRadius: 6 }}>
                    <div>📞 {s.phone || 'No phone'}</div>
                    <div>📍 Route: {s.businessName || 'Unassigned'} {s.city ? `(${s.city})` : ''}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'center', background: '#F8FAFC', padding: 8, borderRadius: 6 }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase' }}>Orders</div>
                      <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.875rem' }}>{s.stats?.totalOrders || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase' }}>Revenue</div>
                      <div style={{ fontWeight: 700, color: '#2563EB', fontSize: '0.875rem' }}>{fmt(s.stats?.revenue || 0)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, pt: 4 }}>
                    <Button variant="outline" size="sm" onClick={() => openDetailModal(s)} icon={<Eye size={13} />}>
                      Details
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditModal(s)} icon={<Edit2 size={13} />}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openDeleteModal(s)} style={{ color: '#DC2626', borderColor: '#FCA5A5' }} icon={<Trash2 size={13} />}>
                      Deactivate
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

      {/* MODAL: ADD SALESMAN */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>Add New Salesman</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleCreateSubmit}>
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
                placeholder="e.g. Rahul Sharma"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Email Address <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <Input
                  type="email"
                  placeholder="salesman@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Phone Number
                </label>
                <Input
                  placeholder="+91 9876543210"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  City / Location
                </label>
                <Input
                  placeholder="e.g. Mumbai"
                  value={createForm.city}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Assigned Route / Territory
                </label>
                <Input
                  placeholder="e.g. South Zone Market"
                  value={createForm.route}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, route: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Account Password <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <Input
                type="password"
                placeholder="Minimum 8 characters"
                value={createForm.password}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#6B7280' }}>
                The salesman will use this password to log in on the DistroOS mobile app.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={creating}>
              {creating ? 'Adding Salesman...' : 'Add Salesman'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL: EDIT SALESMAN */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>Edit Salesman Information</ModalTitle>
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
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* MODAL: CONFIRM DEACTIVATION */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalHeader>
          <ModalTitle style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} /> Deactivate Salesman Account
          </ModalTitle>
        </ModalHeader>
        <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>
            Are you sure you want to deactivate{' '}
            <strong style={{ color: '#111827' }}>{salesmanToDelete?.name}</strong>?
          </p>
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '12px 14px', borderRadius: 8, fontSize: '0.8125rem', color: '#991B1B' }}>
            <strong>Consequences of deactivation:</strong>
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              <li>The salesman will immediately be suspended from logging into the mobile application.</li>
              <li>Existing order history and historical metrics will be safely preserved.</li>
              <li>You can reactivate this salesman anytime from the edit dialog.</li>
            </ul>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDeleteConfirm}
            disabled={deleting}
            style={{ background: '#DC2626', borderColor: '#DC2626' }}
          >
            {deleting ? 'Deactivating...' : 'Confirm Deactivation'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* MODAL: SALESMAN DETAILS & RECENT ORDERS */}
      <Modal open={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>Salesman Profile & Performance</ModalTitle>
        </ModalHeader>
        <ModalBody style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loadingDetail ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#6B7280', fontSize: '0.875rem' }}>
              Loading salesman performance history...
            </div>
          ) : selectedSalesmanDetail ? (
            <>
              {/* Salesman Info Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', padding: 16, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#2563EB',
                    fontWeight: 700,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(selectedSalesmanDetail.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                    {selectedSalesmanDetail.name}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                    {selectedSalesmanDetail.email} • {selectedSalesmanDetail.phone || 'No phone'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 600, marginTop: 2 }}>
                    Route: {selectedSalesmanDetail.businessName || 'Unassigned'} {selectedSalesmanDetail.city ? `(${selectedSalesmanDetail.city})` : ''}
                  </div>
                </div>
                <Badge status={selectedSalesmanDetail.status} />
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '12px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500 }}>Total Revenue Delivered</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563EB', marginTop: 2 }}>
                    {fmt(selectedSalesmanDetail.totalRevenue || selectedSalesmanDetail.stats?.revenue || 0)}
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '12px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500 }}>Total Orders</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: 2 }}>
                    {selectedSalesmanDetail.stats?.totalOrders || selectedSalesmanDetail.recentOrders?.length || 0}
                  </div>
                </div>
              </div>

              {/* Recent Orders List */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
                  Recent Orders Placed by {selectedSalesmanDetail.name}
                </h4>
                {!selectedSalesmanDetail.recentOrders || selectedSalesmanDetail.recentOrders.length === 0 ? (
                  <div style={{ background: '#FFFFFF', border: '1px dashed #D1D5DB', padding: '20px', borderRadius: 8, textAlign: 'center', color: '#6B7280', fontSize: '0.8125rem' }}>
                    No recent orders placed by this salesman yet.
                  </div>
                ) : (
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                    <Table>
                      <TableHeader>
                        <TableRow style={{ background: '#F8FAFC' }}>
                          <TableHead style={{ fontSize: '0.75rem', padding: '8px 12px' }}>Order #</TableHead>
                          <TableHead style={{ fontSize: '0.75rem', padding: '8px 12px' }}>Retailer</TableHead>
                          <TableHead style={{ fontSize: '0.75rem', padding: '8px 12px' }}>Amount</TableHead>
                          <TableHead style={{ fontSize: '0.75rem', padding: '8px 12px' }}>Status</TableHead>
                          <TableHead style={{ fontSize: '0.75rem', padding: '8px 12px' }}>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSalesmanDetail.recentOrders.map((ord) => (
                          <TableRow key={ord._id}>
                            <TableCell style={{ fontSize: '0.78125rem', fontWeight: 600, padding: '8px 12px' }}>
                              #{ord.orderNumber || ord._id.slice(-6)}
                            </TableCell>
                            <TableCell style={{ fontSize: '0.78125rem', padding: '8px 12px' }}>
                              {ord.retailer?.name || ord.retailer?.businessName || 'Retailer'}
                            </TableCell>
                            <TableCell style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#2563EB', padding: '8px 12px' }}>
                              {fmt(ord.totalAmount)}
                            </TableCell>
                            <TableCell style={{ padding: '8px 12px' }}>
                              <Badge status={ord.status} />
                            </TableCell>
                            <TableCell style={{ fontSize: '0.75rem', color: '#6B7280', padding: '8px 12px' }}>
                              {formatDate(ord.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          ) : null}
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
