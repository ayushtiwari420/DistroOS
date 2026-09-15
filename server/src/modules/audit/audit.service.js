import AuditLog from './audit.model.js'

export const logAuditEvent = async ({ user, wholesaler, action, resource, resourceId, details, ipAddress }) => {
  try {
    await AuditLog.create({
      user,
      wholesaler: wholesaler || user,
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : '',
      details: details || {},
      ipAddress: ipAddress || '',
    })
  } catch (err) {
    console.error(`[AUDIT ERROR] Failed to record audit log: ${err.message}`)
  }
}

export const getAuditLogs = async (wholesalerId, query) => {
  const { page = 1, limit = 20, resource, action } = query
  const currentPage = Math.max(parseInt(page, 10) || 1, 1)
  const pageLimit   = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100)
  const skip        = (currentPage - 1) * pageLimit

  const filter = { wholesaler: wholesalerId }
  if (resource) filter.resource = resource
  if (action)   filter.action   = action

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    AuditLog.countDocuments(filter)
  ])

  const totalPages = Math.ceil(total / pageLimit)

  return {
    logs,
    pagination: {
      page: currentPage,
      limit: pageLimit,
      total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    }
  }
}
