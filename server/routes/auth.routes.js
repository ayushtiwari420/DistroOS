import { Router } from 'express'
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/auth.controller.js'
import { protect }                         from '../middleware/auth.middleware.js'
import { validateRegister, validateLogin } from '../middleware/validate.middleware.js'
import upload                              from '../middleware/upload.middleware.js'

const router = Router()

// ── Public ──────────────────────────────────────────────────
router.post('/register',        validateRegister, register)
router.post('/login',           validateLogin,    login)
router.post('/refresh',         refresh)
router.post('/logout',          logout)

// ── Forgot password (public — no token needed) ──────────────
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp',      verifyOtp)
router.post('/reset-password',  resetPassword)

// ── Protected ────────────────────────────────────────────────
router.get ('/me',              protect, getMe)
router.put ('/me',              protect, upload.single('profileImage'), updateProfile)
router.put ('/change-password', protect, changePassword)

// ── Addresses (protected) ────────────────────────────────────
router.get   ('/addresses',                    protect, getAddresses)
router.post  ('/addresses',                    protect, addAddress)
router.put   ('/addresses/:addressId',         protect, updateAddress)
router.delete('/addresses/:addressId',         protect, deleteAddress)
router.patch ('/addresses/:addressId/default', protect, setDefaultAddress)

export default router