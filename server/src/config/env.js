import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '..', '..', '.env')

dotenv.config({ path: envPath, quiet: true })

// ── Startup Fail-Fast Environment Validation ──
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET']
const missingEnv = requiredEnv.filter((key) => !process.env[key])

if (missingEnv.length > 0) {
  console.error(`\n❌ [FATAL] Missing required environment variables: ${missingEnv.join(', ')}`)
  console.error('Please configure these in your .env file or environment before starting DistroOS Server.\n')
  process.exit(1)
}

