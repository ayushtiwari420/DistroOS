import { Router } from 'express'
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  changePassword
} from '../controllers/auth.controller.js'
import { protect }                             from '../middleware/auth.middleware.js'
import { validateRegister, validateLogin }     from '../middleware/validate.middleware.js'
import upload from '../middleware/upload.middleware.js'

const router = Router()

// ── Public ──────────────────────────────────
// POST /api/auth/register
router.post('/register', validateRegister, register)

// POST /api/auth/login
router.post('/login', validateLogin, login)

// POST /api/auth/refresh  (uses httpOnly cookie)
router.post('/refresh', refresh)

// POST /api/auth/logout
router.post('/logout', logout)

// ── Protected ───────────────────────────────
// GET /api/auth/me
router.get('/me', protect, getMe)

router.put('/me', protect, upload.single('profileImage'), updateProfile)
router.put('/change-password', protect, changePassword)

export default router
