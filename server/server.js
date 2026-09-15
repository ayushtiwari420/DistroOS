import './src/config/env.js'
import express      from 'express'
import cors         from 'cors'
import cookieParser from 'cookie-parser'

import connectDB    from './src/config/db.js'
import { errorHandler } from './src/middleware/error.middleware.js'
import { apiLimiter, authLimiter } from './src/middleware/rateLimit.middleware.js'

import authRoutes      from './src/modules/auth/auth.routes.js'
import orderRoutes     from './src/modules/orders/order.routes.js'
import productRoutes   from './src/modules/products/product.routes.js'
import retailerRoutes  from './src/modules/retailers/retailer.routes.js'
import salesmanRoutes  from './src/modules/salesmen/salesman.routes.js'
import creditRoutes    from './src/modules/credit/credit.routes.js'
import adminRoutes     from './src/modules/admin/admin.routes.js'
import profileRoutes   from './src/modules/profile/profile.routes.js'
import analyticsRoutes from './src/modules/analytics/analytics.routes.js'
import auditRoutes     from './src/modules/audit/audit.routes.js'

const app  = express()
const PORT = process.env.PORT || 5000

// ── Connect DB ──
connectDB()

// ── CORS ──
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true)
    }
    return callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}))

// ── Middleware ──
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ── Rate Limiting ──
app.use('/api', apiLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/forgot-password', authLimiter)

// ── Routes ──
app.use('/api/auth',      authRoutes)
app.use('/api/orders',    orderRoutes)
app.use('/api/products',  productRoutes)
app.use('/api/retailers', retailerRoutes)
app.use('/api/salesmen',  salesmanRoutes)
app.use('/api/credit',    creditRoutes)
app.use('/api/admin',     adminRoutes)
app.use('/api/profile',   profileRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/audit',     auditRoutes)

// ── Health ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DistroOS API running (Modular Monolith)',
    routes: ['/auth', '/orders', '/products', '/retailers', '/salesmen', '/credit', '/admin', '/profile', '/analytics', '/audit']
  })
})

// ── Error handler ──
app.use(errorHandler)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`)
  console.log(`📦 Environment: ${process.env.NODE_ENV}\n`)
})
