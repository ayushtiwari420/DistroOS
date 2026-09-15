import Product from '../models/product.model.js'
import XLSX from 'xlsx'
import mongoose from 'mongoose'
import { ApiError, StatusCode } from '../utils/apiError.utils.js'

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
     image: {
        url:      req.file?.path || '',
        publicId: req.file?.filename || '',
    }
})

    return res.status(201).json({ success: true, message: 'Product created.', product })
  } catch (err) {
  console.error('CREATE PRODUCT ERROR:', err)
  next(err)
}
}

// ─────────────────────────────────────────────────────────────
// GET /api/products
// Wholesaler sees their products; Retailer/Salesman sees wholesaler's products
// ─────────────────────────────────────────────────────────────
export const getProducts = async (req, res, next) => {
  try {
    const { id, role, wholesaler } = req.user
    const { 
         category, 
         search, 
         lowStock,
         minPrice,
         maxPrice,
         sort="newest",
         page=1, 
         limit=20
         } = req.query
    // pagination
    const currentPage=Math.max(parseInt(page,10) || 1,1)

    const pageLimit=Math.min(
      Math.max(parseInt(limit,10) || 20,1),
      100
    )
    const skip=(currentPage-1)*pageLimit

    // price validation
    const parseMinPrice=minPrice!==undefined?Number(minPrice):undefined
    const parseMaxPrice=maxPrice!==undefined?Number(maxPrice):undefined
    if(parseMinPrice!==undefined && (!Number.isFinite(parseMinPrice) || parseMinPrice<0)){
      throw new ApiError(StatusCode.BAD_REQUEST,"MinPrice must be a valid non-negative number")
    }
    if(parseMaxPrice!==undefined && (!Number.isFinite(parseMaxPrice) || parseMaxPrice<0)){
      throw new ApiError(StatusCode.BAD_REQUEST,"MaxPrice must be a valid non-negative number")
    }
    if(parseMinPrice!==undefined &&
      parseMaxPrice!==undefined && 
      parseMinPrice>parseMaxPrice
    ){
      throw new ApiError(
        StatusCode.BAD_REQUEST,
        "Minprice cannot be greater than maxPrice"
      )
    }
    // mongodb filter
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
    if(parseMinPrice!==undefined || parseMaxPrice!==undefined){
      filter.price={}
      if(parseMinPrice!==undefined){
        filter.price.$gte=parseMinPrice
      }
      if(parseMaxPrice!==undefined){
        filter.price.$lte=parseMaxPrice
      }
    }
    if (lowStock === 'true') filter.$expr = { $lte: ['$stock', '$lowStockAt'] }
    // sorting
    const sortOptions={
      newest:{createdAt:-1},
      oldest:{createdAt:1},
      name_asc:{name:1},
      name_desc:{name:-1},
      price_asc:{price:1},
      price_desc:{price:-1},
      stock_asc:{stock:1},
      stock_desc:{stock:-1}
    }
    const sortQuery=sortOptions[sort]
    if(!sortQuery){
      throw new ApiError(
        StatusCode.BAD_REQUEST,
        `Invalid sort option:${sort}`
      )
    }
    // mongodb query
    const [products,total] = await Promise.all([
      Product.find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(pageLimit),
      Product.countDocuments(filter)
    ])
    // response
    const totalPages=Math.ceil(total/pageLimit)
    return res.status(200).json({
       success: true, 
       products, 
       pagination:{
        page:currentPage,
        limit:pageLimit,
        total,
        totalPages,
        hasNextPage:currentPage<totalPages,
        hasPreviousPage:currentPage>1
       }
    })
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
    if (!product) throw new ApiError(StatusCode.NOT_FOUND, 'Product not found.')
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
    if (!product) throw new ApiError(StatusCode.NOT_FOUND, 'Product not found.')

    const fields = ['name', 'description', 'category', 'unit', 'price', 'costPrice', 'stock', 'lowStockAt', 'isActive']
    fields.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f] })
    if (req.file) {
      product.image = {
      url:      req.file.path,
      publicId: req.file.filename,
    }
  }
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
    if (!product) throw new ApiError(StatusCode.NOT_FOUND, 'Product not found.')

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
    if (!product) throw new ApiError(StatusCode.NOT_FOUND, 'Product not found.')

    if (type === 'add')      product.stock += quantity
    if (type === 'subtract') {
      if (product.stock < quantity) throw new ApiError(StatusCode.BAD_REQUEST, 'Insufficient stock.')
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


const excelHeaderMap = {
  id: 'productId',
  productid: 'productId',
  mongoid: 'productId',
  mongodbid: 'productId',
  name: 'name',
  product: 'name',
  productname: 'name',
  newname: 'name',
  currentname: 'lookupName',
  existingname: 'lookupName',
  oldname: 'lookupName',
  description: 'description',
  desc: 'description',
  category: 'category',
  unit: 'unit',
  price: 'price',
  sellingprice: 'price',
  saleprice: 'price',
  mrp: 'price',
  costprice: 'costPrice',
  cost: 'costPrice',
  purchaseprice: 'costPrice',
  stock: 'stock',
  quantity: 'stock',
  qty: 'stock',
  inventory: 'stock',
  lowstockat: 'lowStockAt',
  lowstock: 'lowStockAt',
  reorderlevel: 'lowStockAt',
}

const numericProductFields = new Set(['price', 'costPrice', 'stock', 'lowStockAt'])
const textProductFields = new Set(['name', 'description', 'category', 'unit'])

const normalizeHeader = (header) =>
  String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const normalizeExcelRow = (row) => {
  const normalized = {}

  for (const [key, value] of Object.entries(row)) {
    const field = excelHeaderMap[normalizeHeader(key)]
    if (field) normalized[field] = value
  }

  return normalized
}

const importHeaderMap = {
  // Product name
  name: 'name',
  productname: 'name',
  producttitle: 'name',
  title: 'name',

  // Category
  maincategory: 'main_category',
  category: 'main_category',
  productcategory: 'main_category',

  // Description
  aboutproduct: 'about_product',
  description: 'about_product',
  productdescription: 'about_product',

  // Price
  discountprice: 'discount_price',
  discountedprice: 'discount_price',
  saleprice: 'discount_price',
  price: 'discount_price',

  // Image
  image: 'image',
  imglink: 'image',
  imagelink: 'image',
  imageurl: 'image',
}

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === ''

const cleanString = (value) => String(value).trim()

const parseNonNegativeNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null

  const parsed = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

const parsePrice = (value) => {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null

  const cleaned = String(value).replace(/[^0-9.-]/g, '').trim()
  if (!cleaned) return null

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

const normalizeImportRow = (row) => {
  const normalized = {}

  for (const [key, value] of Object.entries(row)) {
    const mapped = importHeaderMap[normalizeHeader(key)]
    if (mapped) normalized[mapped] = value
  }

  return normalized
}

const validateImportRow = (row) => {
  const errors = []

  if (isBlank(row.name)) errors.push('Name is required')
  if (isBlank(row.discount_price)) errors.push('Price is required')

  const parsedPrice = parsePrice(row.discount_price)
  if (!isBlank(row.discount_price) && parsedPrice === null) errors.push('Invalid price')
  if (parsedPrice !== null && parsedPrice < 0) errors.push('Price must be greater than or equal to 0')

  return {
    isValid: errors.length === 0,
    parsedPrice,
    errors,
  }
}

const transformAmazonRow = (row, wholesalerId, parsedPrice) => ({
  wholesaler: wholesalerId,
  name: cleanString(row.name),
  description: isBlank(row.about_product) ? '' : cleanString(row.about_product),
  category: isBlank(row.main_category) ? '' : cleanString(row.main_category),
  unit: 'piece',
  price: parsedPrice,
  costPrice: 0,
  stock: 0,
  lowStockAt: 10,
  isActive: true,
  image: {
    url: isBlank(row.image) ? '' : cleanString(row.image),
    publicId: '',
  },
})

const chunkArray = (array, size) => {
  const chunks = []

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }

  return chunks
}

const BATCH_SIZE = 500

const collectBulkWriteErrors = (error, batchEntries) => {
  const writeErrors = Array.isArray(error?.writeErrors) ? error.writeErrors : []
  const insertedDocsCount = Array.isArray(error?.insertedDocs)
    ? error.insertedDocs.length
    : null

  const rowErrors = writeErrors.map((writeError) => {
    const batchIndex = Number.isInteger(writeError?.index) ? writeError.index : -1
    const rowNumber = batchIndex >= 0 ? batchEntries[batchIndex]?.row : undefined
    return {
      row: rowNumber || 0,
      reason: writeError?.errmsg || writeError?.message || 'Database insert error',
    }
  })

  return { writeErrors, insertedDocsCount, rowErrors }
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const findProductForExcelRow = async (row, wholesalerId) => {
  const productId = isBlank(row.productId) ? '' : cleanString(row.productId)

  if (productId) {
    if (!mongoose.isValidObjectId(productId)) {
      return { error: `invalid productId "${productId}"` }
    }

    const product = await Product.findOne({ _id: productId, wholesaler: wholesalerId })
    return product ? { product } : { notFound: true }
  }

  const lookupName = !isBlank(row.lookupName)
    ? cleanString(row.lookupName)
    : !isBlank(row.name)
      ? cleanString(row.name)
      : ''

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

// updating existing products in bulk using excel file
export const bulkUpdateProducts = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(StatusCode.BAD_REQUEST, 'No file uploaded.')

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    if (!sheet) throw new ApiError(StatusCode.BAD_REQUEST, 'Excel file has no sheets.')

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })
    console.log('AMAZON CSV HEADERS:')
    console.log(Object.keys(rows[0] || {}))
    if (rows.length === 0) throw new ApiError(StatusCode.BAD_REQUEST, 'Excel file is empty.')

    let updated = 0
    let notFound = 0
    const errors = []

    for (const [index, rawRow] of rows.entries()) {
      const rowNumber = index + 2
      const row = normalizeExcelRow(rawRow)
      const lookup = await findProductForExcelRow(row, req.user.id)

      if (lookup.error) {
        errors.push(`Row ${rowNumber}: ${lookup.error}.`)
        continue
      }

      if (lookup.notFound) {
        notFound++
        errors.push(`Row ${rowNumber}: product not found.`)
        continue
      }

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
      summary: {
        totalRows: rows.length,
        updated,
        skipped,
        notFound,
        errors,
      },
    })
  } catch (err) {
    next(err)
  }
}

