const { getPrismaClient } = require("../config/prisma");
const { ApiError } = require("../middleware/errorHandler");
const { HTTP_STATUS } = require("../utils/constants");
const { handlePrismaError } = require("../utils/prismaErrors");
const logger = require("../utils/logger");
const { notifyUser } = require("../realtime/events");

const prisma = getPrismaClient();

const calculateEntryCompletion = (submittedCount, expectedWeeks) => {
  if (!expectedWeeks || expectedWeeks === 0) return 0;
  const ratio = submittedCount / expectedWeeks;
  return Math.min(Math.round(ratio * 20), 20);
};

const calculateIndustryReview = (reviewedCount, submittedCount) => {
  if (!submittedCount || submittedCount === 0) return 0;
  const ratio = reviewedCount / submittedCount;
  return Math.min(Math.round(ratio * 10), 10);
};

const calculateSubmissionConsistency = async (studentId, placementStart, placementEnd) => {
  const logbooks = await prisma.logbook.findMany({
    where: { studentId },
    orderBy: { weekNumber: "asc" },
    select: { weekNumber: true, submittedAt: true, createdAt: true },
  });

  if (logbooks.length < 2) return 3;

  const submissionDates = logbooks
    .filter((l) => l.submittedAt)
    .map((l) => new Date(l.submittedAt).getTime());

  if (submissionDates.length < 2) return 3;

  submissionDates.sort();

  const intervals = [];
  for (let i = 1; i < submissionDates.length; i++) {
    const diffDays = (submissionDates[i] - submissionDates[i - 1]) / (1000 * 60 * 60 * 24);
    intervals.push(diffDays);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  const expectedInterval =
    placementStart && placementEnd
      ? (new Date(placementEnd).getTime() - new Date(placementStart).getTime()) /
        (1000 * 60 * 60 * 24 * (logbooks.length))
      : 7;

  const variance = intervals.reduce((a, b) => a + Math.abs(b - avgInterval), 0) / intervals.length;

  if (variance <= 2) return 5;
  if (variance <= 4) return 4;
  if (variance <= 7) return 3;
  if (variance <= 10) return 2;
  return 1;
};

const calculateVisitationEval = (visit) => {
  if (!visit) return 0;
  const u = visit.understandingScore || 0;
  const r = visit.relevanceScore || 0;
  const i = visit.industryFeedback || 0;
  const p = visit.professionalism || 0;
  return Math.min(u + r + i + p, 15);
};

const calculateAttendanceScore = async (studentId, absenceNotices) => {
  const attendances = await prisma.attendance.findMany({
    where: { studentId },
    select: { status: true, date: true },
    orderBy: { date: "asc" },
  });

  if (attendances.length === 0) return 0;

  const totalDays = attendances.length;
  const presentDays = attendances.filter((a) => a.status === "present").length;
  const absenceDays = attendances.filter((a) => a.status === "absent").length;

  const absenceNoticeCount = absenceNotices || 0;

  let effectivePresent = presentDays + absenceNoticeCount;

  const ratio = effectivePresent / totalDays;

  if (ratio >= 0.95) return 5;
  if (ratio >= 0.85) return 4;
  if (ratio >= 0.75) return 3;
  if (ratio >= 0.60) return 2;
  return 1;
};

const calculateIndustryAssessment = (assessment) => {
  if (!assessment) {
    return { technical: 0, initiative: 0, conduct: 0, communication: 0 };
  }
  return {
    technical: Math.min(Math.round((assessment.technical || 0) / 10), 10),
    initiative: Math.min(Math.round((assessment.initiative || 0) / 20), 5),
    conduct: Math.min(Math.round((assessment.professionalism || 0) / 20), 5),
    communication: Math.min(Math.round((assessment.communication || 0) / 20), 5),
  };
};

const getLetterGrade = (totalScore) => {
  if (totalScore >= 80) return "A";
  if (totalScore >= 65) return "B";
  if (totalScore >= 50) return "C";
  if (totalScore >= 40) return "D";
  return "F";
};

const recalculateGrade = async (studentId) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      placement: { include: { visits: { orderBy: { completedAt: "desc" }, take: 1 } } },
      assessments: {
        where: { type: "industrial" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!student) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Student not found");

  const placement = student.placement;
  if (!placement) throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Student has no placement");

  const expectedWeeks = placement.durationInWeeks || 12;

  const logbookCount = await prisma.logbook.count({
    where: { studentId, status: { in: ["submitted", "approved", "final_approved"] } },
  });

  const reviewedCount = await prisma.logbookReview.count({
    where: {
      logbook: { studentId },
      decision: { in: ["approved", "final_approved"] },
    },
  });

  const entryCompletion = calculateEntryCompletion(logbookCount, expectedWeeks);
  const industryReview = calculateIndustryReview(reviewedCount, logbookCount);
  const submissionConsistency = await calculateSubmissionConsistency(
    studentId,
    placement.startDate,
    placement.endDate,
  );

  const latestVisit = placement.visits[0];
  const visitationEval = calculateVisitationEval(latestVisit);

  const absenceNotices = await prisma.attendance.count({
    where: { studentId, status: "absent", action: "absence_request" },
  });
  const attendanceScore = await calculateAttendanceScore(studentId, absenceNotices);

  const industryAssessment = calculateIndustryAssessment(student.assessments[0]);

  const logbookSubtotal = entryCompletion + industryReview + submissionConsistency + visitationEval;
  const industrySubtotal =
    attendanceScore +
    industryAssessment.technical +
    industryAssessment.initiative +
    industryAssessment.conduct +
    industryAssessment.communication;

  const existingGrade = await prisma.finalGrade.findUnique({
    where: { studentId },
  });

  const totalScore = existingGrade?.defenseScore
    ? logbookSubtotal + industrySubtotal + (existingGrade.defenseScore || 0)
    : logbookSubtotal + industrySubtotal;
  const grade = getLetterGrade(totalScore);

  const finalGrade = await prisma.finalGrade.upsert({
    where: { studentId },
    create: {
      studentId,
      placementId: placement.id,
      entryCompletion,
      industryReview,
      submissionConsistency,
      visitationEval,
      attendanceScore,
      technical: industryAssessment.technical,
      initiative: industryAssessment.initiative,
      conduct: industryAssessment.conduct,
      communication: industryAssessment.communication,
      defenseScore: existingGrade?.defenseScore || 0,
      totalScore,
      grade,
    },
    update: {
      entryCompletion,
      industryReview,
      submissionConsistency,
      visitationEval,
      attendanceScore,
      technical: industryAssessment.technical,
      initiative: industryAssessment.initiative,
      conduct: industryAssessment.conduct,
      communication: industryAssessment.communication,
      totalScore,
      grade,
    },
  });

  if (student.userId) {
    notifyUser(student.userId, "grade:updated", {
      studentId,
      totalScore,
      grade,
    });
  }

  return finalGrade;
};

const getStudentGrade = async (studentId) => {
  const grade = await prisma.finalGrade.findUnique({
    where: { studentId },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          department: { select: { name: true, code: true } },
        },
      },
      placement: { select: { companyName: true, startDate: true, endDate: true } },
    },
  });
  return grade;
};

