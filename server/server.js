import express      from 'express'
import cors         from 'cors'
import dotenv       from 'dotenv'
import cookieParser from 'cookie-parser'

import connectDB    from './config/db.js'
import { errorHandler } from './middleware/error.middleware.js'

import authRoutes     from './routes/auth.routes.js'
import orderRoutes    from './routes/order.routes.js'
import productRoutes  from './routes/product.routes.js'
import retailerRoutes from './routes/retailer.routes.js'
import salesmanRoutes from './routes/salesman.routes.js'
import creditRoutes   from './routes/credit.routes.js'
import adminRoutes    from './routes/admin.routes.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 5000

// ── Connect DB ──
connectDB()

// ── CORS ──
app.use(cors({
  origin:         process.env.CLIENT_URL || 'http://localhost:5173',
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Middleware ──
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ── Routes ──
app.use('/api/auth',      authRoutes)
app.use('/api/orders',    orderRoutes)
app.use('/api/products',  productRoutes)
app.use('/api/retailers', retailerRoutes)
app.use('/api/salesmen',  salesmanRoutes)
app.use('/api/credit',    creditRoutes)
app.use('/api/admin',     adminRoutes)

// ── Health ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DistroOS API running', routes: ['/auth', '/orders', '/products', '/retailers', '/salesmen', '/credit', '/admin'] })
})

// ── Error handler ──
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`)
  console.log(`📦 Environment: ${process.env.NODE_ENV}\n`)
})