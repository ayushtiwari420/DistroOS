import React, { useState, useEffect, useCallback } from 'react'
import {
  Package,
  Plus,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  SlidersHorizontal,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  ArrowUpDown,
  Boxes,
  Eye
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
import ProductDetailView from './ProductDetailView'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const sortOptions = [
  { value: 'newest', label: 'Newest Added' },
  { value: 'oldest', label: 'Oldest Added' },
  { value: 'name_asc', label: 'Name (A → Z)' },
  { value: 'name_desc', label: 'Name (Z → A)' },
  { value: 'price_asc', label: 'Price (Low → High)' },
  { value: 'price_desc', label: 'Price (High → Low)' },
  { value: 'stock_asc', label: 'Stock (Low → High)' },
  { value: 'stock_desc', label: 'Stock (High → Low)' },
]

export default function ProductsTab() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Filtering & Search State
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [stockFilter, setStockFilter] = useState('all') // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
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

  // Selection state
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedProductId, setSelectedProductId] = useState(null)

  // Modal / Drawer States
  const [activeModal, setActiveModal] = useState(null) // null | 'add' | 'edit' | 'stock' | 'import' | 'delete'
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Form State for Add / Edit
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    unit: 'piece',
    price: '',
    costPrice: '',
    stock: '',
    lowStockAt: 10,
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  // Stock adjustment state
  const [stockAdj, setStockAdj] = useState({ qty: '', type: 'add' })

  // Bulk import state
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  // Synchronize URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('search')) setSearch(params.get('search'))
    if (params.get('category')) setCategory(params.get('category'))
    if (params.get('stock')) setStockFilter(params.get('stock'))
    if (params.get('sort')) setSort(params.get('sort'))
    if (params.get('page')) setPage(Number(params.get('page')) || 1)
  }, [])

  // Fetch Products
  const loadProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      params.set('sort', sort)

      if (search.trim()) params.set('search', search.trim())
      if (category) params.set('category', category)
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)

      if (stockFilter === 'low_stock') {
        params.set('lowStock', 'true')
      }

      const res = await apiClient(`/products?${params.toString()}`)
      let fetched = res.products || []

      // Client-side stock status filter refinement if backend doesn't support out_of_stock directly
      if (stockFilter === 'out_of_stock') {
        fetched = fetched.filter((p) => p.stock === 0)
      } else if (stockFilter === 'in_stock') {
        fetched = fetched.filter((p) => p.stock > 0)
      }

      setProducts(fetched)
      setPagination(res.pagination || { page: 1, limit: 20, total: fetched.length, totalPages: 1 })

      // Update categories list from products dataset
      const cats = Array.from(new Set((res.products || []).map((p) => p.category).filter(Boolean)))
      if (cats.length > 0) {
        setCategories((prev) => Array.from(new Set([...prev, ...cats])))
      }
    } catch (err) {
      console.error('Fetch products error:', err)
      setError(err.message || 'Failed to load products.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, sort, search, category, stockFilter, minPrice, maxPrice])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Debounced Search Handler
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleClearFilters = () => {
    setSearch('')
    setCategory('')
    setStockFilter('all')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
    setPage(1)
  }

  const hasActiveFilters = Boolean(
    search.trim() || category || stockFilter !== 'all' || minPrice || maxPrice || sort !== 'newest'
  )

  // Modal Triggers
  const openAddModal = () => {
    setSelectedProduct(null)
    setForm({
      name: '',
      description: '',
      category: '',
      unit: 'piece',
      price: '',
      costPrice: '',
      stock: '',
      lowStockAt: 10,
    })
    setImageFile(null)
    setImagePreview('')
    setError(null)
    setActiveModal('add')
  }

  const openEditModal = (product) => {
    setSelectedProduct(product)
    setForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      unit: product.unit || 'piece',
      price: product.price || '',
      costPrice: product.costPrice || '',
      stock: product.stock !== undefined ? product.stock : '',
      lowStockAt: product.lowStockAt !== undefined ? product.lowStockAt : 10,
    })
    setImageFile(null)
    setImagePreview(product.image?.url || '')
    setError(null)
    setActiveModal('edit')
  }

  const openStockModal = (product) => {
    setSelectedProduct(product)
    setStockAdj({ qty: '', type: 'add' })
    setError(null)
    setActiveModal('stock')
  }

  const openDetailDrawer = (product) => {
    setSelectedProductId(product._id)
  }

  if (selectedProductId) {
    return (
      <ProductDetailView
        productId={selectedProductId}
        onBack={() => setSelectedProductId(null)}
        onProductUpdated={() => loadProducts()}
      />
    )
  }

  const openDeleteModal = (product) => {
    setSelectedProduct(product)
    setError(null)
    setActiveModal('delete')
  }

  // Handlers
  const handleSaveProduct = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price) {
      setError('Product Name and Selling Price are required.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, val]) => {
        if (val !== undefined && val !== null) formData.append(key, val)
      })
      if (imageFile) formData.append('image', imageFile)

      if (activeModal === 'add') {
        await apiClient('/products', { method: 'POST', body: formData })
      } else if (activeModal === 'edit' && selectedProduct) {
        await apiClient(`/products/${selectedProduct._id}`, { method: 'PUT', body: formData })
      }

      setActiveModal(null)
      loadProducts()
    } catch (err) {
      setError(err.message || 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  const handleAdjustStock = async (e) => {
    e.preventDefault()
    const qtyNum = Number(stockAdj.qty)
    if (!qtyNum || qtyNum <= 0) {
      setError('Please enter a valid stock quantity.')
      return
    }
    if (stockAdj.type === 'subtract' && selectedProduct.stock < qtyNum) {
      setError('Cannot subtract more stock than currently available.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await apiClient(`/products/${selectedProduct._id}/stock`, {
        method: 'PATCH',
        body: { quantity: qtyNum, type: stockAdj.type },
      })
      setActiveModal(null)
      loadProducts()
    } catch (err) {
      setError(err.message || 'Failed to adjust stock.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return
    setSaving(true)
    setError(null)

    try {
      await apiClient(`/products/${selectedProduct._id}`, { method: 'DELETE' })
      setActiveModal(null)
      setSelectedProduct(null)
      loadProducts()
    } catch (err) {
      setError(err.message || 'Failed to delete product.')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkImport = async (e) => {
    e.preventDefault()
    if (!importFile) {
      setError('Please select an Excel file (.xlsx, .xls) to upload.')
      return
    }

    setImporting(true)
    setError(null)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const res = await apiClient('/products/bulk-upload', { method: 'POST', body: formData })
      setImportResult(res)
      loadProducts()
    } catch (err) {
      setError(err.message || 'Failed to process bulk upload.')
    } finally {
      setImporting(false)
    }
  }

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p._id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Summary Metrics calculations
  const totalProducts = pagination.total || products.length
  const activeProducts = products.filter((p) => p.isActive).length
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockAt || 10)).length
  const outOfStockCount = products.filter((p) => p.stock === 0).length

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
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
            Products
          </h2>
          <p className="text-xs text-slate-500">
            Manage your catalog, pricing, cost margins and inventory stock.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setActiveModal('import')}>
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-slate-600" />
            Import Price List
          </Button>

          <Button variant="primary" size="sm" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Product
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
                TOTAL PRODUCTS
              </div>
              <div className="text-xl font-bold font-display text-slate-900 mt-1">
                {totalProducts}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Catalog items</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Package className="w-4 h-4 stroke-[1.75]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                ACTIVE CATALOG
              </div>
              <div className="text-xl font-bold font-display text-slate-900 mt-1">
                {activeProducts}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Live for orders</div>
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
                LOW STOCK
              </div>
              <div className="text-xl font-bold font-display text-slate-900 mt-1">
                {lowStockCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Below threshold</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Boxes className="w-4 h-4 stroke-[1.75]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                OUT OF STOCK
              </div>
              <div className="text-xl font-bold font-display text-slate-900 mt-1">
                {outOfStockCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">0 stock available</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <AlertTriangle className="w-4 h-4 stroke-[1.75]" />
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
              placeholder="Search products by name, category, SKU..."
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

          {/* Filters & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Stock Status Filter */}
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            {/* Sort Options */}
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-blue-600"
            >
              {sortOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  Sort: {s.label}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-blue-600 hover:bg-blue-50"
              >
                Clear Filters
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProducts(true)}
              loading={refreshing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </Button>
          </div>
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          4. PRODUCT DATA TABLE (DESKTOP) / CARDS (MOBILE)
         ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : products.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={Package}
            title={hasActiveFilters ? 'No products match your filters' : 'No products in catalog yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search criteria or clear active filters.'
                : 'Add your first product to start taking orders from retailers.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={openAddModal}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Product
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
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === products.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {products.map((p) => {
                  const isSelected = selectedIds.includes(p._id)
                  const isLow = p.stock > 0 && p.stock <= (p.lowStockAt || 10)
                  const isOut = p.stock === 0

                  return (
                    <TableRow key={p._id} className={isSelected ? 'bg-blue-50/40' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(p._id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.image?.url ? (
                              <img src={p.image.url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400 stroke-[1.5]" />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span
                              onClick={() => openDetailDrawer(p)}
                              className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer truncate"
                            >
                              {p.name}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate">
                              Unit: {p.unit || 'piece'} {p.sku ? `• SKU: ${p.sku}` : ''}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600">
                          {p.category || 'General'}
                        </span>
                      </TableCell>

                      <TableCell className="font-semibold font-display text-slate-900">
                        {fmt(p.price)}
                      </TableCell>

                      <TableCell className="text-slate-500">
                        {p.costPrice ? fmt(p.costPrice) : '—'}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold font-display text-sm ${
                              isOut
                                ? 'text-slate-400'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {p.stock}
                          </span>

                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                              isOut
                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-600 border-blue-200'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge status={p.isActive ? 'active' : 'suspended'} />
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDetailDrawer(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openStockModal(p)}
                            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Adjust Stock"
                          >
                            Stock
                          </button>

                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openDeleteModal(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <TablePagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={(p) => setPage(p)}
            />
          </div>

          {/* Mobile Card Grid View */}
          <div className="block sm:hidden space-y-3">
            {products.map((p) => (
              <Card key={p._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.image?.url ? (
                        <img src={p.image.url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-400 stroke-[1.5]" />
                      )}
                    </div>
                    <div>
                      <h4
                        onClick={() => openDetailDrawer(p)}
                        className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
                      >
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {p.category || 'General'} • {p.unit || 'piece'}
                      </p>
                    </div>
                  </div>
                  <Badge status={p.isActive ? 'active' : 'suspended'} />
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">PRICE</span>
                    <div className="font-bold font-display text-slate-900">
                      {fmt(p.price)}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px]">STOCK</span>
                    <div className="font-bold font-display text-slate-900">
                      {p.stock}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => openStockModal(p)}>
                      Stock
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(p)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <TablePagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. ADD / EDIT PRODUCT MODAL
         ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={activeModal === 'add' || activeModal === 'edit'}
        onClose={() => setActiveModal(null)}
        size="lg"
      >
        <ModalHeader onClose={() => setActiveModal(null)}>
          <ModalTitle>{activeModal === 'add' ? 'Add New Product' : 'Edit Product'}</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleSaveProduct}>
          <ModalBody className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
                Basic Information
              </h4>
              <Input
                label="Product Name *"
                placeholder="e.g. Surf Excel Easy Wash 1kg"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <Input
                label="Description"
                placeholder="Brief product description or key details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Category"
                  placeholder="e.g. FMCG, Beverages, Snacks"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />

                <Input
                  label="Unit of Measurement"
                  select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  <option value="piece">Piece (pc)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="pack">Pack (pk)</option>
                  <option value="box">Box (bx)</option>
                  <option value="bottle">Bottle (btl)</option>
                  <option value="liter">Liter (L)</option>
                </Input>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
                Pricing
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Selling Price (₹) *"
                  type="number"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />

                <Input
                  label="Cost Price (₹)"
                  type="number"
                  placeholder="0.00"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                  helperText="Used to compute gross margin."
                />
              </div>
            </div>

            {/* Inventory */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
                Inventory
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Stock Quantity"
                  type="number"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />

                <Input
                  label="Low Stock Alert Threshold"
                  type="number"
                  placeholder="10"
                  value={form.lowStockAt}
                  onChange={(e) => setForm({ ...form, lowStockAt: e.target.value })}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-medium text-slate-700 block">
                Product Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    setImageFile(file)
                    setImagePreview(URL.createObjectURL(file))
                  }
                }}
                className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
              />

              {imagePreview && (
                <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" size="sm" type="button" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={saving}>
              {activeModal === 'add' ? 'Create Product' : 'Save Changes'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          6. STOCK ADJUSTMENT MODAL
         ───────────────────────────────────────────────────────────── */}
      <Modal isOpen={activeModal === 'stock'} onClose={() => setActiveModal(null)} size="sm">
        <ModalHeader onClose={() => setActiveModal(null)}>
          <ModalTitle>Adjust Stock Level</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleAdjustStock}>
          <ModalBody className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                {error}
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block">
                  {selectedProduct?.name}
                </span>
                <span className="text-[11px] text-slate-500">Current Stock: {selectedProduct?.stock || 0}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                label="Adjustment Type"
                select
                value={stockAdj.type}
                onChange={(e) => setStockAdj({ ...stockAdj, type: e.target.value })}
              >
                <option value="add">Add Stock (+)</option>
                <option value="subtract">Subtract Stock (-)</option>
              </Input>

              <Input
                label="Quantity to Adjust *"
                type="number"
                placeholder="e.g. 20"
                value={stockAdj.qty}
                onChange={(e) => setStockAdj({ ...stockAdj, qty: e.target.value })}
                required
              />

              {stockAdj.qty && (
                <div className="text-xs text-slate-600">
                  New stock balance will be:{' '}
                  <span className="font-bold text-slate-900">
                    {stockAdj.type === 'add'
                      ? (selectedProduct?.stock || 0) + Number(stockAdj.qty)
                      : Math.max((selectedProduct?.stock || 0) - Number(stockAdj.qty), 0)}
                  </span>
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" size="sm" type="button" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={saving}>
              Confirm Adjustment
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          7. BULK IMPORT MODAL
         ───────────────────────────────────────────────────────────── */}
      <Modal isOpen={activeModal === 'import'} onClose={() => setActiveModal(null)} size="md">
        <ModalHeader onClose={() => setActiveModal(null)}>
          <ModalTitle>Import Price List / Products</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleBulkImport}>
          <ModalBody className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                {error}
              </div>
            )}

            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2 text-xs text-slate-700">
              <h5 className="font-semibold font-display text-blue-900">
                Excel Import Guidelines
              </h5>
              <p>Upload an `.xlsx` or `.xls` spreadsheet containing your product catalog.</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>Required columns: <strong>Name</strong>, <strong>Selling Price</strong></li>
                <li>Optional columns: <strong>Category</strong>, <strong>Stock</strong>, <strong>Cost Price</strong>, <strong>SKU</strong></li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 block">
                Select Excel File (.xlsx, .xls)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
              />
            </div>

            {importResult && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <div className="font-semibold">{importResult.message}</div>
                {importResult.summary?.errors?.length > 0 && (
                  <div className="text-amber-700 text-[11px] mt-1">
                    {importResult.summary.errors.slice(0, 3).join(' ')}
                  </div>
                )}
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" size="sm" type="button" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={importing}>
              Upload & Process
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          8. DELETE CONFIRMATION MODAL
         ───────────────────────────────────────────────────────────── */}
      <Modal isOpen={activeModal === 'delete'} onClose={() => setActiveModal(null)} size="sm">
        <ModalHeader onClose={() => setActiveModal(null)}>
          <ModalTitle>Delete Product</ModalTitle>
        </ModalHeader>

        <ModalBody className="space-y-3">
          <p className="text-xs text-slate-600">
            Are you sure you want to remove{' '}
            <strong className="text-slate-900">{selectedProduct?.name}</strong> from your active catalog?
          </p>
          <p className="text-[11px] text-slate-400">
            This action deactivates the item. Historical order records will be preserved.
          </p>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={() => setActiveModal(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteProduct} loading={saving}>
            Confirm Delete
          </Button>
        </ModalFooter>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          9. PRODUCT DETAIL DRAWER
         ───────────────────────────────────────────────────────────── */}
      <Drawer isOpen={detailDrawerOpen} onClose={() => setDetailDrawerOpen(false)} size="md">
        <DrawerHeader onClose={() => setDetailDrawerOpen(false)}>
          <DrawerTitle>{selectedProduct?.name || 'Product Detail'}</DrawerTitle>
        </DrawerHeader>

        <DrawerBody className="space-y-6">
          {selectedProduct && (
            <>
              {/* Image & Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedProduct.image?.url ? (
                    <img src={selectedProduct.image.url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-slate-400 stroke-[1.5]" />
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold font-display text-slate-900">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Category: {selectedProduct.category || 'General'} • Unit: {selectedProduct.unit || 'piece'}
                  </p>
                  <div className="mt-1">
                    <Badge status={selectedProduct.isActive ? 'active' : 'suspended'} />
                  </div>
                </div>
              </div>

              {/* Pricing & Margin Card */}
              <Card className="p-4 bg-slate-50/50">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display mb-3">
                  Pricing & Margins
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400">SELLING PRICE</span>
                    <div className="text-lg font-bold font-display text-blue-600">
                      {fmt(selectedProduct.price)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400">COST PRICE</span>
                    <div className="text-lg font-bold font-display text-slate-900">
                      {selectedProduct.costPrice ? fmt(selectedProduct.costPrice) : '—'}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Inventory Status */}
              <Card className="p-4 bg-slate-50/50">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display mb-3">
                  Inventory Level
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400">AVAILABLE STOCK</span>
                    <div className="text-xl font-bold font-display text-slate-900">
                      {selectedProduct.stock} {selectedProduct.unit || 'units'}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400">ALERT THRESHOLD</span>
                    <div className="text-sm font-semibold text-slate-700">
                      {selectedProduct.lowStockAt || 10} units
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </DrawerBody>

        <DrawerFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDetailDrawerOpen(false)
              openStockModal(selectedProduct)
            }}
          >
            Adjust Stock
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setDetailDrawerOpen(false)
              openEditModal(selectedProduct)
            }}
          >
            Edit Product
          </Button>
        </DrawerFooter>
      </Drawer>
    </div>
  )
}
