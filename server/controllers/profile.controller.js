import User       from '../models/User.model.js'
import cloudinary  from '../config/cloudinary.js'

// ─────────────────────────────────────────────────────────────
// GET /api/profile
// Returns full profile of the currently authenticated user.
// Passwords, refresh tokens, and other sensitive fields are
// stripped by User.toJSON() automatically.
// ─────────────────────────────────────────────────────────────
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })
    return res.status(200).json({ success: true, user })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/profile
// Update editable profile fields: name, phone, city, businessName.
// Email, role, and status are intentionally immutable here.
// ─────────────────────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    const { name, phone, city, businessName } = req.body

    // Validate editable fields
    if (name !== undefined) {
      const trimmed = String(name).trim()
      if (trimmed.length < 2 || trimmed.length > 60) {
        return res.status(422).json({ success: false, message: 'Name must be between 2 and 60 characters.' })
      }
      user.name = trimmed
    }

    if (phone !== undefined) {
      const trimmed = String(phone).trim()
      if (trimmed && !/^[+]?[0-9\s\-]{7,15}$/.test(trimmed)) {
        return res.status(422).json({ success: false, message: 'Enter a valid phone number.' })
      }
      user.phone = trimmed
    }

    if (city !== undefined) {
      const trimmed = String(city).trim()
      if (trimmed.length > 60) {
        return res.status(422).json({ success: false, message: 'City must be under 60 characters.' })
      }
      user.city = trimmed
    }

    if (businessName !== undefined) {
      const trimmed = String(businessName).trim()
      if (trimmed.length > 100) {
        return res.status(422).json({ success: false, message: 'Business name must be under 100 characters.' })
      }
      user.businessName = trimmed
    }

    await user.save({ validateBeforeSave: false })

    return res.status(200).json({ success: true, message: 'Profile updated successfully.', user })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/profile/password
// Verifies current password then updates to new password.
// The pre-save hook in User model handles hashing automatically.
// ─────────────────────────────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required.' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(422).json({ success: false, message: 'New password and confirmation do not match.' })
    }

    // Enforce password strength
    if (newPassword.length < 8) {
      return res.status(422).json({ success: false, message: 'New password must be at least 8 characters.' })
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(422).json({ success: false, message: 'New password must contain at least one uppercase letter.' })
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(422).json({ success: false, message: 'New password must contain at least one number.' })
    }

    const user = await User.findById(req.user.id).select('+password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' })
    }

    if (currentPassword === newPassword) {
      return res.status(422).json({ success: false, message: 'New password must be different from the current password.' })
    }

    user.password = newPassword
    await user.save()

    return res.status(200).json({ success: true, message: 'Password changed successfully.' })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/profile/avatar
// Uploads a new profile image via Cloudinary.
// multer-storage-cloudinary sets req.file.path  = secure_url
//                                  req.file.filename = public_id
// ─────────────────────────────────────────────────────────────
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' })
    }

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    // Delete old avatar from Cloudinary to avoid orphaned assets
    if (user.profileImage?.publicId) {
      try {
        await cloudinary.uploader.destroy(user.profileImage.publicId)
      } catch {
        // Non-fatal — old image may have already been removed
      }
    }

    user.profileImage = {
      url:      req.file.path,
      publicId: req.file.filename,
    }

    await user.save({ validateBeforeSave: false })

    return res.status(200).json({ success: true, message: 'Profile picture updated.', user })
  } catch (err) {
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/profile/avatar
// Removes the user's profile picture and deletes it from Cloudinary.
// ─────────────────────────────────────────────────────────────
export const deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    if (user.profileImage?.publicId) {
      try {
        await cloudinary.uploader.destroy(user.profileImage.publicId)
      } catch {
        // Non-fatal
      }
    }

    user.profileImage = undefined

    await user.save({ validateBeforeSave: false })

    return res.status(200).json({ success: true, message: 'Profile picture removed.', user })
  } catch (err) {
    next(err)
  }
}
