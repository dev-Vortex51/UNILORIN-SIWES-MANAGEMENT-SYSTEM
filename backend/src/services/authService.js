const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { getPrismaClient } = require("../config/prisma");
const { ApiError } = require("../middleware/errorHandler");
const {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  NOTIFICATION_TYPES,
} = require("../utils/constants");
const { generateToken, generateRefreshToken } = require("../middleware/auth");
const logger = require("../utils/logger");
const { handlePrismaError } = require("../utils/prismaErrors");
const { hashPassword, comparePassword } = require("../utils/helpers");
const emailService = require("../utils/emailService");
const notificationService = require("./notificationService");
const { enqueueEmailJob } = require("../jobs/emailQueue");

const login = async (email, password) => {
  try {
    const prisma = getPrismaClient();

    // Find user with email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        departmentId: true,
        tokenVersion: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.INVALID_CREDENTIALS,
      );
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, "Account has been deactivated");
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.INVALID_CREDENTIALS,
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens with current tokenVersion
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });
    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Get additional profile data based on role
    let profileData = null;
    if (user.role === "student") {
      profileData = await prisma.student.findUnique({
        where: { userId: user.id },
        include: {
          department: true,
        },
      });
    } else if (
      ["academic_supervisor", "industrial_supervisor"].includes(user.role)
    ) {
      profileData = await prisma.supervisor.findUnique({
        where: { userId: user.id },
        include: {
          department: true,
          assignedStudents: true,
        },
      });
    }

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role,
        departmentId: user.departmentId,
        department: user.department,
        profileData,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw handlePrismaError(error);
  }
};

const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    const prisma = getPrismaClient();

    // Find user by ID (with password field)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    // Verify old password
    const isPasswordValid = await comparePassword(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Current password is incorrect",
      );
    }

    // Check if new password is same as old
    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "New password must be different from current password",
      );
    }

    // Hash and update password, invalidate other sessions
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordResetRequired: false,
        tokenVersion: { increment: 1 },
      },
    });

    logger.info(`User changed password: ${user.email}`);

    try {
      await notificationService.createNotification({
        recipientId: user.id,
        type: NOTIFICATION_TYPES.PASSWORD_CHANGED,
        title: "Password Updated",
        message: "Your account password was changed successfully.",
        priority: "high",
      });
    } catch (notifError) {
      logger.warn(`Failed to create password-changed notification: ${notifError.message}`);
    }

    return {
      message: SUCCESS_MESSAGES.PASSWORD_RESET,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw handlePrismaError(error);
  }
};

const logout = async (userId) => {
  logger.info(`User logged out: ${userId}`);

  return {
    message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
  };
};

const logoutAllDevices = async (userId) => {
  try {
    const prisma = getPrismaClient();

    // Increment tokenVersion to invalidate all existing tokens
    const user = await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tokenVersion: true,
      },
    });

    // Generate a new token with the incremented version for the current session
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info(`User logged out all devices: ${user.email}`);

    return {
      message: "Logged out of all other devices successfully",
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw handlePrismaError(error);
  }
};

