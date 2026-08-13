import { validationResult } from 'express-validator'
import User                  from '../models/User.model.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} from '../utils/token.utils.js'
import { sendOtpEmail } from '../utils/email.utils.js'
import { ApiError, StatusCode } from '../utils/apiError.utils.js'

// ── Helper: send validation errors ──
const throwValidationErrors = (req) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ApiError(StatusCode.UNPROCESSABLE_ENTITY, 'Validation failed.', errors.array())
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    throwValidationErrors(req)

    const { name, email, password, role, businessName, city, phone } = req.body

    // Block admin self-registration
    if (role === 'admin') {
      throw new ApiError(StatusCode.FORBIDDEN, 'Admin accounts cannot be self-registered.')
    }

    // Check duplicate email
    const existing = await User.findOne({ email })
    if (existing) {
      throw new ApiError(StatusCode.CONFLICT, 'An account with this email already exists.')
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      businessName,
      city,
      phone,
      // Wholesalers start as pending until admin approves
      status: role === 'wholesaler' ? 'pending' : 'active',
    })

    // Tokens
    const accessToken  = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    // Save refresh token to DB
    await User.findByIdAndUpdate(
      user._id,
      { $set: { refreshTokens: [refreshToken] } },
      { returnDocument: 'after' }
    )

    setRefreshCookie(res, refreshToken)

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      accessToken,
      user,
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    throwValidationErrors(req)

    const { email, password } = req.body

    // Find user + include password
    const user = await User.findOne({ email }).select('+password +refreshTokens')
    if (!user) {
      throw new ApiError(StatusCode.UNAUTHORIZED, 'Invalid email or password.')
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      throw new ApiError(StatusCode.UNAUTHORIZED, 'Invalid email or password.')
    }

    // Check account status
    if (user.status === 'suspended') {
      throw new ApiError(StatusCode.FORBIDDEN, 'Your account has been suspended. Contact support.')
    }

    if (user.status === 'pending') {
      throw new ApiError(StatusCode.FORBIDDEN, 'Your account is pending approval. You will be notified once approved.')
    }

    // Generate tokens
    const accessToken  = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    // Rotate refresh tokens — keep max 5 sessions
    await User.findByIdAndUpdate(
      user._id,
      {
        $set: { lastLogin: new Date() },
        $push: {
          refreshTokens: {
            $each: [refreshToken],
            $slice: -5
          }
        }
      },
      { returnDocument: 'after' }
    )

    setRefreshCookie(res, refreshToken)

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      accessToken,
      user,
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ────────────────────���────────────────────────────────────────
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken
    if (!token) {
      throw new ApiError(StatusCode.UNAUTHORIZED, 'No refresh token.')
    }

    // Verify token
    let decoded
    try {
      decoded = verifyRefreshToken(token)
    } catch {
      clearRefreshCookie(res)
      throw new ApiError(StatusCode.UNAUTHORIZED, 'Invalid or expired refresh token.')
    }

    // Find user and check token exists in DB
    const user = await User.findById(decoded.id).select('+refreshTokens')
    if (!user || !user.refreshTokens.includes(token)) {
      clearRefreshCookie(res)
      throw new ApiError(StatusCode.UNAUTHORIZED, 'Refresh token reuse detected. Please login again.')
    }

    // Rotate tokens
    const newAccessToken  = generateAccessToken(user)
    const newRefreshToken = generateRefreshToken(user)

    // FIXED: Split into two operations to avoid array conflict
    // Remove old token first
    await User.findByIdAndUpdate(
      user._id,
      { $pull: { refreshTokens: token } },
      { returnDocument: 'after' }
    )
    
    // Then add new token
    await User.findByIdAndUpdate(
      user._id,
      { $push: { refreshTokens: newRefreshToken } },
      { returnDocument: 'after' }
    )

    setRefreshCookie(res, newRefreshToken)

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken
    if (token) {
      // Remove this token from DB
      const decoded = verifyRefreshToken(token)
      await User.findByIdAndUpdate(decoded.id, {
        $pull: { refreshTokens: token },
      }, { returnDocument: 'after' })
    }
    clearRefreshCookie(res)
    return res.status(200).json({ success: true, message: 'Logged out successfully.' })
  } catch {
    clearRefreshCookie(res)
    return res.status(200).json({ success: true, message: 'Logged out.' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me
// Protected — requires valid access token
// ─────────────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      throw new ApiError(StatusCode.NOT_FOUND, 'User not found.')
    }
    return res.status(200).json({ success: true, user })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/auth/me
// Update logged-in user's profile
// ─────────────────────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) throw new ApiError(StatusCode.NOT_FOUND, 'User not found.')

    const fields = ['name', 'phone', 'city', 'businessName']
    fields.forEach(f => { if (req.body[f] !== undefined) user[f] = req.body[f] })

    if (req.file) {
      user.profileImage = {
        url:      req.file.path,
        publicId: req.file.filename,
      }
    }

    await user.save({ validateBeforeSave: false })

    return res.status(200).json({ success: true, message: 'Profile updated successfully.', user })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/auth/change-password
// ─────────────────────────────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      throw new ApiError(StatusCode.BAD_REQUEST, 'Both current and new password are required.')
    }

    const user = await User.findById(req.user.id).select('+password')
    if (!user) throw new ApiError(StatusCode.NOT_FOUND, 'User not found.')

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) throw new ApiError(StatusCode.UNAUTHORIZED, 'Current password is incorrect.')

    user.password = newPassword
    await user.save()

    return res.status(200).json({ success: true, message: 'Password changed successfully.' })
  } catch (err) {
    next(err)
  }
}

