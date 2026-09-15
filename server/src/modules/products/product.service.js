import Product from './product.model.js'
import XLSX from 'xlsx'
import mongoose from 'mongoose'
import { ApiError, StatusCode } from '../../utils/apiError.utils.js'

export const createProduct = async (data, user, file) => {
  const { name, description, category, unit, price, costPrice, stock, lowStockAt } = data
  const product = await Product.create({
    wholesaler: user.id,
    name, description, category, unit,
    price, costPrice, stock, lowStockAt,
    image: {
      url:      file?.path || '',
      publicId: file?.filename || '',
    }
  })
  return product
}

export const getProducts = async (user, query) => {
  const { id, role, wholesaler } = user
  const { category, search, lowStock, minPrice, maxPrice, sort = "newest", page = 1, limit = 20 } = query

  const currentPage = Math.max(parseInt(page, 10) || 1, 1)
  const pageLimit   = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100)
  const skip        = (currentPage - 1) * pageLimit

  const parseMinPrice = minPrice !== undefined ? Number(minPrice) : undefined
  const parseMaxPrice = maxPrice !== undefined ? Number(maxPrice) : undefined

  if (parseMinPrice !== undefined && (!Number.isFinite(parseMinPrice) || parseMinPrice < 0)) {
    throw new ApiError(StatusCode.BAD_REQUEST, "MinPrice must be a valid non-negative number.")
  }
  if (parseMaxPrice !== undefined && (!Number.isFinite(parseMaxPrice) || parseMaxPrice < 0)) {
    throw new ApiError(StatusCode.BAD_REQUEST, "MaxPrice must be a valid non-negative number.")
  }
  if (parseMinPrice !== undefined && parseMaxPrice !== undefined && parseMinPrice > parseMaxPrice) {
    throw new ApiError(StatusCode.BAD_REQUEST, "MinPrice cannot be greater than MaxPrice.")
  }

  const filter = { isActive: true }

  if (role === 'wholesaler') filter.wholesaler = id
  if (role === 'retailer' || role === 'salesman') {
    if (!wholesaler) {
      throw new ApiError(StatusCode.FORBIDDEN, 'You are not linked to a wholesaler yet.')
    }
    filter.wholesaler = wholesaler
  }

  if (category) filter.category = category
  if (search)   filter.name     = { $regex: search, $options: 'i' }

  if (parseMinPrice !== undefined || parseMaxPrice !== undefined) {
    filter.price = {}
    if (parseMinPrice !== undefined) filter.price.$gte = parseMinPrice
    if (parseMaxPrice !== undefined) filter.price.$lte = parseMaxPrice
  }

  if (lowStock === 'true') filter.$expr = { $lte: ['$stock', '$lowStockAt'] }

  const sortOptions = {
    newest:     { createdAt: -1 },
    oldest:     { createdAt: 1 },
    name_asc:   { name: 1 },
    name_desc:  { name: -1 },
    price_asc:  { price: 1 },
    price_desc: { price: -1 },
    stock_asc:  { stock: 1 },
    stock_desc: { stock: -1 },
  }

  const sortQuery = sortOptions[sort]
  if (!sortQuery) {
    throw new ApiError(StatusCode.BAD_REQUEST, `Invalid sort option: ${sort}`)
  }

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortQuery).skip(skip).limit(pageLimit),
    Product.countDocuments(filter)
  ])

  const totalPages = Math.ceil(total / pageLimit)

  return {
    products,
    pagination: {
      page: currentPage,
      limit: pageLimit,
      total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    }
  }
}

export const getProductById = async (id, user) => {
  const { role, id: userId, wholesaler } = user
  const filter = { _id: id, isActive: true }

  if (role === 'wholesaler') filter.wholesaler = userId
  else if (role === 'retailer' || role === 'salesman') {
    if (!wholesaler) throw new ApiError(StatusCode.FORBIDDEN, 'You are not linked to a wholesaler yet.')
    filter.wholesaler = wholesaler
  }

  const product = await Product.findOne(filter)
  if (!product) throw new ApiError(StatusCode.NOT_FOUND, 'Product not found.')
  return product
}

export const updateProduct = async (id, userId, body, file) => {
  const product = await Product.findOne({ _id: id, wholesaler: userId })
  if (!product) throw new ApiError(StatusCode.NOT_FOUND, 'Product not found.')

  const fields = ['name', 'description', 'category', 'unit', 'price', 'costPrice', 'stock', 'lowStockAt', 'isActive']
  fields.forEach(f => { if (body[f] !== undefined) product[f] = body[f] })

  if (file) {
    product.image = {
      url:      file.path,
      publicId: file.filename,
    }
  }

  await product.save()
  return product
}

export const deleteProduct = async (id, userId) => {
  const product = await Product.findOne({ _id: id, wholesaler: userId })
  if (!product) throw new ApiError(StatusCode.NOT_FOUND, 'Product not found.')

  product.isActive = false
  await product.save()
  return { success: true }
}

export const adjustStock = async (id, userId, quantity, type) => {
  const product = await Product.findOne({ _id: id, wholesaler: userId })
  if (!product) throw new ApiError(StatusCode.NOT_FOUND, 'Product not found.')

  if (type === 'add')      product.stock += quantity
  if (type === 'subtract') {
    if (product.stock < quantity) throw new ApiError(StatusCode.BAD_REQUEST, 'Insufficient stock.')
    product.stock -= quantity
  }

  await product.save()
  return product
}

export const getLowStockProducts = async (userId) => {
  const products = await Product.find({
    wholesaler: userId,
    isActive: true,
    $expr: { $lte: ['$stock', '$lowStockAt'] },
  }).sort({ stock: 1 })

  return { products, total: products.length }
}
