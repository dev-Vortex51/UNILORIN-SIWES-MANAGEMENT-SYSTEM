

const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");
const { handlePrismaError } = require("../utils/prismaErrors");
const { getAuditContext } = require("../utils/asyncStorage");

const AUDIT_ACTIONS = {
  create: "CREATE",
  createMany: "CREATE",
  update: "UPDATE",
  updateMany: "UPDATE",
  delete: "DELETE",
  deleteMany: "DELETE",
};

const SKIP_MODELS = ["AuditLog"];

let prismaInstance = null;


const createAuditMiddleware = () => {
  return async (params, next) => {
    const result = await next(params);

    const action = AUDIT_ACTIONS[params.action];
    if (!action || SKIP_MODELS.includes(params.model)) {
      return result;
    }

    const context = getAuditContext();

    setImmediate(async () => {
      try {
        const prisma = getPrismaClient();
        await prisma.auditLog.create({
          data: {
            action,
            entity: params.model,
            entityId: result?.id || params.args?.where?.id || null,
            userId: context.userId || null,
            userEmail: context.userEmail || null,
            userRole: context.userRole || null,
            metadata: {
              args: params.args,
            },
            ipAddress: context.ipAddress || null,
            userAgent: context.userAgent || null,
          },
        });
      } catch (err) {
        logger.error(`Audit log failed: ${err.message}`);
      }
    });

    return result;
  };
};


const getPrismaClient = () => {
  if (prismaInstance) {
    return prismaInstance;
  }

  prismaInstance = new PrismaClient({
    errorFormat: "pretty",
    log:
      process.env.NODE_ENV === "development"
        ? [
          { level: "error", emit: "stdout" },
          { level: "warn", emit: "stdout" },
        ]
        : [{ level: "error", emit: "stdout" }],
  });

  // Handle disconnections
  prismaInstance.$on("error", (e) => {
    logger.error(`Prisma Client error: ${e.message}`);
  });

  // Attach audit middleware
  prismaInstance.$use(createAuditMiddleware());

  return prismaInstance;
};


const connectPrisma = async (retries = 5) => {
  try {
    const prisma = getPrismaClient();

    // Test connection
    await prisma.$queryRaw`SELECT 1`;

    logger.info("✓ Connected to PostgreSQL via Prisma");
    return prisma;
  } catch (error) {
    const prismaError = handlePrismaError(error);
    logger.error(`PostgreSQL connection failed: ${prismaError.message}`);

    if (retries > 0) {
      logger.info(`Retrying connection... (${retries} attempts remaining)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectPrisma(retries - 1);
    } else {
      logger.error("Max retries reached. Could not connect to PostgreSQL.");
      if (prismaInstance) {
        await prismaInstance.$disconnect();
      }
      throw error;
    }
  }
};


const disconnectPrisma = async () => {
  if (prismaInstance) {
    try {
      await prismaInstance.$disconnect();
      logger.info("✓ Disconnected from PostgreSQL");
      prismaInstance = null;
    } catch (error) {
      logger.error(`Error disconnecting from PostgreSQL: ${error.message}`);
      throw error;
    }
  }
};


const withTransaction = async (callback) => {
  const prisma = getPrismaClient();
  try {
    return await prisma.$transaction(callback(prisma));
  } catch (error) {
    const prismaError = handlePrismaError(error);
    logger.error(`Transaction failed: ${prismaError.message}`);
    throw prismaError;
  }
};


const setupGracefulShutdown = () => {
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Closing PostgreSQL connection...`);
    try {
      await disconnectPrisma();
      process.exit(0);
    } catch (error) {
      logger.error(`Error during graceful shutdown: ${error.message}`);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

module.exports = {
  getPrismaClient,
  connectPrisma,
  disconnectPrisma,
  withTransaction,
  setupGracefulShutdown,
};
