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

const updatePlacement = async (
  placementId,
  updateData,
  userId,
  acceptanceLetterFile = null,
) => {
  try {
    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        student: {
          include: {
            user: true,
            supervisorAssignments: {
              where: { status: "active" },
              include: {
                supervisor: {
                  select: {
                    userId: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!placement) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Placement not found");
    }

    const allowedStatuses = [
      PLACEMENT_STATUS.PENDING,
      PLACEMENT_STATUS.APPROVED,
    ];
    if (!allowedStatuses.includes(placement.status)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Cannot update placement that has been rejected or withdrawn",
      );
    }

    if (placement.student.userId !== userId) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        "You can only update your own placement",
      );
    }

    let updatePayload = { ...updateData };
    if (placement.status === PLACEMENT_STATUS.APPROVED) {
      updatePayload = {
        ...updateData,
        status: PLACEMENT_STATUS.PENDING,
        reviewedById: null,
        reviewedAt: null,
        approvedAt: null,
        industrialSupervisorId: null,
      };

      await prisma.student.update({
        where: { id: placement.studentId },
        data: {
          placementApproved: false,
          hasPlacement: false,
          currentPlacementId: null,
        },
      });

      const dept = await prisma.department.findUnique({
        where: { id: placement.student.departmentId },
        include: { coordinators: { select: { id: true } } },
      });

      if (dept && dept.coordinators.length > 0) {
        await notificationService.createBulkNotifications(
          dept.coordinators.map((c) => c.id),
          {
            type: NOTIFICATION_TYPES.PLACEMENT_UPDATED,
            title: "Placement Resubmitted",
            message: `Student ${placement.student.user.firstName} ${placement.student.user.lastName} has updated and resubmitted their placement application`,
            priority: "medium",
            relatedModel: "Placement",
            relatedId: placement.id,
          },
        );
      }

      logger.info(`Placement resubmitted by student: ${placementId}`);
    }

    let industryPartnerId = undefined;
    if (
      updatePayload.companyName ||
      updatePayload.companyEmail ||
      updatePayload.companyAddress
    ) {
      const partnerWhere = {
        name: updatePayload.companyName || placement.companyName,
      };
      if (updatePayload.companyEmail || placement.companyEmail) {
        partnerWhere.email = (updatePayload.companyEmail || placement.companyEmail || "").toLowerCase();
      } else if (updatePayload.companyAddress || placement.companyAddress) {
        partnerWhere.address = updatePayload.companyAddress || placement.companyAddress;
      }

      const existingPartner = await prisma.industryPartner.findFirst({
        where: partnerWhere,
      });

      if (existingPartner) {
        industryPartnerId = existingPartner.id;
      } else {
        const createdPartner = await prisma.industryPartner.create({
          data: {
            name: updatePayload.companyName || placement.companyName,
            address: updatePayload.companyAddress || placement.companyAddress || null,
            email: updatePayload.companyEmail || placement.companyEmail || null,
            phone: updatePayload.companyPhone || placement.companyPhone || null,
            website: updatePayload.companyWebsite || placement.companyWebsite || null,
            sector: updatePayload.companySector || placement.companySector || null,
          },
        });
        industryPartnerId = createdPartner.id;
      }
    }

    const editableFields = [
      "companyName",
      "companyAddress",
      "companyEmail",
      "companyPhone",
      "companyWebsite",
      "companySector",
      "position",
      "department",
      "supervisorName",
      "supervisorEmail",
      "supervisorPhone",
      "supervisorPosition",
      "startDate",
      "endDate",
      "workStartTime",
      "workEndTime",
      "expectedLearningOutcomes",
      "specialRequirements",
    ];

    const editableUpdateData = {};
    editableFields.forEach((field) => {
      if (updatePayload[field] !== undefined) {
        editableUpdateData[field] = updatePayload[field];
      }
    });

    const shouldRemoveAcceptanceLetter =
      updatePayload.removeAcceptanceLetter === true ||
      updatePayload.removeAcceptanceLetter === "true";
    if (shouldRemoveAcceptanceLetter) {
      editableUpdateData.acceptanceLetter = null;
      editableUpdateData.acceptanceLetterPath = null;
    }

    const uploadedLetter = await uploadAcceptanceLetter(acceptanceLetterFile);
    if (uploadedLetter) {
      editableUpdateData.acceptanceLetter = uploadedLetter.acceptanceLetter;
      editableUpdateData.acceptanceLetterPath = uploadedLetter.acceptanceLetterPath;
    }

    if (industryPartnerId !== undefined) {
      editableUpdateData.industryPartner = {
        connect: { id: industryPartnerId },
      };
    }

    const updatedPlacement = await prisma.placement.update({
      where: { id: placementId },
      data: editableUpdateData,
    });

    logger.info(`Placement updated: ${placementId}`);

    const supervisorRecipientIds = [
      ...new Set(
        (placement.student.supervisorAssignments || [])
          .map((assignment) => assignment.supervisor?.userId)
          .filter(Boolean),
      ),
    ];

    if (supervisorRecipientIds.length > 0) {
      await notificationService.createBulkNotifications(supervisorRecipientIds, {
        type: NOTIFICATION_TYPES.PLACEMENT_UPDATED,
        title: "Placement Details Updated",
        message: `${placement.student.user.firstName} ${placement.student.user.lastName} updated placement information.`,
        priority: "medium",
        relatedModel: "Placement",
        relatedId: placementId,
        actionLink: `/coordinator/students/${placement.studentId}/placement`,
        actionText: "View Placement",
      });
    }

    return updatedPlacement;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const prismaError = handlePrismaError(error);
    throw prismaError;
  }
};

module.exports = { updatePlacement };
