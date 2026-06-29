import { Router }         from 'express'
import { protect }        from '../middleware/auth.middleware.js'
import avatarUpload       from '../middleware/avatarUpload.middleware.js'
import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
} from '../controllers/profile.controller.js'

const router = Router()

// All profile routes require a valid access token
router.use(protect)

// GET  /api/profile           — fetch current user's full profile
router.get('/', getProfile)

// PUT  /api/profile           — update name / phone / city / businessName
router.put('/', updateProfile)

// PUT  /api/profile/password  — change password (verifies current first)
router.put('/password', changePassword)

// POST /api/profile/avatar    — upload or replace profile picture
router.post('/avatar', avatarUpload.single('avatar'), uploadAvatar)

// DELETE /api/profile/avatar  — remove profile picture
router.delete('/avatar', deleteAvatar)

export default router
