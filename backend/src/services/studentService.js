const { getPrismaClient } = require("../config/prisma");
const { handlePrismaError } = require("../utils/prismaErrors");
const { ApiError } = require("../middleware/errorHandler");
const { HTTP_STATUS, USER_ROLES } = require("../utils/constants");
const { parsePagination, buildPaginationMeta } = require("../utils/helpers");
const logger = require("../utils/logger");

const prisma = getPrismaClient();

const mapPlacementCompany = (placement) => {
  if (!placement) return placement;
  const partner = placement.industryPartner;
  if (!partner) return placement;
  return {
    ...placement,
    companyName: partner.name || placement.companyName,
    companyAddress: partner.address || placement.companyAddress,
    companyEmail: partner.email || placement.companyEmail,
    companyPhone: partner.phone || placement.companyPhone,
    companyWebsite: partner.website || placement.companyWebsite,
    companySector: partner.sector || placement.companySector,
  };
};

/**
 * Get all students (no pagination)
 */
const getAllStudents = async (filters = {}) => {
  logger.info("studentService.getAllStudents called");

  try {
    const where = { isActive: true };

    if (filters.department) {
      where.departmentId = filters.department;
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        department: {
          select: { name: true, code: true },
        },
        placements: {
          select: {
            companyName: true,
            companyAddress: true,
            status: true,
            industryPartner: {
              select: {
                name: true,
                address: true,
                email: true,
                phone: true,
                website: true,
                sector: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const formattedStudents = students.map((student) => ({
      id: student.id,
      matricNumber: student.matricNumber,
      level: student.level,
      session: student.session,
      placementApproved: student.placementApproved,
      department: student.department,
      placement:
        student.placements && student.placements.length > 0
          ? mapPlacementCompany(student.placements[0])
          : null,
      name: student.user
        ? `${student.user.firstName} ${student.user.lastName}`
        : "N/A",
      email: student.user?.email,
    }));

    logger.info(
      `studentService.getAllStudents fetched ${formattedStudents.length} students`,
    );

    return formattedStudents;
  } catch (error) {
    const prismaError = handlePrismaError(error);
    throw prismaError;
  }
};

/**
 * Get students with filters and pagination
 */
const getStudents = async (filters = {}, pagination = {}, user = null) => {
  try {
    const { page, limit, skip } = parsePagination(pagination);
    const where = { isActive: true };

    // Coordinator access control
    if (user && user.role === USER_ROLES.COORDINATOR && user.departmentId) {
      where.departmentId = user.departmentId;
    } else if (filters.department) {
      where.departmentId = filters.department;
    }

    if (filters.level) where.level = Number(filters.level);
    if (filters.session) where.session = filters.session;
    if (filters.placementApproved !== undefined)
      where.placementApproved = filters.placementApproved;

    if (filters.search) {
      where.user = {
        OR: [
          { firstName: { contains: filters.search, mode: "insensitive" } },
          { lastName: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ],
      };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        department: {
          select: { name: true, code: true, facultyId: true },
        },
        placements: {
          select: {
            companyName: true,
            companyAddress: true,
            status: true,
            industryPartner: {
              select: {
                name: true,
                address: true,
                email: true,
                phone: true,
                website: true,
                sector: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.student.count({ where });

    // Format students with computed name field
    const formattedStudents = students.map((student) => ({
      id: student.id,
      matricNumber: student.matricNumber,
      level: student.level,
      session: student.session,
      placementApproved: student.placementApproved,
      department: student.department,
      placement:
        student.placements && student.placements.length > 0
          ? mapPlacementCompany(student.placements[0])
          : null,
      name: student.user
        ? `${student.user.firstName} ${student.user.lastName}`
        : "N/A",
      email: student.user?.email,
      phone: student.user?.phone,
    }));

    return {
      students: formattedStudents,
      pagination: buildPaginationMeta(total, page, limit),
    };
  } catch (error) {
    const prismaError = handlePrismaError(error);
    throw prismaError;
  }
};

/**
 * Get student by ID
 */
const getStudentById = async (studentId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        department: {
          select: { name: true, code: true, facultyId: true },
        },
        placements: {
          select: {
            id: true,
            companyName: true,
            companyAddress: true,
            companySector: true,
            status: true,
            startDate: true,
            endDate: true,
            industryPartner: {
              select: {
                name: true,
                address: true,
                email: true,
                phone: true,
                website: true,
                sector: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        supervisorAssignments: {
          include: {
            supervisor: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
                department: {
                  select: { name: true, code: true },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Student not found");
    }

    // Extract current placement from placements array and add as currentPlacement
    if (student.placements && student.placements.length > 0) {
      student.currentPlacement = mapPlacementCompany(student.placements[0]);
    }

    // Map supervisor assignments to academicSupervisor and industrialSupervisor
    if (
      student.supervisorAssignments &&
      student.supervisorAssignments.length > 0
    ) {
      const academicAssignment = student.supervisorAssignments.find(
        (sa) =>
          sa.supervisor?.type === "academic" ||
          sa.supervisor?.type === "departmental",
      );
      const industrialAssignment = student.supervisorAssignments.find(
        (sa) => sa.supervisor?.type === "industrial",
      );

      if (academicAssignment?.supervisor) {
        student.academicSupervisor = academicAssignment.supervisor;
        // Backward-compatible alias used by existing frontend pages.
        student.departmentalSupervisor = academicAssignment.supervisor;
      }
      if (industrialAssignment?.supervisor) {
        student.industrialSupervisor = industrialAssignment.supervisor;
      }
    }

    return student;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const prismaError = handlePrismaError(error);
    throw prismaError;
  }
};

/**
 * Update student profile
 */
const updateStudent = async (studentId, updateData) => {
  try {
    const allowedFields = ["level", "cgpa", "address", "phone"];
    const filteredData = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const student = await prisma.student.update({
      where: { id: studentId },
      data: filteredData,
    });

    if (!student) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Student not found");
    }

    // Also update user profile if provided
    if (updateData.firstName || updateData.lastName || updateData.bio) {
      await prisma.user.update({
        where: { id: student.userId },
        data: {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          address: updateData.address,
        },
      });
    }

    logger.info(`Student updated: ${student.matricNumber}`);

    return student;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const prismaError = handlePrismaError(error);
    throw prismaError;
  }
};

/**
 * Get student dashboard data
 */
const getStudentDashboard = async (studentId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        placements: {
          select: {
            id: true,
            companyName: true,
            companyAddress: true,
            status: true,
            startDate: true,
            endDate: true,
            industryPartner: {
              select: {
                name: true,
                address: true,
                email: true,
                phone: true,
                website: true,
                sector: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        supervisorAssignments: {
          include: {
            supervisor: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Student not found");
    }

    const [
      logbookCount,
      approvedLogbooks,
      assessmentCount,
      recentLogbooks,
      placements,
    ] = await Promise.all([
      prisma.logbook.count({
        where: { studentId },
      }),
      prisma.logbook.count({
        where: { studentId, status: "approved" },
      }),
      prisma.assessment.count({
        where: { studentId },
      }),
      prisma.logbook.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.placement.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Map supervisors from assignments
    if (student.supervisorAssignments?.length > 0) {
      const academicAssignment = student.supervisorAssignments.find(
        (sa) =>
          sa.supervisor?.type === "academic" ||
          sa.supervisor?.type === "departmental",
      );
      const industrialAssignment = student.supervisorAssignments.find(
        (sa) => sa.supervisor?.type === "industrial",
      );

      student.academicSupervisor = academicAssignment?.supervisor || null;
      student.departmentalSupervisor = academicAssignment?.supervisor || null;
      student.industrialSupervisor = industrialAssignment?.supervisor || null;
    }

    // Calculate training progress
    let trainingProgress = 0;
    if (student.trainingStartDate && student.trainingEndDate) {
      const now = new Date();
      const start = new Date(student.trainingStartDate);
      const end = new Date(student.trainingEndDate);
      const totalDuration = end - start;
      const elapsedDuration = now - start;
      trainingProgress = Math.min(
        100,
        Math.max(0, (elapsedDuration / totalDuration) * 100),
      );
    }

    return {
      student,
      statistics: {
        totalLogbooks: logbookCount,
        approvedLogbooks,
        totalAssessments: assessmentCount,
        trainingProgress,
      },
      recentLogbooks,
      placements: placements.map(mapPlacementCompany),
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const prismaError = handlePrismaError(error);
    throw prismaError;
  }
};

/**
 * Assign supervisor to student
 */
const assignSupervisor = async (studentId, supervisorId, type) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Student not found");
    }

    // Update student with supervisor
    const updateData = {};
    if (type === "academic") {
      updateData.departmentalSupervisorId = supervisorId;
    } else if (type === "industrial") {
      updateData.industrialSupervisorId = supervisorId;
    }

    await prisma.student.update({
      where: { id: studentId },
      data: updateData,
    });

    // Create supervisor assignment record
    await prisma.supervisorAssignment.upsert({
      where: {
        supervisorId_studentId: {
          supervisorId,
          studentId,
        },
      },
      update: {},
      create: {
        supervisorId,
        studentId,
      },
    });

    logger.info(
      `${type} supervisor assigned to student ${student.matricNumber}`,
    );

    return student;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const prismaError = handlePrismaError(error);
    throw prismaError;
  }
};

/**
 * Get students by department
 */
const getStudentsByDepartment = async (departmentId, filters = {}) => {
  try {
    const where = { departmentId, isActive: true };

    if (filters.level) where.level = Number(filters.level);
    if (filters.session) where.session = filters.session;

    const students = await prisma.student.findMany({
      where,
      orderBy: { matricNumber: "asc" },
    });

    return students;
  } catch (error) {
    const prismaError = handlePrismaError(error);
    throw prismaError;
  }
};

module.exports = {
  getAllStudents,
  getStudents,
  getStudentById,
  updateStudent,
  getStudentDashboard,
  assignSupervisor,
  getStudentsByDepartment,
};
