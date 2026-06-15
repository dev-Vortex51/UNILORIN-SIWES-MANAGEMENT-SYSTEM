const { getPrismaClient } = require("../../config/prisma");
const { handlePrismaError } = require("../../utils/prismaErrors");
const { ApiError } = require("../../middleware/errorHandler");
const { HTTP_STATUS, NOTIFICATION_TYPES } = require("../../utils/constants");
const logger = require("../../utils/logger");
const notificationService = require("../notificationService");

const prisma = getPrismaClient();

const unassignStudentFromSupervisor = async (supervisorId, studentId) => {
  try {
    const supervisor = await prisma.supervisor.findUnique({
      where: { id: supervisorId },
      include: { user: true },
    });

    if (!supervisor) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Supervisor not found");
    }

    await prisma.supervisorAssignment.deleteMany({
      where: { supervisorId, studentId },
    });

    if (supervisor.type === "academic" || supervisor.type === "departmental") {
      await prisma.student.update({
        where: { id: studentId },
        data: { departmentalSupervisorId: null },
      });
    } else {
      await prisma.student.update({
        where: { id: studentId },
        data: { industrialSupervisorId: null },
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (student?.userId) {
      await notificationService.createNotification({
        recipientId: student.userId,
        type: NOTIFICATION_TYPES.SUPERVISOR_UNASSIGNED,
        title: "Supervisor Unassigned",
        message: "A supervisor assignment was removed from your profile.",
        priority: "medium",
        relatedModel: "SupervisorAssignment",
      });
    }

    if (supervisor?.userId) {
      await notificationService.createNotification({
        recipientId: supervisor.userId,
        type: NOTIFICATION_TYPES.SUPERVISOR_UNASSIGNED,
        title: "Student Unassigned",
        message: `${student?.user?.firstName || "A student"} ${student?.user?.lastName || ""} was unassigned from you.`,
        priority: "medium",
        relatedModel: "SupervisorAssignment",
      });
    }

    logger.info(
      `Student ${studentId} unassigned from supervisor ${supervisorId}`,
    );

    return supervisor;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const prismaError = handlePrismaError(error);
    throw prismaError;
  }
};

module.exports = { unassignStudentFromSupervisor };
