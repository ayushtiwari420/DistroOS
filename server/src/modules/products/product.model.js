import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  wholesaler:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category:    { type: String, trim: true },
  unit:        { type: String, default: 'piece', trim: true },
  price:       { type: Number, required: true, min: 0 },
  costPrice:   { type: Number, default: 0 },
  stock:       { type: Number, default: 0, min: 0 },
  lowStockAt:  { type: Number, default: 10 },
  isActive:    { type: Boolean, default: true },
  image: {
    url:      { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
}, { timestamps: true })

productSchema.index({ wholesaler: 1, isActive: 1, category: 1, price: 1 })
productSchema.index({ wholesaler: 1, name: 1 })
productSchema.index({ wholesaler: 1, stock: 1, lowStockAt: 1 })

productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockAt
})

productSchema.set('toJSON', { virtuals: true })

const Product = mongoose.model('Product', productSchema)
export default Product
