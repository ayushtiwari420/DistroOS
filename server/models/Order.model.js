import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },  // snapshot at order time
  quantity:    { type: Number, required: true, min: 1 },
  unitPrice:   { type: Number, required: true },
  totalPrice:  { type: Number, required: true },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },

  // ── Parties ──
  wholesaler: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  retailer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  salesman:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // ── Items ──
  items:       [orderItemSchema],
  totalAmount: { type: Number, required: true },

  // ── Status ──
  status: {
    type: String,
    enum: ['pending', 'approved', 'dispatched', 'delivered', 'cancelled'],
    default: 'pending',
  },

  // ── Payment ──
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

  // ── Notes ──
  notes:          { type: String, trim: true },
  rejectionReason:{ type: String, trim: true },

  // ── Timestamps ──
  approvedAt:  { type: Date },
  dispatchedAt:{ type: Date },
  deliveredAt: { type: Date },
}, { timestamps: true })

// ── Auto-generate order number ──
orderSchema.pre('save', async function () {
  if (!this.orderNumber) {
    const count      = await mongoose.model('Order').countDocuments()
    this.orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`
  }
})

const Order = mongoose.model('Order', orderSchema)
export default Order