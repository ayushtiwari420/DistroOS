import multer from 'multer'
import { ApiError, StatusCode } from '../utils/apiError.utils.js'

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = new Set([
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
    'text/csv',
  ])

  const originalName = String(file?.originalname || '').toLowerCase()
  const hasAllowedExtension =
    originalName.endsWith('.xls') ||
    originalName.endsWith('.xlsx') ||
    originalName.endsWith('.csv')

  if (!allowedMimeTypes.has(file?.mimetype) && !hasAllowedExtension) {
    return cb(new ApiError(StatusCode.BAD_REQUEST, 'Only .xls, .xlsx, or .csv files are allowed.'))
  }

  cb(null, true)
}

const excelUpload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter,
})

export default excelUpload
