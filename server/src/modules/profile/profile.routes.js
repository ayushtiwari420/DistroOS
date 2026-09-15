import express from 'express'
import { getProfile, updateProfile, changePassword, uploadAvatar, deleteAvatar } from './profile.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import avatarUpload from '../../middleware/avatarUpload.middleware.js'

const router = express.Router()

router.use(protect)

router.get('/',               getProfile)
router.put('/',               updateProfile)
router.put('/password',       changePassword)
router.post('/avatar',        avatarUpload.single('avatar'), uploadAvatar)
router.delete('/avatar',      deleteAvatar)

export default router
