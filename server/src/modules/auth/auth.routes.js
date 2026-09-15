import express from 'express'
import {
  register, login, refresh, logout, getMe, updateProfile,
  changePassword, forgotPassword, verifyOtp, resetPassword,
  getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress,
} from './auth.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import { validateRegister, validateLogin } from '../../middleware/validate.middleware.js'

const router = express.Router()

router.post('/register', validateRegister, register)
router.post('/login',    validateLogin,    login)
router.post('/refresh',  refresh)
router.post('/logout',   logout)

router.post('/forgot-password', forgotPassword)
router.post('/verify-otp',      verifyOtp)
router.post('/reset-password',   resetPassword)

router.get('/me',              protect, getMe)
router.put('/me',              protect, updateProfile)
router.put('/change-password', protect, changePassword)

router.get('/addresses',                   protect, getAddresses)
router.post('/addresses',                  protect, addAddress)
router.put('/addresses/:addressId',        protect, updateAddress)
router.delete('/addresses/:addressId',     protect, deleteAddress)
router.patch('/addresses/:addressId/default', protect, setDefaultAddress)

export default router
