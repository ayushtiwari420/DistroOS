import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  wholesaler:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category:    { type: String, trim: true },
  unit:        { type: String, default: 'piece', trim: true }, // kg, piece, litre, bag etc

  // ── Pricing ──
  price:       { type: Number, required: true, min: 0 },
  costPrice:   { type: Number, default: 0 },  // for margin calculation

  // ── Inventory ──
  stock:       { type: Number, default: 0, min: 0 },
  lowStockAt:  { type: Number, default: 10 }, // alert threshold

  // ── Status ──
  isActive:    { type: Boolean, default: true },

}, { timestamps: true })

// ── Virtual: isLowStock ──
productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockAt
})

productSchema.set('toJSON', { virtuals: true })

const Product = mongoose.model('Product', productSchema)
export default Product