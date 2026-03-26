import mongoose from 'mongoose'
import bcrypt   from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────
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

    // ── Role ──────────────────────────────────
    role: {
      type: String,
      enum: ['admin', 'wholesaler', 'salesman', 'retailer'],
      required: true,
    },

    // ── Business Info ─────────────────────────
    businessName: { type: String, trim: true },
    city:         { type: String, trim: true },

    // ── Relations ─────────────────────────────
    // Salesman & Retailer belong to a Wholesaler
    wholesaler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Account Status ────────────────────────
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'pending',
    },

    // ── Refresh Tokens ────────────────────────
    refreshTokens: [{ type: String, select: false }],

    // ── Timestamps ────────────────────────────
    lastLogin: { type: Date },
  },
  { timestamps: true }
)

// ── Hash password before save ──
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});


// ── Compare password method ──
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// ── Remove sensitive fields from JSON output ──
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.refreshTokens
  return obj
}

const User = mongoose.model('User', userSchema)
export default User
