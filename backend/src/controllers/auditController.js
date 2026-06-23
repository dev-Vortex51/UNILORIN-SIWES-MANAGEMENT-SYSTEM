const { auditService } = require("../services");
const { HTTP_STATUS } = require("../utils/constants");
const { catchAsync } = require("../utils/helpers");

const getAuditLogs = catchAsync(async (req, res) => {
  const { page, limit, action, entity, entityId, userId, startDate, endDate } = req.query;

  const result = await auditService.getAuditLogs(
    { action, entity, entityId, userId, startDate, endDate },
    { page: parseInt(page) || 1, limit: parseInt(limit) || 50 },
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Audit logs retrieved successfully",
    ...result,
  });
});

const getAuditLogById = catchAsync(async (req, res) => {
  const log = await auditService.getAuditLogById(req.params.id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Audit log retrieved successfully",
    data: log,
  });
});

module.exports = { getAuditLogs, getAuditLogById };
