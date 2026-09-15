import * as adminService from './admin.service.js'

export const getWholesalers = async (req, res, next) => {
  try {
    const result = await adminService.getWholesalers(req.query)
    return res.status(200).json({ success: true, ...result })
  } catch (err) { next(err) }
}

export const updateWholesalerStatus = async (req, res, next) => {
  try {
    const wholesaler = await adminService.updateWholesalerStatus(req.params.id, req.body.status)
    return res.status(200).json({ success: true, message: `Wholesaler ${req.body.status}.`, wholesaler })
  } catch (err) { next(err) }
}

export const getPlatformStats = async (req, res, next) => {
  try {
    const stats = await adminService.getPlatformStats()
    return res.status(200).json({ success: true, stats })
  } catch (err) { next(err) }
}
