const jwt = require("jsonwebtoken");
const { getPrismaClient } = require("../config/prisma");
const config = require("../config");
const { HTTP_STATUS, ERROR_MESSAGES } = require("../utils/constants");
const { formatResponse } = require("../utils/helpers");
const logger = require("../utils/logger");
const { getAuditContext } = require("../utils/asyncStorage");

const prisma = getPrismaClient();

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(formatResponse(false, ERROR_MESSAGES.UNAUTHORIZED));
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      logger.warn(`Invalid token attempt: ${error.message}`);
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(formatResponse(false, ERROR_MESSAGES.INVALID_TOKEN));
    }

    // Find user by ID from token (using Prisma)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        role: true,
        isActive: true,
        passwordResetRequired: true,
        departmentId: true,
        department: true,
        tokenVersion: true,
      },
    });

    if (!user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(formatResponse(false, "User not found or has been deleted"));
    }

    // Check if user is active
    if (!user.isActive) {
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json(formatResponse(false, "Account has been deactivated"));
    }

    // Check token version (invalidates tokens from older sessions)
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(formatResponse(false, "Session expired. Please login again."));
    }

    // Get student/supervisor profile if applicable
    const { USER_ROLES } = require("../utils/constants");

    if (user.role === USER_ROLES.STUDENT) {
      const studentProfile = await prisma.student.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (studentProfile) {
        user.studentProfile = studentProfile.id;
      }
    } else if (
      [
        USER_ROLES.ACADEMIC_SUPERVISOR,
        USER_ROLES.INDUSTRIAL_SUPERVISOR,
      ].includes(user.role)
    ) {
      const supervisorProfile = await prisma.supervisor.findUnique({
        where: { userId: user.id },
        select: { id: true, type: true },
      });
      if (supervisorProfile) {
        user.supervisorProfile = supervisorProfile.id;
        user.supervisorType = supervisorProfile.type;
      }
    }

    // Attach user to request object
    req.user = user;

    // Update audit context with authenticated user
    const auditCtx = getAuditContext();
    if (auditCtx) {
      auditCtx.userId = user.id;
      auditCtx.userEmail = user.email;
      auditCtx.userRole = user.role;
    }

    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(formatResponse(false, ERROR_MESSAGES.SERVER_ERROR));
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Continue without user
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Invalid token, but continue anyway
      logger.debug(`Optional auth failed: ${error.message}`);
    }

    next();
  } catch (error) {
    logger.error(`Optional auth error: ${error.message}`);
    next();
  }
};

const requirePasswordReset = (req, res, next) => {
  if (!req.user) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json(formatResponse(false, ERROR_MESSAGES.UNAUTHORIZED));
  }

  if (!req.user.passwordResetRequired) {
    return res
      .status(HTTP_STATUS.FORBIDDEN)
      .json(
        formatResponse(false, "Password has already been reset. Please login."),
      );
  }

  next();
};

const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion ?? 0,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expire,
  });
};

const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: "refresh",
  };

  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpire,
  });
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(formatResponse(false, "Refresh token is required"));
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (error) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(formatResponse(false, "Invalid or expired refresh token"));
    }

    if (decoded.type !== "refresh") {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(formatResponse(false, "Invalid token type"));
    }

    // Find user (using Prisma)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        tokenVersion: true,
      },
    });

    if (!user || !user.isActive) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json(formatResponse(false, "User not found or inactive"));
    }

    // Generate new access token with current tokenVersion
    const accessToken = generateToken(user);

    res.status(HTTP_STATUS.OK).json(
      formatResponse(true, "Token refreshed successfully", {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: `${user.firstName} ${user.lastName}`,
        },
      }),
    );
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(formatResponse(false, ERROR_MESSAGES.SERVER_ERROR));
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  requirePasswordReset,
  generateToken,
  generateRefreshToken,
  refreshAccessToken,
};