const getProfile = async (userId) => {
  try {
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        address: true,
        bio: true,
        isActive: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    // Get additional profile data based on role
    let profileData = null;
    if (user.role === "student") {
      profileData = await prisma.student.findUnique({
        where: { userId: user.id },
        include: {
          department: true,
        },
      });

      // AUTO-CREATE if missing (safety net for accounts created without profile)
      if (!profileData) {
        const logger = require("../utils/logger");
        logger.warn(
          `Student profile missing for user ${user.id}. Auto-creating with defaults.`,
        );

        // Get the user's department from the User model if available
        const userWithDept = await prisma.user.findUnique({
          where: { id: user.id },
          include: { department: true },
        });

        if (userWithDept?.departmentId) {
          profileData = await prisma.student.create({
            data: {
              userId: user.id,
              matricNumber: `TEMP-${user.id.substring(0, 8).toUpperCase()}`,
              level: 100,
              session: "2026/2027",
              departmentId: userWithDept.departmentId,
              cgpa: 0,
              hasPlacement: false,
              placementApproved: false,
            },
            include: {
              department: true,
            },
          });
        }
      }
    } else if (
      ["academic_supervisor", "industrial_supervisor"].includes(user.role)
    ) {
      profileData = await prisma.supervisor.findUnique({
        where: { userId: user.id },
        include: {
          department: true,
          assignedStudents: true,
        },
      });

      // AUTO-CREATE if missing (safety net for accounts created without profile)
      if (!profileData) {
        const logger = require("../utils/logger");
        logger.warn(
          `Supervisor profile missing for user ${user.id} (${user.role}). Auto-creating with defaults.`,
        );

        // Get the user's department from the User model if available
        const userWithDept = await prisma.user.findUnique({
          where: { id: user.id },
          include: { department: true },
        });

        profileData = await prisma.supervisor.create({
          data: {
            userId: user.id,
            type:
              user.role === "academic_supervisor" ? "academic" : "industrial",
            maxStudents: 10,
            departmentId:
              user.role === "academic_supervisor"
                ? userWithDept?.departmentId
                : null,
          },
          include: {
            department: true,
            assignedStudents: true,
          },
        });
      }
    }

    return {
      ...user,
      department: user.department,
      departmentId: user.departmentId,
      profileData,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw handlePrismaError(error);
  }
};

const updateProfile = async (userId, updateData) => {
  try {
    const prisma = getPrismaClient();

    const allowedFields = ["firstName", "lastName", "phone", "address", "bio"];
    const filteredData = {};

    // Filter allowed fields
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: filteredData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        address: true,
        bio: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`User updated profile: ${user.email}`);

    return user;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw handlePrismaError(error);
  }
};

const forgotPassword = async (email) => {
  try {
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) return; // Don't reveal if user exists

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
      },
    });

    // Send password reset email (non-blocking)
    await enqueueEmailJob("password-reset", {
      email: user.email,
      token,
    }).catch(async () => {
      await emailService.sendPasswordReset({
        email: user.email,
        token,
      });
    });

    try {
      await notificationService.createNotification({
        recipientId: user.id,
        type: NOTIFICATION_TYPES.PASSWORD_RESET_REQUESTED,
        title: "Password Reset Requested",
        message: "A password reset request was initiated for your account.",
        priority: "high",
      });
    } catch (notifError) {
      logger.warn(
        `Failed to create password-reset-requested notification: ${notifError.message}`,
      );
    }
  } catch (error) {
    logger.error(`forgotPassword error: ${error.message}`);
    // Don't throw - security measure to not reveal if email exists
  }
};

const resetPassword = async (token, newPassword) => {
  try {
    const prisma = getPrismaClient();

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(), // Greater than current time
        },
      },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid or expired reset token",
      );
    }

    // Hash and update password, invalidate other sessions
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordResetRequired: false,
        tokenVersion: { increment: 1 },
      },
    });

    logger.info(`User reset password via token: ${user.email}`);

    try {
      await notificationService.createNotification({
        recipientId: user.id,
        type: NOTIFICATION_TYPES.PASSWORD_CHANGED,
        title: "Password Updated",
        message: "Your password has been reset successfully.",
        priority: "high",
      });
    } catch (notifError) {
      logger.warn(`Failed to create password-changed notification: ${notifError.message}`);
    }

    return { email: user.email };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw handlePrismaError(error);
  }
};

const resetPasswordFirstLogin = async (userId, newPassword) => {
  try {
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    // Hash and update password, clear first login flag, invalidate other sessions
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordResetRequired: false,
        tokenVersion: { increment: 1 },
      },
    });

    logger.info(`User reset password on first login: ${user.email}`);

    try {
      await notificationService.createNotification({
        recipientId: user.id,
        type: NOTIFICATION_TYPES.PASSWORD_CHANGED,
        title: "Password Updated",
        message: "Your password has been updated.",
        priority: "medium",
      });
    } catch (notifError) {
      logger.warn(`Failed to create password-changed notification: ${notifError.message}`);
    }

    return { email: user.email };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw handlePrismaError(error);
  }
};

module.exports = {
  login,
  changePassword,
  logout,
  logoutAllDevices,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  resetPasswordFirstLogin,
};