// ── Helper: generate 6-digit OTP ──
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString()

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Step 1 — Send OTP to email
// ─────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    if (!email) throw new ApiError(StatusCode.BAD_REQUEST, 'Email is required.')

    const user = await User.findOne({ email })
    if (!user) throw new ApiError(StatusCode.NOT_FOUND, 'No account found with this email.')

    const otp    = generateOtp()
    const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    user.resetOtp       = otp
    user.resetOtpExpiry = expiry
    await user.save({ validateBeforeSave: false })

    const mailInfo = await sendOtpEmail(user.email, otp, user.name)
    console.log(`[MAIL] Password reset OTP accepted for ${user.email}: ${mailInfo.messageId || 'accepted'}`)

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${email}. Valid for 10 minutes.`,
    })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// Step 2 — Verify OTP
// ─────────────────────────────────────────────────────────────
export const verifyOtp = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const otp = String(req.body.otp || '').trim()
    if (!email || !otp) throw new ApiError(StatusCode.BAD_REQUEST, 'Email and OTP are required.')

    const user = await User.findOne({ email })
    if (!user) throw new ApiError(StatusCode.NOT_FOUND, 'No account found with this email.')

    if (!user.resetOtp || !user.resetOtpExpiry) {
      throw new ApiError(StatusCode.BAD_REQUEST, 'No OTP requested. Please request a new one.')
    }

    if (new Date() > user.resetOtpExpiry) {
      user.resetOtp       = undefined
      user.resetOtpExpiry = undefined
      await user.save({ validateBeforeSave: false })
      throw new ApiError(StatusCode.BAD_REQUEST, 'OTP has expired. Please request a new one.')
    }

    if (user.resetOtp !== otp) {
      throw new ApiError(StatusCode.BAD_REQUEST, 'Invalid OTP. Please try again.')
    }

    // OTP is valid — give a short-lived reset token (just mark in DB)
    user.resetOtp = 'VERIFIED'
    await user.save({ validateBeforeSave: false })

    return res.status(200).json({ success: true, message: 'OTP verified successfully.' })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// Step 3 — Set new password
// ─────────────────────────────────────────────────────────────
export const resetPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const { newPassword } = req.body

    if (!email || !newPassword) {
      throw new ApiError(StatusCode.BAD_REQUEST, 'Email and new password are required.')
    }

    if (newPassword.length < 8) {
      throw new ApiError(StatusCode.BAD_REQUEST, 'Password must be at least 8 characters.')
    }

    const user = await User.findOne({ email })
    if (!user) throw new ApiError(StatusCode.NOT_FOUND, 'No account found.')

    if (user.resetOtp !== 'VERIFIED') {
      throw new ApiError(StatusCode.BAD_REQUEST, 'Please verify your OTP first.')
    }

    // Set new password + clear OTP fields
    user.password       = newPassword
    user.resetOtp       = undefined
    user.resetOtpExpiry = undefined
    await user.save()

    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// ADDRESS MANAGEMENT
// ─────────────────────────────────────────────────────────────

// GET /api/auth/addresses
export const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    return res.status(200).json({ success: true, addresses: user.addresses || [] })
  } catch (err) { next(err) }
}

// POST /api/auth/addresses
export const addAddress = async (req, res, next) => {
  try {
    const { label, line1, line2, city, state, pincode, isDefault } = req.body
    const user = await User.findById(req.user.id)

    if (isDefault) {
      user.addresses.forEach(a => { a.isDefault = false })
    }

    user.addresses.push({ label, line1, line2, city, state, pincode, isDefault: isDefault || user.addresses.length === 0 })
    await user.save({ validateBeforeSave: false })

    return res.status(201).json({ success: true, message: 'Address added.', addresses: user.addresses })
  } catch (err) { next(err) }
}

// PUT /api/auth/addresses/:addressId
export const updateAddress = async (req, res, next) => {
  try {
    const user    = await User.findById(req.user.id)
    const address = user.addresses.id(req.params.addressId)
    if (!address) throw new ApiError(StatusCode.NOT_FOUND, 'Address not found.')

    if (req.body.isDefault) {
      user.addresses.forEach(a => { a.isDefault = false })
    }

    Object.assign(address, req.body)
    await user.save({ validateBeforeSave: false })

    return res.status(200).json({ success: true, message: 'Address updated.', addresses: user.addresses })
  } catch (err) { next(err) }
}

// DELETE /api/auth/addresses/:addressId
export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId)
    await user.save({ validateBeforeSave: false })
    return res.status(200).json({ success: true, message: 'Address removed.', addresses: user.addresses })
  } catch (err) { next(err) }
}

// PATCH /api/auth/addresses/:addressId/default
export const setDefaultAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    user.addresses.forEach(a => { a.isDefault = a._id.toString() === req.params.addressId })
    await user.save({ validateBeforeSave: false })
    return res.status(200).json({ success: true, message: 'Default address updated.', addresses: user.addresses })
  } catch (err) { next(err) }
}
