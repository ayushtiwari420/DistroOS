import React, { useState, useEffect, useCallback } from 'react'
import {
  Store,
  Plus,
  Search,
  RefreshCw,
  UserCheck,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Filter,
  X,
  ChevronRight,
  ShieldAlert
} from 'lucide-react'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, TablePagination } from '../../../../components/ui/Table'
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../../../components/ui/Modal'
import { SkeletonTable, SkeletonCard } from '../../../../components/ui/Skeleton'
import EmptyState from '../../../../components/ui/EmptyState'
import Badge from '../../../../components/ui/Badges'
import { apiClient } from '../../../../api/client'
import RetailerDetailView from './RetailerDetailView'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const getInitials = (name) => {
  if (!name) return 'RT'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function RetailersTab() {
  const [retailers, setRetailers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [selectedRetailerId, setSelectedRetailerId] = useState(null)

  // Filters & Search State
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [creditFilter, setCreditFilter] = useState('all')
  const [sort, setSort] = useState('name_asc')
  const [page, setPage] = useState(1)

  // Add / Link Modal State
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addTab, setAddTab] = useState('link') // 'link' | 'create'
  const [linkForm, setLinkForm] = useState({ email: '', creditLimit: '' })
  const [searchingEmail, setSearchingEmail] = useState(false)
  const [foundRetailer, setFoundRetailer] = useState(null)
  const [linking, setLinking] = useState(false)

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    city: '',
    password: '',
    creditLimit: '',
  })
  const [creating, setCreating] = useState(false)
  const [modalError, setModalError] = useState(null)

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    phone: '',
    businessName: '',
    city: '',
    status: 'active',
    creditLimit: '',
  })
  const [updating, setUpdating] = useState(false)

  // Unlink Dialog State
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false)
  const [selectedUnlinkRetailer, setSelectedUnlinkRetailer] = useState(null)
  const [unlinking, setUnlinking] = useState(false)

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch Retailers from Backend
  const loadRetailers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim())
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await apiClient(`/retailers?${params.toString()}`)
      let list = res.retailers || []

      // Client-side Credit Filter
      if (creditFilter === 'due') {
        list = list.filter((r) => (r.credit?.currentDue || 0) > 0)
      } else if (creditFilter === 'clear') {
        list = list.filter((r) => (r.credit?.currentDue || 0) === 0)
      } else if (creditFilter === 'overdue') {
        list = list.filter((r) => r.credit?.status === 'overdue' || (r.credit?.currentDue || 0) > 0)
      }

      // Client-side Sort
      if (sort === 'name_asc') {
        list.sort((a, b) => (a.businessName || a.name || '').localeCompare(b.businessName || b.name || ''))
      } else if (sort === 'name_desc') {
        list.sort((a, b) => (b.businessName || b.name || '').localeCompare(a.businessName || a.name || ''))
      } else if (sort === 'newest') {
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      } else if (sort === 'oldest') {
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      } else if (sort === 'due_high') {
        list.sort((a, b) => (b.credit?.currentDue || 0) - (a.credit?.currentDue || 0))
      }

      setRetailers(list)
    } catch (err) {
      console.error('Fetch retailers error:', err)
      setError(err.message || 'Failed to load retailers.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [debouncedSearch, statusFilter, creditFilter, sort])

  useEffect(() => {
    loadRetailers()
  }, [loadRetailers])

  // Summary Metrics Derived Real Data
  const totalRetailers = retailers.length
  const activeCount = retailers.filter((r) => r.status === 'active').length
  const totalCreditLimit = retailers.reduce((acc, r) => acc + (r.credit?.creditLimit || 0), 0)
  const totalCreditDue = retailers.reduce((acc, r) => acc + (r.credit?.currentDue || 0), 0)
  const retailersWithDue = retailers.filter((r) => (r.credit?.currentDue || 0) > 0).length

  // Filter Reset Handler
  const handleClearFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setStatusFilter('all')
    setCreditFilter('all')
    setSort('name_asc')
    setPage(1)
  }

  const hasActiveFilters = Boolean(search.trim() || statusFilter !== 'all' || creditFilter !== 'all' || sort !== 'name_asc')

  // Search Email Handler for Link Flow
  const handleSearchEmail = async () => {
    if (!linkForm.email.trim()) return
    setSearchingEmail(true)
    setModalError(null)
    setFoundRetailer(null)

    try {
      const res = await apiClient('/retailers/search', {
        method: 'POST',
        body: JSON.stringify({ email: linkForm.email.trim() }),
      })
      setFoundRetailer(res)
    } catch (err) {
      setModalError(err.message || 'No retailer account found with this email.')
    } finally {
      setSearchingEmail(false)
    }
  }

  // Link Retailer Submit
  const handleLinkSubmit = async (e) => {
    e.preventDefault()
    setLinking(true)
    setModalError(null)

    try {
      await apiClient('/retailers/link', {
        method: 'POST',
        body: JSON.stringify({
          email: linkForm.email.trim(),
          creditLimit: Number(linkForm.creditLimit) || 0,
        }),
      })
      setAddModalOpen(false)
      setLinkForm({ email: '', creditLimit: '' })
      setFoundRetailer(null)
      loadRetailers(true)
    } catch (err) {
      setModalError(err.message || 'Failed to link retailer.')
    } finally {
      setLinking(false)
    }
  }

  // Create Retailer Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)
    setModalError(null)

    try {
      await apiClient('/retailers', {
        method: 'POST',
        body: JSON.stringify({
          ...createForm,
          creditLimit: Number(createForm.creditLimit) || 0,
        }),
      })
      setAddModalOpen(false)
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        businessName: '',
        city: '',
        password: '',
        creditLimit: '',
      })
      loadRetailers(true)
    } catch (err) {
      setModalError(err.message || 'Failed to create retailer.')
    } finally {
      setCreating(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (retailer) => {
    setEditForm({
      id: retailer._id,
      name: retailer.name || '',
      phone: retailer.phone || '',
      businessName: retailer.businessName || '',
      city: retailer.city || '',
      status: retailer.status || 'active',
      creditLimit: retailer.credit?.creditLimit !== undefined ? retailer.credit.creditLimit : '',
    })
    setModalError(null)
    setEditModalOpen(true)
  }

  // Edit Retailer Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setModalError(null)

    try {
      await apiClient(`/retailers/${editForm.id}`, {
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
      loadRetailers(true)
    } catch (err) {
      setModalError(err.message || 'Failed to update retailer.')
    } finally {
      setUpdating(false)
    }
  }

  // Handle Unlink / Delete
  const handleUnlinkSubmit = async () => {
    if (!selectedUnlinkRetailer) return
    setUnlinking(true)
    setModalError(null)

    try {
      await apiClient(`/retailers/${selectedUnlinkRetailer._id}`, {
        method: 'DELETE',
      })
      setUnlinkModalOpen(false)
      setSelectedUnlinkRetailer(null)
      loadRetailers(true)
    } catch (err) {
      setModalError(err.message || 'Failed to unlink retailer.')
    } finally {
      setUnlinking(false)
    }
  }

  // Render Retailer 360 view if selectedRetailerId is set
  if (selectedRetailerId) {
    return (
      <RetailerDetailView
        retailerId={selectedRetailerId}
        onBack={() => {
          setSelectedRetailerId(null)
          loadRetailers(true)
        }}
      />
    )
  }

  // Pagination Math
  const pageSize = 15
  const totalItems = retailers.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedRetailers = retailers.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. CONTEXTUAL PAGE HEADER
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
            Retailers
          </h2>
          <p className="text-xs text-slate-500">
            Manage your retail network and customer relationships.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" onClick={() => loadRetailers(true)} loading={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            Refresh
          </Button>

          <Button variant="primary" size="sm" onClick={() => { setAddModalOpen(true); setModalError(null); }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Retailer
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SUMMARY METRICS ROW
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                TOTAL RETAILERS
              </div>
              <div className="text-xl font-bold font-display text-slate-900 mt-1">
                {totalRetailers}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Connected accounts</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Store className="w-4 h-4 stroke-[1.75]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                ACTIVE ACCOUNTS
              </div>
              <div className="text-xl font-bold font-display text-slate-900 mt-1">
                {activeCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Ready for orders</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <CheckCircle2 className="w-4 h-4 stroke-[1.75]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                CREDIT EXTENDED
              </div>
              <div className="text-xl font-bold font-display text-slate-900 mt-1">
                {fmt(totalCreditLimit)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Total limit granted</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <CreditCard className="w-4 h-4 stroke-[1.75]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                OUTSTANDING DUE
              </div>
              <div className="text-xl font-bold font-display text-slate-900 mt-1">
                {fmt(totalCreditDue)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across {retailersWithDue} retailers</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Building2 className="w-4 h-4 stroke-[1.75]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SEARCH, FILTER BAR & SORTING
         ───────────────────────────────────────────────────────────── */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search retailers by name, business or city..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Sorting Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600 font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Credit Filter */}
            <select
              value={creditFilter}
              onChange={(e) => { setCreditFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600 font-medium cursor-pointer"
            >
              <option value="all">All Credit Statuses</option>
              <option value="due">With Balance Due</option>
              <option value="clear">Zero Balance</option>
              <option value="overdue">Overdue Accounts</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600 font-medium cursor-pointer"
            >
              <option value="name_asc">Name: A → Z</option>
              <option value="name_desc">Name: Z → A</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="due_high">Highest Due First</option>
            </select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="w-3.5 h-3.5 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          4. RETAILERS TABLE & RESPONSIVE VIEW
         ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : error ? (
        <div className="p-6 text-center bg-white border border-slate-200 rounded-xl space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">Couldn't load retailers</h3>
          <p className="text-xs text-slate-500">{error}</p>
          <Button variant="primary" size="sm" onClick={() => loadRetailers()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Try Again
          </Button>
        </div>
      ) : retailers.length === 0 ? (
        <EmptyState
          icon={Store}
          title={hasActiveFilters ? 'No retailers match your search' : 'No retailers linked yet'}
          description={
            hasActiveFilters
              ? 'Try adjusting your search query or filter options.'
              : 'Link an existing retailer or create a new account to get started.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => setAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Retailer
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Retailer Account</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Credit Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedRetailers.map((r) => {
                  const initials = getInitials(r.businessName || r.name)
                  const due = r.credit?.currentDue || 0
                  const limit = r.credit?.creditLimit || 0
                  const isOverdue = r.credit?.status === 'overdue'

                  return (
                    <TableRow key={r._id}>
                      {/* Retailer Cell */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => setSelectedRetailerId(r._id)}
                              className="font-semibold text-slate-900 hover:text-blue-600 text-left transition-colors truncate block"
                            >
                              {r.businessName || r.name}
                            </button>
                            {r.businessName && r.name && (
                              <span className="text-[11px] text-slate-500 block truncate">
                                Contact: {r.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* City Cell */}
                      <TableCell>
                        <span className="text-slate-700 font-medium">{r.city || '—'}</span>
                      </TableCell>

                      {/* Contact Cell */}
                      <TableCell>
                        <div className="space-y-0.5 text-[11px]">
                          {r.phone && <div className="text-slate-700 font-medium">{r.phone}</div>}
                          {r.email && <div className="text-slate-400 truncate max-w-[160px]">{r.email}</div>}
                        </div>
                      </TableCell>

                      {/* Credit Balance Cell */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className={`font-bold font-display text-xs ${isOverdue ? 'text-red-600' : due > 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                            {fmt(due)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Limit: {fmt(limit)}
                          </div>
                        </div>
                      </TableCell>

                      {/* Status Cell */}
                      <TableCell>
                        <Badge status={r.status || 'active'} />
                      </TableCell>

                      {/* Actions Cell */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRetailerId(r._id)}
                            title="View Retailer 360"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(r)}
                            title="Edit Retailer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => { setSelectedUnlinkRetailer(r); setUnlinkModalOpen(true); }}
                            title="Unlink Retailer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View (< 768px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {paginatedRetailers.map((r) => {
              const initials = getInitials(r.businessName || r.name)
              const due = r.credit?.currentDue || 0
              const limit = r.credit?.creditLimit || 0

              return (
                <Card key={r._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                        {initials}
                      </div>
                      <div>
                        <button
                          onClick={() => setSelectedRetailerId(r._id)}
                          className="font-semibold text-slate-900 hover:text-blue-600 text-left transition-colors"
                        >
                          {r.businessName || r.name}
                        </button>
                        <div className="text-[11px] text-slate-500">{r.city || 'No location'}</div>
                      </div>
                    </div>

                    <Badge status={r.status || 'active'} />
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Outstanding</span>
                      <span className="font-bold text-slate-900">{fmt(due)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Credit Limit</span>
                      <span className="font-semibold text-slate-600">{fmt(limit)}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => setSelectedRetailerId(r._id)}
                    >
                      View Profile
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditModal(r)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Pagination Footer */}
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. ADD / LINK RETAILER MODAL
         ───────────────────────────────────────────────────────────── */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <ModalHeader onClose={() => setAddModalOpen(false)}>
          <ModalTitle>Add Retailer Account</ModalTitle>
        </ModalHeader>

        {/* Modal Tabs Header */}
        <div className="px-6 pt-2 border-b border-slate-100 flex gap-4 text-xs font-semibold select-none">
          <button
            onClick={() => { setAddTab('link'); setModalError(null); }}
            className={`pb-2.5 border-b-2 transition-colors ${
              addTab === 'link'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Link Existing Account
          </button>
          <button
            onClick={() => { setAddTab('create'); setModalError(null); }}
            className={`pb-2.5 border-b-2 transition-colors ${
              addTab === 'create'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create New Retailer
          </button>
        </div>

        <ModalBody className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* LINK EXISTING RETAILER TAB */}
          {addTab === 'link' && (
            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <p className="text-xs text-slate-500">
                Search for an existing retailer registered on DistroOS by their email address.
              </p>

              <div className="space-y-1">
                <label className="form-label text-xs">Retailer Email Address</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={linkForm.email}
                    onChange={(e) => setLinkForm({ ...linkForm, email: e.target.value })}
                    placeholder="retailer@example.com"
                    className="input text-xs flex-1"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={handleSearchEmail}
                    loading={searchingEmail}
                  >
                    Search
                  </Button>
                </div>
              </div>

              {/* Found Retailer Preview */}
              {foundRetailer && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-900">
                    {foundRetailer.retailer.businessName || foundRetailer.retailer.name}
                  </div>
                  <div className="text-slate-500">
                    {foundRetailer.retailer.name} • {foundRetailer.retailer.city || 'No city'}
                  </div>

                  {foundRetailer.alreadyLinked ? (
                    <div className="text-amber-600 font-semibold text-[11px] pt-1">
                      ⚠️ This retailer is already linked to your account.
                    </div>
                  ) : (
                    <div className="text-emerald-600 font-semibold text-[11px] pt-1">
                      ✓ Ready to link
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="form-label text-xs">Initial Credit Limit (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={linkForm.creditLimit}
                  onChange={(e) => setLinkForm({ ...linkForm, creditLimit: e.target.value })}
                  placeholder="e.g. 50000"
                  className="input text-xs"
                />
              </div>

              <ModalFooter className="px-0 pb-0 border-t-0">
                <Button variant="ghost" size="sm" type="button" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={linking}
                  disabled={foundRetailer?.alreadyLinked}
                >
                  Link Retailer
                </Button>
              </ModalFooter>
            </form>
          )}

          {/* CREATE NEW RETAILER TAB */}
          {addTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="form-label text-xs">Business Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.businessName}
                    onChange={(e) => setCreateForm({ ...createForm, businessName: e.target.value })}
                    placeholder="e.g. Raj Traders"
                    className="input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="form-label text-xs">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Rajesh Kumar"
                    className="input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="form-label text-xs">Email Address</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="retailer@example.com"
                    className="input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="form-label text-xs">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="form-label text-xs">City / Location</label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="form-label text-xs">Credit Limit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.creditLimit}
                    onChange={(e) => setCreateForm({ ...createForm, creditLimit: e.target.value })}
                    placeholder="e.g. 50000"
                    className="input text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="form-label text-xs">Temporary Password</label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Default: Retailer@123"
                  className="input text-xs"
                />
              </div>

              <ModalFooter className="px-0 pb-0 border-t-0 pt-3">
                <Button variant="ghost" size="sm" type="button" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={creating}>
                  Create & Link Retailer
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalBody>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          6. EDIT RETAILER MODAL
         ───────────────────────────────────────────────────────────── */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <ModalHeader onClose={() => setEditModalOpen(false)}>
          <ModalTitle>Edit Retailer Details</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleEditSubmit}>
          <ModalBody className="space-y-3">
            {modalError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="form-label text-xs">Business Name</label>
                <input
                  type="text"
                  required
                  value={editForm.businessName}
                  onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="form-label text-xs">Contact Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="form-label text-xs">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="form-label text-xs">City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="form-label text-xs">Account Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="select text-xs"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="form-label text-xs">Credit Limit (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.creditLimit}
                  onChange={(e) => setEditForm({ ...editForm, creditLimit: e.target.value })}
                  className="input text-xs"
                />
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" size="sm" type="button" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={updating}>
              Save Changes
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          7. UNLINK CONFIRMATION DIALOG
         ───────────────────────────────────────────────────────────── */}
      <Modal open={unlinkModalOpen} onClose={() => setUnlinkModalOpen(false)}>
        <ModalHeader onClose={() => setUnlinkModalOpen(false)}>
          <ModalTitle>Unlink Retailer Account</ModalTitle>
        </ModalHeader>

        <ModalBody className="space-y-3">
          <p className="text-xs text-slate-600">
            Are you sure you want to unlink{' '}
            <strong className="text-slate-900">
              {selectedUnlinkRetailer?.businessName || selectedUnlinkRetailer?.name}
            </strong>{' '}
            from your account?
          </p>
          <p className="text-[11px] text-slate-500">
            The retailer account will remain intact, but will no longer appear in your active network until re-linked.
          </p>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={() => setUnlinkModalOpen(false)}>
            Keep Linked
          </Button>
          <Button variant="danger" size="sm" loading={unlinking} onClick={handleUnlinkSubmit}>
            Unlink Retailer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
