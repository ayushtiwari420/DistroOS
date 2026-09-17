import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Package,
  Edit2,
  Trash2,
  Boxes,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  MoreVertical,
  Calendar,
  Hash,
  Tag,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/Card'
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../../../components/ui/Modal'
import { SkeletonCard } from '../../../../components/ui/Skeleton'
import EmptyState from '../../../../components/ui/EmptyState'
import Badge from '../../../../components/ui/Badges'
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

export default function ProductDetailView({ productId, onBack, onProductUpdated }) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  // Actions / Modals State
  const [activeModal, setActiveModal] = useState(null) // null | 'edit' | 'stock' | 'delete'
  const [saving, setSaving] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState(false)

  // Edit Form State
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    unit: 'piece',
    price: '',
    costPrice: '',
    stock: '',
    lowStockAt: 10,
    isActive: true,
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  // Stock Adjustment State
  const [stockAdj, setStockAdj] = useState({ qty: '', type: 'add' })

  // Fetch product detail
  const fetchProduct = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    setNotFound(false)

    try {
      const res = await apiClient(`/products/${productId}`)
      if (res.product) {
        setProduct(res.product)
      } else {
        setNotFound(true)
      }
    } catch (err) {
      console.error('Fetch product detail error:', err)
      if (err.status === 404 || err.message?.includes('not found')) {
        setNotFound(true)
      } else {
        setError(err.message || 'Failed to load product details.')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [productId])

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId, fetchProduct])

  // Open Modals
  const openEditModal = () => {
    if (!product) return
    setForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      unit: product.unit || 'piece',
      price: product.price || '',
      costPrice: product.costPrice || '',
      stock: product.stock !== undefined ? product.stock : '',
      lowStockAt: product.lowStockAt !== undefined ? product.lowStockAt : 10,
      isActive: product.isActive !== undefined ? product.isActive : true,
    })
    setImageFile(null)
    setImagePreview(product.image?.url || '')
    setError(null)
    setActionMenuOpen(false)
    setActiveModal('edit')
  }

  const openStockModal = () => {
    if (!product) return
    setStockAdj({ qty: '', type: 'add' })
    setError(null)
    setActionMenuOpen(false)
    setActiveModal('stock')
  }

  const openDeleteModal = () => {
    if (!product) return
    setError(null)
    setActionMenuOpen(false)
    setActiveModal('delete')
  }

  // Handlers
  const handleSaveEdit = async (e) => {
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

      const res = await apiClient(`/products/${productId}`, {
        method: 'PUT',
        body: formData,
      })

      if (res.product) {
        setProduct(res.product)
      } else {
        await fetchProduct()
      }

      setActiveModal(null)
      if (onProductUpdated) onProductUpdated()
    } catch (err) {
      setError(err.message || 'Failed to update product.')
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
    if (stockAdj.type === 'subtract' && product.stock < qtyNum) {
      setError('Cannot subtract more stock than currently available.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await apiClient(`/products/${productId}/stock`, {
        method: 'PATCH',
        body: { quantity: qtyNum, type: stockAdj.type },
      })

      if (res.product) {
        setProduct(res.product)
      } else {
        await fetchProduct()
      }

      setActiveModal(null)
      if (onProductUpdated) onProductUpdated()
    } catch (err) {
      setError(err.message || 'Failed to adjust stock.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    if (!product) return
    setSaving(true)
    setError(null)

    try {
      const updatedStatus = !product.isActive
      const res = await apiClient(`/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: updatedStatus }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.product) setProduct(res.product)
      else await fetchProduct()

      setActionMenuOpen(false)
      if (onProductUpdated) onProductUpdated()
    } catch (err) {
      setError(err.message || 'Failed to update activation status.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!product) return
    setSaving(true)
    setError(null)

    try {
      await apiClient(`/products/${productId}`, { method: 'DELETE' })
      setActiveModal(null)
      if (onProductUpdated) onProductUpdated()
      if (onBack) onBack()
    } catch (err) {
      setError(err.message || 'Failed to delete product.')
    } finally {
      setSaving(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // LOADING SKELETON STATE
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
          <span>/</span>
          <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-9 w-28 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
          <div>
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // NOT FOUND STATE
  // ─────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="p-6">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <EmptyState
            icon={Package}
            title="Product Not Found"
            description="The requested product may have been removed or the link is invalid."
            action={
              <Button variant="primary" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Products
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // ERROR STATE
  // ─────────────────────────────────────────────────────────────
  if (error && !product) {
    return (
      <div className="p-6">
        <Card className="max-w-lg mx-auto p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold font-display text-slate-900">
              Couldn't load this product
            </h3>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Products
            </Button>
            <Button variant="primary" size="sm" onClick={() => fetchProduct()}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!product) return null

  // Metric Computations
  const sellingPrice = Number(product.price || 0)
  const costPrice = Number(product.costPrice || 0)
  const marginAmount = sellingPrice - costPrice
  const marginPercentage = sellingPrice > 0 ? ((marginAmount / sellingPrice) * 100).toFixed(1) : '0.0'

  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockAt || 10)
  const isOutOfStock = product.stock === 0

  return (
    <div className="space-y-6 pb-8">
      {/* ─────────────────────────────────────────────────────────────
          1. BREADCRUMBS & PAGE HEADER
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={onBack}
            className="hover:text-blue-600 font-medium transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Products
          </button>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
            {product.name}
          </span>
        </div>

        {/* Main Header Container */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Product Image / Placeholder */}
            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
              {product.image?.url ? (
                <img src={product.image.url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-7 h-7 text-slate-400 stroke-[1.5]" />
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight truncate">
                  {product.name}
                </h2>
                <Badge status={product.isActive ? 'active' : 'suspended'} />
              </div>
              <p className="text-xs text-slate-500 truncate">
                Category: <span className="font-medium text-slate-700">{product.category || 'General'}</span> • Unit:{' '}
                <span className="font-medium text-slate-700">{product.unit || 'piece'}</span> • ID:{' '}
                <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                  {product._id}
                </code>
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0 relative">
            <Button variant="outline" size="sm" onClick={() => fetchProduct(true)} loading={refreshing}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            </Button>

            <Button variant="outline" size="sm" onClick={openEditModal}>
              <Edit2 className="w-4 h-4 mr-1.5" />
              Edit Product
            </Button>

            <Button variant="primary" size="sm" onClick={openStockModal}>
              <Boxes className="w-4 h-4 mr-1.5" />
              Adjust Stock
            </Button>

            {/* Overflow Action Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActionMenuOpen(!actionMenuOpen)}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                aria-label="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {actionMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={handleToggleActive}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    {product.isActive ? 'Deactivate Product' : 'Activate Product'}
                  </button>

                  <button
                    onClick={openDeleteModal}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    Delete Product
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. KEY METRICS GRID
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Selling Price Card */}
        <Card className="bg-white">
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                SELLING PRICE
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <DollarSign className="w-4 h-4 stroke-[1.75]" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-display text-blue-600 tracking-tight">
                {fmt(sellingPrice)}
              </div>
              <span className="text-[10px] text-slate-500">Per {product.unit || 'unit'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Cost Price Card */}
        <Card className="bg-white">
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                COST PRICE
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-slate-600">
                <Tag className="w-4 h-4 stroke-[1.75]" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-display text-slate-900 tracking-tight">
                {costPrice ? fmt(costPrice) : '—'}
              </div>
              <span className="text-[10px] text-slate-500">Unit procurement cost</span>
            </div>
          </CardContent>
        </Card>

        {/* Gross Margin Card */}
        <Card className="bg-white">
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                GROSS MARGIN
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <TrendingUp className="w-4 h-4 stroke-[1.75]" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-display text-slate-900 tracking-tight">
                {fmt(marginAmount)}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">{marginPercentage}% profit margin</span>
            </div>
          </CardContent>
        </Card>

        {/* Stock Level Card (Contextual Styling) */}
        <Card
          className={`bg-white border transition-all ${
            isOutOfStock
              ? 'border-slate-200'
              : isLowStock
              ? 'border-amber-200'
              : 'border-slate-200'
          }`}
        >
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">
                CURRENT STOCK
              </span>
              <div
                className={`p-2 rounded-lg ${
                  isOutOfStock
                    ? 'bg-slate-100 text-slate-500'
                    : isLowStock
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                <Boxes className="w-4 h-4 stroke-[1.75]" />
              </div>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold font-display tracking-tight ${
                    isOutOfStock
                      ? 'text-slate-400'
                      : isLowStock
                      ? 'text-amber-600'
                      : 'text-slate-900'
                  }`}
                >
                  {product.stock}
                </span>
                <span className="text-xs text-slate-500">{product.unit || 'units'}</span>
              </div>
              <span className="text-[10px] text-slate-500">Alert threshold: {product.lowStockAt || 10} units</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN CONTENT: TWO-COLUMN LAYOUT
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Description & Full Specifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Product Description</CardTitle>
            </CardHeader>
            <CardContent>
              {product.description ? (
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">No description added for this product.</p>
              )}
            </CardContent>
          </Card>

          {/* Specifications Table Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Catalog & Inventory Metadata</CardTitle>
              <CardDescription>System specifications and timestamps</CardDescription>
            </CardHeader>

            <CardContent className="p-0 border-t border-slate-100">
              <div className="divide-y divide-slate-100 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 p-4">
                  <span className="font-medium text-slate-500">Product Name</span>
                  <span className="sm:col-span-2 font-semibold text-slate-900">
                    {product.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 p-4">
                  <span className="font-medium text-slate-500">Category</span>
                  <span className="sm:col-span-2 text-slate-800">
                    {product.category || 'General'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 p-4">
                  <span className="font-medium text-slate-500">Unit of Measurement</span>
                  <span className="sm:col-span-2 text-slate-800">
                    {product.unit || 'piece'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 p-4">
                  <span className="font-medium text-slate-500">Selling Price</span>
                  <span className="sm:col-span-2 font-semibold font-display text-blue-600">
                    {fmt(product.price)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 p-4">
                  <span className="font-medium text-slate-500">Cost Price</span>
                  <span className="sm:col-span-2 text-slate-800">
                    {product.costPrice ? fmt(product.costPrice) : '—'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 p-4">
                  <span className="font-medium text-slate-500">Low Stock Alert Level</span>
                  <span className="sm:col-span-2 text-slate-800">
                    {product.lowStockAt || 10} units
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 p-4">
                  <span className="font-medium text-slate-500">Catalog Status</span>
                  <span className="sm:col-span-2">
                    <Badge status={product.isActive ? 'active' : 'suspended'} />
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 p-4">
                  <span className="font-medium text-slate-500">Created Timestamp</span>
                  <span className="sm:col-span-2 text-slate-600">
                    {formatDate(product.createdAt)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 p-4">
                  <span className="font-medium text-slate-500">Last Modified</span>
                  <span className="sm:col-span-2 text-slate-600">
                    {formatDate(product.updatedAt)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 p-4">
                  <span className="font-medium text-slate-500">Product System ID</span>
                  <span className="sm:col-span-2 font-mono text-[11px] text-slate-500 select-all">
                    {product._id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Inventory Actions & Stock Health Panel */}
        <div className="space-y-6">
          {/* Stock Health & Quick Action Panel */}
          <Card className="bg-slate-50/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Stock Level Control</CardTitle>
              <CardDescription>Instant inventory management</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Available Stock:</span>
                  <span className="font-bold font-display text-slate-900">
                    {product.stock} {product.unit || 'units'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Status Indicator:</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                      isOutOfStock
                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                        : isLowStock
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-600 border-blue-200'
                    }`}
                  >
                    {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="primary" size="sm" onClick={openStockModal} className="w-full justify-center">
                  <Boxes className="w-4 h-4 mr-1.5" />
                  Adjust Stock Quantity
                </Button>

                <Button variant="outline" size="sm" onClick={openEditModal} className="w-full justify-center">
                  <Edit2 className="w-4 h-4 mr-1.5" />
                  Edit Product Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips / Operational Guidance */}
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-2 text-xs text-slate-600">
              <h5 className="font-semibold font-display text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Operational Tip
              </h5>
              <p className="leading-normal">
                Setting an accurate low stock alert threshold ensures Smart Reorder and Inventory Intelligence signal restock alerts before items reach complete stockout.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MODALS & DIALOGS
         ───────────────────────────────────────────────────────────── */}
      {/* Edit Product Modal */}
      <Modal isOpen={activeModal === 'edit'} onClose={() => setActiveModal(null)} size="lg">
        <ModalHeader onClose={() => setActiveModal(null)}>
          <ModalTitle>Edit Product Details</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleSaveEdit}>
          <ModalBody className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
                Basic Details
              </h4>
              <Input
                label="Product Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <Input
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />

                <Input
                  label="Unit"
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

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
                Pricing & Thresholds
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Selling Price (₹) *"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />

                <Input
                  label="Cost Price (₹)"
                  type="number"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Stock Quantity"
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />

                <Input
                  label="Low Stock Alert Threshold"
                  type="number"
                  value={form.lowStockAt}
                  onChange={(e) => setForm({ ...form, lowStockAt: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-medium text-slate-700 block">
                Update Image
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
                <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
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
              Save Changes
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
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
                <span className="font-semibold text-slate-900 block">{product.name}</span>
                <span className="text-[11px] text-slate-500">Current Stock: {product.stock} {product.unit || 'units'}</span>
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
                placeholder="e.g. 10"
                value={stockAdj.qty}
                onChange={(e) => setStockAdj({ ...stockAdj, qty: e.target.value })}
                required
              />

              {stockAdj.qty && (
                <div className="text-xs text-slate-600">
                  New stock balance will be:{' '}
                  <span className="font-bold text-slate-900">
                    {stockAdj.type === 'add'
                      ? product.stock + Number(stockAdj.qty)
                      : Math.max(product.stock - Number(stockAdj.qty), 0)}
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={activeModal === 'delete'} onClose={() => setActiveModal(null)} size="sm">
        <ModalHeader onClose={() => setActiveModal(null)}>
          <ModalTitle>Delete Product</ModalTitle>
        </ModalHeader>

        <ModalBody className="space-y-3">
          <p className="text-xs text-slate-600">
            Are you sure you want to remove <strong className="text-slate-900">"{product.name}"</strong> from your active catalog?
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
    </div>
  )
}
