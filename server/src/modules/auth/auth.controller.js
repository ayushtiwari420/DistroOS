import { validationResult } from 'express-validator'
import { ApiError, StatusCode } from '../../utils/apiError.utils.js'
import * as authService from './auth.service.js'
import User from '../users/user.model.js'

const throwValidationErrors = (req) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    throw new ApiError(StatusCode.UNPROCESSABLE_ENTITY, 'Validation failed.', errors.array())
  }
}

export const register = async (req, res, next) => {
  try {
    throwValidationErrors(req)
    const result = await authService.registerUser(req.body, res)
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      ...result,
    })
  } catch (err) { next(err) }
}

export const login = async (req, res, next) => {
  try {
    throwValidationErrors(req)
    const result = await authService.loginUser(req.body, res)
    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      ...result,
    })
  } catch (err) { next(err) }
}

export const refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshSession(req, res)
    return res.status(200).json({ success: true, ...result })
  } catch (err) { next(err) }
}

export const logout = async (req, res, next) => {
  try {
    await authService.logoutSession(req, res)
    return res.status(200).json({ success: true, message: 'Logged out successfully.' })
  } catch {
    return res.status(200).json({ success: true, message: 'Logged out.' })
  }
}

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) throw new ApiError(StatusCode.NOT_FOUND, 'User not found.')
    return res.status(200).json({ success: true, user })
  } catch (err) { next(err) }
}

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
  } catch (err) { next(err) }
}

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
  } catch (err) { next(err) }
}

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = await authService.sendResetOtp(req.body.email)
    return res.status(200).json({
      success: true,
      message: `OTP sent to ${email}. Valid for 10 minutes.`,
    })
  } catch (err) { next(err) }
}

export const verifyOtp = async (req, res, next) => {
  try {
    await authService.verifyResetOtp(req.body.email, req.body.otp)
    return res.status(200).json({ success: true, message: 'OTP verified successfully.' })
  } catch (err) { next(err) }
}

export const resetPassword = async (req, res, next) => {
  try {
    await authService.executePasswordReset(req.body.email, req.body.newPassword)
    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' })
  } catch (err) { next(err) }
}

export const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    return res.status(200).json({ success: true, addresses: user.addresses || [] })
  } catch (err) { next(err) }
}

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

export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId)
    await user.save({ validateBeforeSave: false })
    return res.status(200).json({ success: true, message: 'Address removed.', addresses: user.addresses })
  } catch (err) { next(err) }
}

export const setDefaultAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    user.addresses.forEach(a => { a.isDefault = a._id.toString() === req.params.addressId })
    await user.save({ validateBeforeSave: false })
    return res.status(200).json({ success: true, message: 'Default address updated.', addresses: user.addresses })
  } catch (err) { next(err) }
}
