import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  unitPrice:   { type: Number, required: true },
  totalPrice:  { type: Number, required: true },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  wholesaler:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  retailer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  salesman:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  items:       [orderItemSchema],
  totalAmount: { type: Number, required: true },
  amountPaid:  { type: Number, default: 0, min: 0 },
  balanceDue:  { type: Number, default: 0, min: 0 },

  status: {
    type: String,
    enum: ['pending', 'approved', 'dispatched', 'delivered', 'cancelled'],
    default: 'pending',
  },

  paymentType: {
    type: String,
    enum: ['cash', 'credit', 'upi'],
    default: 'cash',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid',
  },

  notes:           { type: String, trim: true },
  rejectionReason: { type: String, trim: true },

  approvedAt:   { type: Date },
  dispatchedAt: { type: Date },
  deliveredAt:  { type: Date },
}, { timestamps: true })

orderSchema.index({ wholesaler: 1, retailer: 1, status: 1, createdAt: -1 })
orderSchema.index({ wholesaler: 1, status: 1, createdAt: -1 })
orderSchema.index({ wholesaler: 1, 'items.product': 1, status: 1 })

orderSchema.pre('save', async function () {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-6)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    this.orderNumber = `ORD-${timestamp}-${randomSuffix}`
  }
  if (this.isModified('amountPaid') || this.isModified('totalAmount')) {
    this.balanceDue = Math.max(0, this.totalAmount - (this.amountPaid || 0))
    if (this.balanceDue === 0) {
      this.paymentStatus = 'paid'
    } else if (this.amountPaid > 0) {
      this.paymentStatus = 'partial'
    } else {
      this.paymentStatus = 'unpaid'
    }
  }
})

const Order = mongoose.model('Order', orderSchema)
export default Order
