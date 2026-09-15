import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String, required: true, trim: true,
    },
    email: {
      type: String, required: true, unique: true,
      lowercase: true, trim: true,
    },
    password: {
      type: String, required: true, minlength: 8, select: false,
    },
    phone: {
      type: String, trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manufacturer', 'distributor', 'wholesaler', 'salesman', 'retailer'],
      required: true,
    },
    businessName: { type: String, trim: true },
    city:         { type: String, trim: true },

    // ── Multi-Tier Network References ──
    wholesaler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    distributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    manufacturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'pending',
    },
    profileImage: {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    refreshTokens: [{ type: String, select: false }],
    lastLogin: { type: Date },
    resetOtp: { type: String },
    resetOtpExpiry: { type: Date },
    addresses: [{
      label:     { type: String, trim: true },
      line1:     { type: String, trim: true },
      line2:     { type: String, trim: true },
      city:      { type: String, trim: true },
      state:     { type: String, trim: true },
      pincode:   { type: String, trim: true },
      isDefault: { type: Boolean, default: false },
    }],
  },
  { timestamps: true }
)

userSchema.index({ role: 1, status: 1, wholesaler: 1, distributor: 1, manufacturer: 1 })

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.refreshTokens
  return obj
}

const User = mongoose.model('User', userSchema)
export default User
