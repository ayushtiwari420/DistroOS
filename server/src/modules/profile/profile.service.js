import User from '../users/user.model.js'
import cloudinary from '../../config/cloudinary.js'
import { ApiError, StatusCode } from '../../utils/apiError.utils.js'

export const getProfile = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(StatusCode.NOT_FOUND, 'User not found.')
  return user
}

export const updateProfile = async (userId, body) => {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(StatusCode.NOT_FOUND, 'User not found.')

  const { name, phone, city, businessName } = body

  if (name !== undefined) {
    const trimmed = String(name).trim()
    if (trimmed.length < 2 || trimmed.length > 60) {
      throw new ApiError(StatusCode.UNPROCESSABLE_ENTITY, 'Name must be between 2 and 60 characters.')
    }
    user.name = trimmed
  }

  if (phone !== undefined) {
    const trimmed = String(phone).trim()
    if (trimmed && !/^[+]?[0-9\s\-]{7,15}$/.test(trimmed)) {
      throw new ApiError(StatusCode.UNPROCESSABLE_ENTITY, 'Enter a valid phone number.')
    }
    user.phone = trimmed
  }

  if (city !== undefined) {
    const trimmed = String(city).trim()
    if (trimmed.length > 60) {
      throw new ApiError(StatusCode.UNPROCESSABLE_ENTITY, 'City must be under 60 characters.')
    }
    user.city = trimmed
  }

  if (businessName !== undefined) {
    const trimmed = String(businessName).trim()
    if (trimmed.length > 100) {
      throw new ApiError(StatusCode.UNPROCESSABLE_ENTITY, 'Business name must be under 100 characters.')
    }
    user.businessName = trimmed
  }

  await user.save({ validateBeforeSave: false })
  return user
}

export const changePassword = async (userId, body) => {
  const { currentPassword, newPassword, confirmPassword } = body

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError(StatusCode.BAD_REQUEST, 'All password fields are required.')
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(StatusCode.UNPROCESSABLE_ENTITY, 'New password and confirmation do not match.')
  }

  if (newPassword.length < 8) {
    throw new ApiError(StatusCode.UNPROCESSABLE_ENTITY, 'New password must be at least 8 characters.')
  }
  if (!/[A-Z]/.test(newPassword)) {
    throw new ApiError(StatusCode.UNPROCESSABLE_ENTITY, 'New password must contain at least one uppercase letter.')
  }
  if (!/[0-9]/.test(newPassword)) {
    throw new ApiError(StatusCode.UNPROCESSABLE_ENTITY, 'New password must contain at least one number.')
  }

  const user = await User.findById(userId).select('+password')
  if (!user) throw new ApiError(StatusCode.NOT_FOUND, 'User not found.')

  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) {
    throw new ApiError(StatusCode.UNAUTHORIZED, 'Current password is incorrect.')
  }

  if (currentPassword === newPassword) {
    throw new ApiError(StatusCode.UNPROCESSABLE_ENTITY, 'New password must be different from the current password.')
  }

  user.password = newPassword
  await user.save()
  return { success: true }
}

export const uploadAvatar = async (userId, file) => {
  if (!file) throw new ApiError(StatusCode.BAD_REQUEST, 'No image file provided.')

  const user = await User.findById(userId)
  if (!user) throw new ApiError(StatusCode.NOT_FOUND, 'User not found.')

  if (user.profileImage?.publicId) {
    try {
      await cloudinary.uploader.destroy(user.profileImage.publicId)
    } catch {}
  }

  user.profileImage = {
    url:      file.path,
    publicId: file.filename,
  }

  await user.save({ validateBeforeSave: false })
  return user
}

export const deleteAvatar = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(StatusCode.NOT_FOUND, 'User not found.')

  if (user.profileImage?.publicId) {
    try {
      await cloudinary.uploader.destroy(user.profileImage.publicId)
    } catch {}
  }

  user.profileImage = undefined
  await user.save({ validateBeforeSave: false })
  return user
}
