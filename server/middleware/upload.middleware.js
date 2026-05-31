import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.js'


console.log('Cloudinary config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY ? 'exists' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'exists' : 'MISSING',
})

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'distroos/products',
    allowed_formats: ['jpg', 'png'],
  }
})

const upload = multer({ storage })
export default upload