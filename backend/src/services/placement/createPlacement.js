const { getPrismaClient } = require("../../config/prisma");
const { handlePrismaError } = require("../../utils/prismaErrors");
const { ApiError } = require("../../middleware/errorHandler");
const {
  HTTP_STATUS,
  PLACEMENT_STATUS,
  NOTIFICATION_TYPES,
} = require("../../utils/constants");
const logger = require("../../utils/logger");
const notificationService = require("../notificationService");
const { uploadAcceptanceLetter } = require("./acceptanceLetter");

const prisma = getPrismaClient();

const createPlacement = async (studentId, placementData, acceptanceLetterFile = null) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!student) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Student not found");
    }

    const existingPlacement = await prisma.placement.findFirst({
      where: {
        studentId: studentId,
        status: { in: [PLACEMENT_STATUS.PENDING, PLACEMENT_STATUS.APPROVED] },
      },
    });

    if (existingPlacement) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        "You already have a pending or approved placement application",
      );
    }

    let industryPartnerId = null;
    if (placementData.companyName) {
      const partnerWhere = { name: placementData.companyName };
      if (placementData.companyEmail) {
        partnerWhere.email = placementData.companyEmail.toLowerCase();
      } else if (placementData.companyAddress) {
        partnerWhere.address = placementData.companyAddress;
      }

      const existingPartner = await prisma.industryPartner.findFirst({
        where: partnerWhere,
      });

      if (existingPartner) {
        industryPartnerId = existingPartner.id;
      } else {
        const createdPartner = await prisma.industryPartner.create({
          data: {
            name: placementData.companyName,
            address: placementData.companyAddress || null,
            email: placementData.companyEmail || null,
            phone: placementData.companyPhone || null,
            website: placementData.companyWebsite || null,
            sector: placementData.companySector || null,
          },
        });
        industryPartnerId = createdPartner.id;
      }
    }

    const uploadedLetter = await uploadAcceptanceLetter(acceptanceLetterFile);

    const placement = await prisma.placement.create({
      data: {
        student: { connect: { id: studentId } },
        companyName: placementData.companyName,
        companyAddress: placementData.companyAddress,
        companyEmail: placementData.companyEmail,
        companyPhone: placementData.companyPhone,
        companyWebsite: placementData.companyWebsite || null,
        companySector: placementData.companySector,
        industryPartner: industryPartnerId
          ? { connect: { id: industryPartnerId } }
          : undefined,
        position: placementData.position,
        department: placementData.department || null,
        supervisorName: placementData.supervisorName,
        supervisorEmail: placementData.supervisorEmail,
        supervisorPhone: placementData.supervisorPhone,
        supervisorPosition: placementData.supervisorPosition,
        startDate: new Date(placementData.startDate),
        endDate: new Date(placementData.endDate),
        workStartTime: placementData.workStartTime || "08:00",
        workEndTime: placementData.workEndTime || "17:00",
        acceptanceLetter:
          uploadedLetter?.acceptanceLetter || null,
        acceptanceLetterPath:
          uploadedLetter?.acceptanceLetterPath || null,
        status: PLACEMENT_STATUS.PENDING,
      },
    });

    logger.info(`Placement created for student: ${student.matricNumber}`);

    const dept = await prisma.department.findUnique({
      where: { id: student.departmentId },
      include: {
        coordinators: {
          select: { id: true },
        },
      },
    });

    if (dept && dept.coordinators.length > 0) {
      const studentName = student.user
        ? `${student.user.firstName} ${student.user.lastName}`
        : student.matricNumber;
      await notificationService.createBulkNotifications(
        dept.coordinators.map((c) => c.id),
        {
          type: NOTIFICATION_TYPES.PLACEMENT_SUBMITTED,
          title: "New Placement Application",
          message: `Student ${studentName} has submitted a placement application`,
          priority: "medium",
          relatedModel: "Placement",
          relatedId: placement.id,
          actionLink: `/coordinator/placements`,
          actionText: "Review Placement",
        },
      );
    }

    return placement;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const prismaError = handlePrismaError(error);
    throw prismaError;
  }
};

module.exports = { createPlacement };
