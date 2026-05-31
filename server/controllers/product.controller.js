import Product from '../models/Product.model.js'

// ─────────────────────────────────────────────────────────────
// POST /api/products
// Wholesaler adds a product
// ─────────────────────────────────────────────────────────────
export const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, unit, price, costPrice, stock, lowStockAt } = req.body

    const product = await Product.create({
      wholesaler: req.user.id,
      name, description, category, unit,
      price, costPrice, stock, lowStockAt,
    })

    return res.status(201).json({ success: true, message: 'Product created.', product })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/products
// Wholesaler sees their products; Retailer/Salesman sees wholesaler's products
// ─────────────────────────────────────────────────────────────
export const getProducts = async (req, res, next) => {
  try {
    const { id, role } = req.user
    const { category, search, lowStock, wholesalerId } = req.query

    let filter = { isActive: true }

    if (role === 'wholesaler') filter.wholesaler = id
    if (role === 'retailer')   filter.wholesaler = req.user.wholesaler 
    if (role === 'salesman')   filter.wholesaler = req.user.wholesaler 
    if (category) filter.category = category
    if (search)   filter.name     = { $regex: search, $options: 'i' }
    if (lowStock === 'true') filter.$expr = { $lte: ['$stock', '$lowStockAt'] }

    const products = await Product.find(filter).sort({ name: 1 })

    return res.status(200).json({ success: true, products, total: products.length })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/products/:id
// ─────────────────────────────────────────────────────────────
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' })
    return res.status(200).json({ success: true, product })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/products/:id
// Wholesaler updates a product
// ─────────────────────────────────────────────────────────────
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, wholesaler: req.user.id })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' })

    const fields = ['name', 'description', 'category', 'unit', 'price', 'costPrice', 'stock', 'lowStockAt', 'isActive']
    fields.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f] })

    await product.save()
    return res.status(200).json({ success: true, message: 'Product updated.', product })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/products/:id
// Soft delete — just marks isActive: false
// ─────────────────────────────────────────────────────────────
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, wholesaler: req.user.id })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' })

    product.isActive = false
    await product.save()

    return res.status(200).json({ success: true, message: 'Product removed.' })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/products/:id/stock
// Adjust stock level
// ─────────────────────────────────────────────────────────────
export const adjustStock = async (req, res, next) => {
  try {
    const { quantity, type } = req.body // type: 'add' | 'subtract'
    const product = await Product.findOne({ _id: req.params.id, wholesaler: req.user.id })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' })

    if (type === 'add')      product.stock += quantity
    if (type === 'subtract') {
      if (product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock.' })
      product.stock -= quantity
    }

    await product.save()
    return res.status(200).json({ success: true, message: 'Stock updated.', product })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/products/low-stock
// Low stock alerts for wholesaler
// ─────────────────────────────────────────────────────────────
export const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      wholesaler: req.user.id,
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockAt'] },
    }).sort({ stock: 1 })

    return res.status(200).json({ success: true, products, total: products.length })
  } catch (err) {
    next(err)
  }
}