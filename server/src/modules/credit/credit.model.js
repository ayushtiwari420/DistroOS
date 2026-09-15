import mongoose from 'mongoose'

const creditTransactionSchema = new mongoose.Schema({
  type:           { type: String, enum: ['debit', 'credit'], required: true },
  amount:         { type: Number, required: true },
  runningBalance: { type: Number, default: 0 },
  note:           { type: String, trim: true },
  order:          { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  date:           { type: Date, default: Date.now },
}, { _id: true })

const creditSchema = new mongoose.Schema({
  wholesaler:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  retailer:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creditLimit:  { type: Number, default: 0 },
  currentDue:   { type: Number, default: 0 },
  transactions: [creditTransactionSchema],
  status: {
    type: String,
    enum: ['clear', 'overdue', 'blocked'],
    default: 'clear',
  },
  lastPaymentDate: { type: Date },
}, { timestamps: true })

creditSchema.index({ wholesaler: 1, retailer: 1 }, { unique: true })
creditSchema.index({ wholesaler: 1, status: 1 })

const Credit = mongoose.model('Credit', creditSchema)
export default Credit