const getAllGrades = async (filters = {}) => {
  const where = {};
  if (filters.department) where.student = { departmentId: filters.department };
  if (filters.grade) where.grade = filters.grade;
  if (filters.isFinalized !== undefined) where.isFinalized = filters.isFinalized;

  const grades = await prisma.finalGrade.findMany({
    where,
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          department: { select: { name: true, code: true } },
        },
      },
      placement: { select: { companyName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return grades;
};

const inputDefenseScore = async (studentId, defenseScore, userId) => {
  if (defenseScore < 0 || defenseScore > 20) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Defense score must be between 0 and 20");
  }

  const existingGrade = await prisma.finalGrade.findUnique({
    where: { studentId },
  });

  if (!existingGrade) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Grade record not found. Recalculate grade first.");
  }

  const logbookSubtotal =
    existingGrade.entryCompletion +
    existingGrade.industryReview +
    existingGrade.submissionConsistency +
    existingGrade.visitationEval;
  const industrySubtotal =
    existingGrade.attendanceScore +
    existingGrade.technical +
    existingGrade.initiative +
    existingGrade.conduct +
    existingGrade.communication;
  const totalScore = logbookSubtotal + industrySubtotal + defenseScore;
  const gradeValue = getLetterGrade(totalScore);

  const updated = await prisma.finalGrade.update({
    where: { studentId },
    data: { defenseScore, totalScore, grade: gradeValue },
  });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true },
  });
  if (student?.userId) {
    notifyUser(student.userId, "grade:defense_updated", {
      studentId,
      defenseScore,
      totalScore,
      grade: gradeValue,
    });
  }

  return updated;
};

const finalizeGrade = async (studentId, userId) => {
  const existingGrade = await prisma.finalGrade.findUnique({
    where: { studentId },
  });

  if (!existingGrade) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Grade record not found");
  }

  const updated = await prisma.finalGrade.update({
    where: { studentId },
    data: { isFinalized: true, finalizedById: userId, finalizedAt: new Date() },
  });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true },
  });
  if (student?.userId) {
    notifyUser(student.userId, "grade:finalized", {
      studentId,
      grade: existingGrade.grade,
      totalScore: existingGrade.totalScore,
    });
  }

  return updated;
};

const exportGrades = async (filters = {}) => {
  const grades = await getAllGrades(filters);
  return grades.map((g) => ({
    "Matric Number": g.student?.user?.email || "",
    "First Name": g.student?.user?.firstName || "",
    "Last Name": g.student?.user?.lastName || "",
    Department: g.student?.department?.name || "",
    "Entry Completion (20)": g.entryCompletion,
    "Industry Review (10)": g.industryReview,
    "Submission Consistency (5)": g.submissionConsistency,
    "Visitation Eval (15)": g.visitationEval,
    "Attendance (5)": g.attendanceScore,
    "Technical (10)": g.technical,
    "Initiative (5)": g.initiative,
    "Conduct (5)": g.conduct,
    "Communication (5)": g.communication,
    "Defense (20)": g.defenseScore,
    "Total (100)": g.totalScore,
    Grade: g.grade,
    Finalized: g.isFinalized ? "Yes" : "No",
  }));
};

module.exports = {
  recalculateGrade,
  getStudentGrade,
  getAllGrades,
  inputDefenseScore,
  finalizeGrade,
  exportGrades,
};
