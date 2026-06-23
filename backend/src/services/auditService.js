const { getPrismaClient } = require("../config/prisma");
const { ApiError } = require("../middleware/errorHandler");
const { HTTP_STATUS } = require("../utils/constants");

const prisma = getPrismaClient();

const getAuditLogs = async (filters = {}, pagination = {}) => {
  const { page = 1, limit = 50 } = pagination;
  const skip = (page - 1) * limit;

  const where = {};
  if (filters.action) where.action = filters.action;
  if (filters.entity) where.entity = filters.entity;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

const getAuditLogById = async (id) => {
  const log = await prisma.auditLog.findUnique({ where: { id } });
  if (!log) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Audit log not found");
  return log;
};

module.exports = { getAuditLogs, getAuditLogById };
