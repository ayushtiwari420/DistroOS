import multer from 'multer'

const storage = multer.memoryStorage()

const excelUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls']
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'))
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('Only .xlsx or .xls files are allowed.'))
  }
})

export default excelUpload