import * as profileService from './profile.service.js'

export const getProfile = async (req, res, next) => {
  try {
    const user = await profileService.getProfile(req.user.id)
    return res.status(200).json({ success: true, user })
  } catch (err) { next(err) }
}

export const updateProfile = async (req, res, next) => {
  try {
    const user = await profileService.updateProfile(req.user.id, req.body)
    return res.status(200).json({ success: true, message: 'Profile updated successfully.', user })
  } catch (err) { next(err) }
}

export const changePassword = async (req, res, next) => {
  try {
    await profileService.changePassword(req.user.id, req.body)
    return res.status(200).json({ success: true, message: 'Password changed successfully.' })
  } catch (err) { next(err) }
}

export const uploadAvatar = async (req, res, next) => {
  try {
    const user = await profileService.uploadAvatar(req.user.id, req.file)
    return res.status(200).json({ success: true, message: 'Profile picture updated.', user })
  } catch (err) { next(err) }
}

export const deleteAvatar = async (req, res, next) => {
  try {
    const user = await profileService.deleteAvatar(req.user.id)
    return res.status(200).json({ success: true, message: 'Profile picture removed.', user })
  } catch (err) { next(err) }
}
