import User from '../users/user.model.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} from '../../utils/token.utils.js'
import { sendOtpEmail } from '../../utils/email.utils.js'
import { ApiError, StatusCode } from '../../utils/apiError.utils.js'

export const registerUser = async (data, res) => {
  const { name, email, password, role, businessName, city, phone } = data

  if (role === 'admin') {
    throw new ApiError(StatusCode.FORBIDDEN, 'Admin accounts cannot be self-registered.')
  }

  const existing = await User.findOne({ email })
  if (existing) {
    throw new ApiError(StatusCode.CONFLICT, 'An account with this email already exists.')
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    businessName,
    city,
    phone,
    status: 'active',
  })

  const accessToken  = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  await User.findByIdAndUpdate(
    user._id,
    { $set: { refreshTokens: [refreshToken] } },
    { returnDocument: 'after' }
  )

  setRefreshCookie(res, refreshToken)

  return { accessToken, user }
}

export const loginUser = async (data, res) => {
  const { email, password } = data

  const user = await User.findOne({ email }).select('+password +refreshTokens')
  if (!user) {
    throw new ApiError(StatusCode.UNAUTHORIZED, 'Invalid email or password.')
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new ApiError(StatusCode.UNAUTHORIZED, 'Invalid email or password.')
  }

  if (user.status === 'suspended') {
    throw new ApiError(StatusCode.FORBIDDEN, 'Your account has been suspended. Contact support.')
  }

  if (user.status === 'pending') {
    throw new ApiError(StatusCode.FORBIDDEN, 'Your account is pending approval. You will be notified once approved.')
  }

  const accessToken  = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

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

  return { accessToken, user }
}

export const refreshSession = async (req, res) => {
  const token = req.cookies.refreshToken
  if (!token) {
    throw new ApiError(StatusCode.UNAUTHORIZED, 'No refresh token.')
  }

  let decoded
  try {
    decoded = verifyRefreshToken(token)
  } catch {
    clearRefreshCookie(res)
    throw new ApiError(StatusCode.UNAUTHORIZED, 'Invalid or expired refresh token.')
  }

  const user = await User.findById(decoded.id).select('+refreshTokens')
  if (!user || !user.refreshTokens.includes(token)) {
    clearRefreshCookie(res)
    throw new ApiError(StatusCode.UNAUTHORIZED, 'Refresh token reuse detected. Please login again.')
  }

  const newAccessToken  = generateAccessToken(user)
  const newRefreshToken = generateRefreshToken(user)

  await User.findByIdAndUpdate(
    user._id,
    { $pull: { refreshTokens: token } },
    { returnDocument: 'after' }
  )

  await User.findByIdAndUpdate(
    user._id,
    { $push: { refreshTokens: newRefreshToken } },
    { returnDocument: 'after' }
  )

  setRefreshCookie(res, newRefreshToken)

  return { accessToken: newAccessToken }
}

export const logoutSession = async (req, res) => {
  try {
    const token = req.cookies.refreshToken
    if (token) {
      const decoded = verifyRefreshToken(token)
      await User.findByIdAndUpdate(decoded.id, {
        $pull: { refreshTokens: token },
      }, { returnDocument: 'after' })
    }
    clearRefreshCookie(res)
  } catch {
    clearRefreshCookie(res)
  }
}

export const sendResetOtp = async (emailInput) => {
  const email = String(emailInput || '').trim().toLowerCase()
  if (!email) throw new ApiError(StatusCode.BAD_REQUEST, 'Email is required.')

  const user = await User.findOne({ email })
  if (!user) throw new ApiError(StatusCode.NOT_FOUND, 'No account found with this email.')

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiry = new Date(Date.now() + 10 * 60 * 1000)

  user.resetOtp       = otp
  user.resetOtpExpiry = expiry
  await user.save({ validateBeforeSave: false })

  await sendOtpEmail(user.email, otp, user.name)

  return { email }
}

export const verifyResetOtp = async (emailInput, otpInput) => {
  const email = String(emailInput || '').trim().toLowerCase()
  const otp = String(otpInput || '').trim()
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

  user.resetOtp = 'VERIFIED'
  await user.save({ validateBeforeSave: false })

  return { email }
}

export const executePasswordReset = async (emailInput, newPassword) => {
  const email = String(emailInput || '').trim().toLowerCase()
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

  user.password       = newPassword
  user.resetOtp       = undefined
  user.resetOtpExpiry = undefined
  await user.save()

  return { success: true }
}
