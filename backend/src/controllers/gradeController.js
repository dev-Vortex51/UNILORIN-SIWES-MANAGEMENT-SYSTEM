const gradeService = require("../services/gradeService");
const { USER_ROLES, HTTP_STATUS } = require("../utils/constants");
const { catchAsync } = require("../utils/helpers");

const recalculateGrade = catchAsync(async (req, res) => {
  const grade = await gradeService.recalculateGrade(req.params.studentId);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Grade recalculated successfully",
    data: grade,
  });
});

const getStudentGrade = catchAsync(async (req, res) => {
  const grade = await gradeService.getStudentGrade(req.params.studentId);
  if (!grade) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Grade not found. Recalculate first.",
    });
  }
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Grade retrieved successfully",
    data: grade,
  });
});

const getMyGrade = catchAsync(async (req, res) => {
  const studentId = req.user.studentProfile;
  if (!studentId) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Student profile not found",
    });
  }
  const grade = await gradeService.getStudentGrade(studentId);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Grade retrieved successfully",
    data: grade,
  });
});

const getAllGrades = catchAsync(async (req, res) => {
  const filters = {};
  if (req.query.department) filters.department = req.query.department;
  if (req.query.grade) filters.grade = req.query.grade;
  if (req.query.isFinalized !== undefined) filters.isFinalized = req.query.isFinalized === "true";

  const coordinatorDepartmentId = req.user.departmentId || req.user.department;
  if (req.user.role === USER_ROLES.COORDINATOR && coordinatorDepartmentId) {
    filters.department = coordinatorDepartmentId;
  }

  const grades = await gradeService.getAllGrades(filters);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Grades retrieved successfully",
    data: grades,
  });
});

const inputDefenseScore = catchAsync(async (req, res) => {
  const { defenseScore } = req.body;
  const grade = await gradeService.inputDefenseScore(
    req.params.studentId,
    defenseScore,
    req.user.id,
  );
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Defense score recorded successfully",
    data: grade,
  });
});

const finalizeGrade = catchAsync(async (req, res) => {
  const grade = await gradeService.finalizeGrade(req.params.studentId, req.user.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Grade finalized successfully",
    data: grade,
  });
});

const exportGrades = catchAsync(async (req, res) => {
  const filters = {};
  if (req.query.department) filters.department = req.query.department;
  if (req.query.grade) filters.grade = req.query.grade;

  const coordinatorDepartmentId = req.user.departmentId || req.user.department;
  if (req.user.role === USER_ROLES.COORDINATOR && coordinatorDepartmentId) {
    filters.department = coordinatorDepartmentId;
  }

  const rows = await gradeService.exportGrades(filters);

  const headers = Object.keys(rows[0] || {}).join(",");
  const csvRows = rows.map((r) =>
    Object.values(r)
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [headers, ...csvRows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=grades.csv");
  res.send(csv);
});

module.exports = {
  recalculateGrade,
  getStudentGrade,
  getMyGrade,
  getAllGrades,
  inputDefenseScore,
  finalizeGrade,
  exportGrades,
};
