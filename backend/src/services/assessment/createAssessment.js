const { getPrismaClient } = require("../../config/prisma");
const { handlePrismaError } = require("../../utils/prismaErrors");
const { ApiError } = require("../../middleware/errorHandler");
const {
  HTTP_STATUS,
  ASSESSMENT_STATUS,
  NOTIFICATION_TYPES,
} = require("../../utils/constants");
const logger = require("../../utils/logger");
const notificationService = require("../notificationService");

const prisma = getPrismaClient();

const createAssessment = async (assessmentData, supervisorId) => {
  try {
    const { student: studentId, type, visitId, scores = {} } = assessmentData;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Student not found");
    }

    const supervisor = await prisma.supervisor.findUnique({
      where: { id: supervisorId },
      include: {
        assignedStudents: {
          select: { studentId: true },
        },
      },
    });

    if (!supervisor) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Supervisor not found");
    }

    const isAssigned = supervisor.assignedStudents.some(
      (s) => s.studentId === studentId,
    );

    if (!isAssigned) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        "You are not assigned to this student",
      );
    }

    // If visitId is provided, verify the visit exists and belongs to this student
    if (visitId) {
      const visit = await prisma.visit.findUnique({
        where: { id: visitId },
      });

      if (!visit) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, "Visit not found");
      }

      if (visit.studentId !== studentId) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          "Visit does not belong to this student",
        );
      }
    }

    const existingAssessment = await prisma.assessment.findFirst({
      where: { studentId, supervisorId, type },
    });

    if (existingAssessment) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        `${type} assessment already exists for this student`,
      );
    }

    const assessment = await prisma.assessment.create({
      data: {
        studentId,
        supervisorId,
        type,
        visitId,
        technical: scores?.technical ?? assessmentData.technical ?? 0,
        communication: scores?.communication ?? assessmentData.communication ?? 0,
        punctuality: scores?.punctuality ?? assessmentData.punctuality ?? 0,
        initiative: scores?.initiative ?? assessmentData.initiative ?? 0,
        teamwork: scores?.teamwork ?? assessmentData.teamwork ?? 0,
        professionalism: scores?.professionalism ?? assessmentData.professionalism,
        problemSolving: scores?.problemSolving ?? assessmentData.problemSolving,
        adaptability: scores?.adaptability ?? assessmentData.adaptability,
        strengths: assessmentData.strengths,
        areasForImprovement: assessmentData.areasForImprovement,
        comment: assessmentData.comment,
        recommendation: assessmentData.recommendation,
        status: ASSESSMENT_STATUS.PENDING,
      },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
      },
    });

    try {
      await notificationService.createNotification({
        recipientId: student.userId,
        type: NOTIFICATION_TYPES.ASSESSMENT_ASSIGNED,
        title: "New Assessment Assigned",
        message: `A ${type} assessment has been assigned to you.`,
        priority: "medium",
        relatedModel: "Assessment",
        relatedId: assessment.id,
      });
    } catch (notifError) {
      logger.warn(`Failed to create assessment-assigned notification: ${notifError.message}`);
    }

    logger.info(`Assessment created for student: ${student.id}`);
    return assessment;
  } catch (error) {
    logger.error(`Error creating assessment: ${error.message}`);
    throw handlePrismaError(error);
  }
};

module.exports = { createAssessment };