const normalizeProductName = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}
export const bulkImportProducts = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(
        StatusCode.BAD_REQUEST,
        'No file uploaded.'
      )
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: 'buffer',
      raw: false
    })

    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    if (!sheet) {
      throw new ApiError(
        StatusCode.BAD_REQUEST,
        'File has no readable sheet.'
      )
    }

    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: null
    })

    if (rows.length === 0) {
      throw new ApiError(
        StatusCode.BAD_REQUEST,
        'Uploaded file is empty.'
      )
    }

    // ==========================================
    // GET EXISTING PRODUCT NAMES
    // ==========================================

    const existingProducts = await Product.find(
      {
        wholesaler: req.user.id
      },
      {
        name: 1
      }
    ).lean()

    const existingNames = new Set(
      existingProducts.map((product) =>
        normalizeProductName(product.name)
      )
    )

    // ==========================================
    // PROCESS ROWS
    // ==========================================

    const entriesToInsert = []
    const errors = []

    let duplicates = 0

    for (const [index, rawRow] of rows.entries()) {
      const rowNumber = index + 2

      const normalized = normalizeImportRow(rawRow)

      const validation = validateImportRow(normalized)

      if (!validation.isValid) {
        errors.push({
          row: rowNumber,
          reason: validation.errors.join(', ')
        })

        continue
      }

      const normalizedName = normalizeProductName(
        normalized.name
      )

      // ========================================
      // DUPLICATE CHECK
      // ========================================

      if (existingNames.has(normalizedName)) {
        duplicates++

        errors.push({
          row: rowNumber,
          reason: 'Duplicate product name'
        })

        continue
      }

      // Add immediately so duplicate rows
      // inside the SAME CSV are also detected.
      existingNames.add(normalizedName)

      entriesToInsert.push({
        row: rowNumber,
        doc: transformAmazonRow(
          normalized,
          req.user.id,
          validation.parsedPrice
        )
      })
    }

    // ==========================================
    // BATCH INSERT
    // ==========================================

    let imported = 0

    if (entriesToInsert.length > 0) {
      const batches = chunkArray(
        entriesToInsert,
        BATCH_SIZE
      )

      for (const batchEntries of batches) {
        const batchDocs = batchEntries.map(
          (entry) => entry.doc
        )

        try {
          const inserted = await Product.insertMany(
            batchDocs,
            {
              ordered: false
            }
          )

          imported += inserted.length

        } catch (err) {
          const {
            writeErrors,
            insertedDocsCount,
            rowErrors
          } = collectBulkWriteErrors(
            err,
            batchEntries
          )

          if (
            writeErrors.length === 0 &&
            insertedDocsCount === null
          ) {
            throw err
          }

          if (insertedDocsCount !== null) {
            imported += insertedDocsCount
          } else {
            imported += Math.max(
              batchEntries.length - writeErrors.length,
              0
            )
          }

          errors.push(...rowErrors)
        }
      }
    }

    const skipped =
      rows.length - imported

    return res.status(200).json({
      success: true,

      summary: {
        totalRows: rows.length,
        imported,
        duplicates,
        skipped,
        errors
      }
    })

  } catch (err) {
    next(err)
  }
}
