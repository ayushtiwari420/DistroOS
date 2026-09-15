import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wholesaler: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action:     { type: String, required: true, trim: true },
  resource:   { type: String, required: true, trim: true },
  resourceId: { type: String, default: '' },
  details:    { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress:  { type: String, default: '' },
}, { timestamps: true })

auditLogSchema.index({ wholesaler: 1, createdAt: -1 })
auditLogSchema.index({ user: 1, createdAt: -1 })

const AuditLog = mongoose.model('AuditLog', auditLogSchema)
export default AuditLog
