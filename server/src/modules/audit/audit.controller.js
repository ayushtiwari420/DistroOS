import * as auditService from './audit.service.js'

export const getAuditLogs = async (req, res, next) => {
  try {
    const result = await auditService.getAuditLogs(req.user.id, req.query)
    return res.status(200).json({ success: true, ...result })
  } catch (err) { next(err) }
}
