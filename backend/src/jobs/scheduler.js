const cron = require("node-cron");
const { getPrismaClient } = require("../config/prisma");
const logger = require("../utils/logger");

const prisma = getPrismaClient();

let scheduledTasks = [];

const autoExpireInvitations = async () => {
  try {
    const result = await prisma.invitation.updateMany({
      where: {
        status: "pending",
        expiresAt: { lt: new Date() },
      },
      data: { status: "expired" },
    });
    if (result.count > 0) {
      logger.info(`Scheduler: Expired ${result.count} stale invitations`);
    }
  } catch (error) {
    logger.error(`Scheduler: Failed to expire invitations: ${error.message}`);
  }
};

const autoMarkAbsent = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activePlacements = await prisma.placement.findMany({
      where: {
        status: "approved",
        startDate: { lte: today },
        endDate: { gte: today },
      },
      select: { id: true, studentId: true },
    });

    let markedCount = 0;
    for (const placement of activePlacements) {
      const existing = await prisma.attendance.findFirst({
        where: {
          studentId: placement.studentId,
          date: { gte: today, lt: tomorrow },
        },
      });

      if (!existing) {
        await prisma.attendance.create({
          data: {
            studentId: placement.studentId,
            placementId: placement.id,
            date: today,
            dayStatus: "ABSENT",
            approvalStatus: "PENDING",
            checkIn: null,
            checkOut: null,
            hoursWorked: 0,
          },
        });
        markedCount++;
      }
    }

    if (markedCount > 0) {
      logger.info(`Scheduler: Marked ${markedCount} students absent`);
    }
  } catch (error) {
    logger.error(`Scheduler: Failed to mark absent: ${error.message}`);
  }
};

const sendLogbookReminders = async () => {
  try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const studentsWithoutRecentLogbook = await prisma.student.findMany({
      where: {
        hasPlacement: true,
        placements: {
          some: {
            status: "approved",
            startDate: { lte: now },
            endDate: { gte: now },
          },
        },
        logbooks: {
          none: {
            createdAt: { gte: weekAgo },
            status: { not: "draft" },
          },
        },
      },
      select: {
        id: true,
        user: { select: { id: true, firstName: true, email: true } },
      },
    });

    for (const student of studentsWithoutRecentLogbook) {
      await prisma.notification.create({
        data: {
          recipientId: student.user.id,
          type: "deadline_reminder",
          title: "Logbook Reminder",
          message:
            "It's been a week since your last logbook entry. Please submit your weekly logbook.",
          priority: "medium",
          actionLink: "/student/logbook",
          createdById: student.user.id,
        },
      });
    }

    if (studentsWithoutRecentLogbook.length > 0) {
      logger.info(
        `Scheduler: Sent logbook reminders to ${studentsWithoutRecentLogbook.length} students`,
      );
    }
  } catch (error) {
    logger.error(
      `Scheduler: Failed to send logbook reminders: ${error.message}`,
    );
  }
};

const startScheduler = () => {
  scheduledTasks.push(
    cron.schedule("0 * * * *", () => {
      autoExpireInvitations();
    }),
  );

  scheduledTasks.push(
    cron.schedule("0 18 * * 1-5", () => {
      autoMarkAbsent();
    }),
  );

  scheduledTasks.push(
    cron.schedule("0 8 * * 1-5", () => {
      sendLogbookReminders();
    }),
  );

  logger.info("Scheduler started with 3 cron jobs");
};

const stopScheduler = async () => {
  for (const task of scheduledTasks) {
    task.stop();
  }
  scheduledTasks = [];
  logger.info("Scheduler stopped");
};

module.exports = { startScheduler, stopScheduler };
