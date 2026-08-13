import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from '../config/cloudinary.js'
import { ApiError, StatusCode } from '../utils/apiError.utils.js'

// ── Dedicated avatar storage — stored under distroos/avatars ──
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder:          'distroos/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation:  [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
  },
})

const avatarUpload = multer({
  storage: avatarStorage,
  limits:  { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new ApiError(StatusCode.BAD_REQUEST, 'Only JPG, JPEG, and PNG files are allowed.'), false)
    }
  },
})

export default avatarUpload
