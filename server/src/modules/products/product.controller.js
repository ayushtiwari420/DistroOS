import Product from './product.model.js'
import XLSX from 'xlsx'
import mongoose from 'mongoose'
import { ApiError, StatusCode } from '../../utils/apiError.utils.js'
import * as productService from './product.service.js'

export const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user, req.file)
    return res.status(201).json({ success: true, message: 'Product created.', product })
  } catch (err) { next(err) }
}

export const getProducts = async (req, res, next) => {
  try {
    const result = await productService.getProducts(req.user, req.query)
    return res.status(200).json({ success: true, ...result })
  } catch (err) { next(err) }
}

export const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id, req.user)
    return res.status(200).json({ success: true, product })
  } catch (err) { next(err) }
}

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.user.id, req.body, req.file)
    return res.status(200).json({ success: true, message: 'Product updated.', product })
  } catch (err) { next(err) }
}

export const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id, req.user.id)
    return res.status(200).json({ success: true, message: 'Product removed.' })
  } catch (err) { next(err) }
}

export const adjustStock = async (req, res, next) => {
  try {
    const { quantity, type } = req.body
    const product = await productService.adjustStock(req.params.id, req.user.id, Number(quantity), type)
    return res.status(200).json({ success: true, message: 'Stock updated.', product })
  } catch (err) { next(err) }
}

export const getLowStockProducts = async (req, res, next) => {
  try {
    const result = await productService.getLowStockProducts(req.user.id)
    return res.status(200).json({ success: true, ...result })
  } catch (err) { next(err) }
}

// Bulk update / import helpers
const excelHeaderMap = {
  id: 'productId', productid: 'productId', mongoid: 'productId', mongodbid: 'productId',
  name: 'name', product: 'name', productname: 'name', newname: 'name',
  currentname: 'lookupName', existingname: 'lookupName', oldname: 'lookupName',
  description: 'description', desc: 'description', category: 'category', unit: 'unit',
  price: 'price', sellingprice: 'price', saleprice: 'price', mrp: 'price',
  costprice: 'costPrice', cost: 'costPrice', purchaseprice: 'costPrice',
  stock: 'stock', quantity: 'stock', qty: 'stock', inventory: 'stock',
  lowstockat: 'lowStockAt', lowstock: 'lowStockAt', reorderlevel: 'lowStockAt',
}

const numericProductFields = new Set(['price', 'costPrice', 'stock', 'lowStockAt'])
const textProductFields = new Set(['name', 'description', 'category', 'unit'])

const normalizeHeader = (header) =>
  String(header || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')

const normalizeExcelRow = (row) => {
  const normalized = {}
  for (const [key, value] of Object.entries(row)) {
    const field = excelHeaderMap[normalizeHeader(key)]
    if (field) normalized[field] = value
  }
  return normalized
}

const isBlank = (value) => value === undefined || value === null || String(value).trim() === ''
const cleanString = (value) => String(value).trim()

const parseNonNegativeNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null
  const parsed = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const findProductForExcelRow = async (row, wholesalerId) => {
  const productId = isBlank(row.productId) ? '' : cleanString(row.productId)

  if (productId) {
    if (!mongoose.isValidObjectId(productId)) return { error: `invalid productId "${productId}"` }
    const product = await Product.findOne({ _id: productId, wholesaler: wholesalerId })
    return product ? { product } : { notFound: true }
  }

  const lookupName = !isBlank(row.lookupName) ? cleanString(row.lookupName) : !isBlank(row.name) ? cleanString(row.name) : ''
  if (!lookupName) return { error: 'missing productId or product name' }

  const matches = await Product.find({
    wholesaler: wholesalerId,
    isActive: true,
    name: { $regex: `^${escapeRegex(lookupName)}$`, $options: 'i' },
  }).limit(2)

  if (matches.length === 1) return { product: matches[0] }
  if (matches.length > 1) return { error: `multiple active products match "${lookupName}"` }
  return { notFound: true }
}

export const bulkUpdateProducts = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(StatusCode.BAD_REQUEST, 'No file uploaded.')

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) throw new ApiError(StatusCode.BAD_REQUEST, 'Excel file has no sheets.')

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })
    if (rows.length === 0) throw new ApiError(StatusCode.BAD_REQUEST, 'Excel file is empty.')

    let updated = 0, notFound = 0
    const errors = []

    for (const [index, rawRow] of rows.entries()) {
      const rowNumber = index + 2
      const row = normalizeExcelRow(rawRow)
      const lookup = await findProductForExcelRow(row, req.user.id)

      if (lookup.error) { errors.push(`Row ${rowNumber}: ${lookup.error}.`); continue }
      if (lookup.notFound) { notFound++; errors.push(`Row ${rowNumber}: product not found.`); continue }

      const product = lookup.product
      const updates = {}
      let rowHasError = false

      for (const field of numericProductFields) {
        if (isBlank(row[field])) continue
        const value = parseNonNegativeNumber(row[field])
        if (value === null) {
          errors.push(`Row ${rowNumber}: ${field} must be a non-negative number.`)
          rowHasError = true
          continue
        }
        updates[field] = value
      }

      for (const field of textProductFields) {
        if (isBlank(row[field])) continue
        const value = cleanString(row[field])
        if (field === 'name' && !value) {
          errors.push(`Row ${rowNumber}: name cannot be empty.`)
          rowHasError = true
          continue
        }
        updates[field] = value
      }

      if (rowHasError) continue
      if (Object.keys(updates).length === 0) {
        errors.push(`Row ${rowNumber}: no product values to update.`)
        continue
      }

      Object.assign(product, updates)
      await product.save()
      updated++
    }

    const skipped = rows.length - updated
    return res.status(200).json({
      success: true,
      message: `${updated} product(s) updated successfully.${skipped ? ` ${skipped} row(s) skipped.` : ''}`,
      summary: { totalRows: rows.length, updated, skipped, notFound, errors },
    })
  } catch (err) { next(err) }
}
