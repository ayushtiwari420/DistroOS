import mongoose from 'mongoose'

const creditTransactionSchema = new mongoose.Schema({
  type:    { type: String, enum: ['debit', 'credit'], required: true }, // debit = amount owed, credit = repayment
  amount:  { type: Number, required: true },
  note:    { type: String, trim: true },
  order:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  date:    { type: Date, default: Date.now },
}, { _id: true })

const creditSchema = new mongoose.Schema({
  wholesaler:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  retailer:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // ── Limits ──
  creditLimit:  { type: Number, default: 0 },  // max credit allowed
  currentDue:   { type: Number, default: 0 },  // current outstanding amount

  // ── Transactions ──
  transactions: [creditTransactionSchema],

  // ── Status ──
  status: {
    type: String,
    enum: ['clear', 'overdue', 'blocked'],
    default: 'clear',
  },

  lastPaymentDate: { type: Date },
}, { timestamps: true })

const Credit = mongoose.model('Credit', creditSchema)
export default Credit