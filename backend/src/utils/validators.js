/**
 * Validation Schemas using Joi
 * Centralized validation rules for request data
 * Ensures data integrity and security
 */

const Joi = require("joi");
const {
  USER_ROLES,
  PLACEMENT_STATUS,
  LOGBOOK_STATUS,
  REGEX_PATTERNS,
} = require("./constants");

/**
 * Custom Joi validators
 */
const customValidators = {
  objectId: Joi.string()
    .regex(
      /^(?:[0-9a-fA-F]{24}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i,
    )
    .message("Invalid ID format"),
  matricNumber: Joi.string()
    .regex(REGEX_PATTERNS.MATRIC_NUMBER)
    .message("Invalid matric number format"),
  phone: Joi.string()
    .regex(REGEX_PATTERNS.PHONE)
    .message("Invalid phone number format"),
  password: Joi.string()
    .min(8)
    .regex(REGEX_PATTERNS.PASSWORD)
    .message(
      "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
    ),
};

/**
 * Authentication Validation Schemas
 */
const authValidation = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  resetPassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: customValidators.password.required(),
    confirmPassword: Joi.string()
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({ "any.only": "Passwords must match" }),
  }),

  resetPasswordFirstLogin: Joi.object({
    userId: Joi.string().required(),
    newPassword: customValidators.password.required(),
  }),

  changePassword: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: customValidators.password.required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),
};

/**
 * User Validation Schemas
 */
const userValidation = {
  createUser: Joi.object({
    email: Joi.string().email().required(),
    password: customValidators.password.optional(), // Optional for admin-created users
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    role: Joi.string()
      .valid(...Object.values(USER_ROLES))
      .required(),
    phone: customValidators.phone.optional(),
    department: customValidators.objectId.when("role", {
      is: Joi.valid(USER_ROLES.STUDENT, USER_ROLES.COORDINATOR),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    faculty: customValidators.objectId.optional(),
    isFirstLogin: Joi.boolean().optional(),
    passwordResetRequired: Joi.boolean().optional(),
    // Additional fields for supervisors
    type: Joi.string()
      .valid("academic", "industrial", "departmental")
      .optional(),
    companyName: Joi.string().when("role", {
      is: USER_ROLES.INDUSTRIAL_SUPERVISOR,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    companyAddress: Joi.string().optional(),
    position: Joi.string().optional(),
    qualification: Joi.string().optional(),
    yearsOfExperience: Joi.number().min(0).optional(),
    specialization: Joi.string().optional(),
    maxStudents: Joi.number().min(1).optional(),
    // Student-specific fields
    matricNumber: Joi.string().when("role", {
      is: USER_ROLES.STUDENT,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    level: Joi.number().when("role", {
      is: USER_ROLES.STUDENT,
      then: Joi.valid(100, 200, 300, 400, 500, 600).required(),
      otherwise: Joi.optional(),
    }),
    session: Joi.string().when("role", {
      is: USER_ROLES.STUDENT,
      then: Joi.string()
        .pattern(/^\d{4}\/\d{4}$/)
        .required(),
      otherwise: Joi.optional(),
    }),
    cgpa: Joi.number().min(0).max(5).optional(),
  }),

  updateUser: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: customValidators.phone.optional(),
    email: Joi.string().email().optional(),
  }).min(1),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: customValidators.phone.optional(),
    bio: Joi.string().max(500).optional(),
    address: Joi.string().max(200).optional(),
  }).min(1),
};

/**
 * Student Validation Schemas
 */
const studentValidation = {
  createStudent: Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    matricNumber: customValidators.matricNumber.required(),
    phone: customValidators.phone.optional(),
    department: customValidators.objectId.required(),
    level: Joi.number().valid(100, 200, 300, 400, 500, 600).required(),
    session: Joi.string()
      .regex(/^\d{4}\/\d{4}$/)
      .required()
      .messages({
        "string.pattern.base": "Session must be in format YYYY/YYYY",
      }),
  }),

  updateStudent: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: customValidators.phone.optional(),
    level: Joi.number().valid(100, 200, 300, 400, 500, 600).optional(),
    address: Joi.string().max(200).optional(),
    bio: Joi.string().max(500).optional(),
  }).min(1),
};

/**
 * Faculty Validation Schemas
 */
const facultyValidation = {
  createFaculty: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    code: Joi.string().min(2).max(10).uppercase().required(),
    description: Joi.string().max(500).optional(),
  }),

  updateFaculty: Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    code: Joi.string().min(2).max(10).uppercase().optional(),
    description: Joi.string().max(500).optional(),
  }).min(1),
};

/**
 * Department Validation Schemas
 */
const departmentValidation = {
  createDepartment: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    code: Joi.string().min(2).max(10).uppercase().required(),
    faculty: customValidators.objectId.required(),
    description: Joi.string().max(500).optional(),
  }),

  updateDepartment: Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    code: Joi.string().min(2).max(10).uppercase().optional(),
    description: Joi.string().max(500).optional(),
  }).min(1),
};

/**
 * Placement Validation Schemas
 */
const placementValidation = {
  createPlacement: Joi.object({
    companyName: Joi.string().min(2).max(200).required(),
    companyAddress: Joi.string().min(5).max(300).required(),
    companyEmail: Joi.string().email().required(),
    companyPhone: customValidators.phone.required(),
    position: Joi.string().min(2).max(100).required(),
    startDate: Joi.date().min("now").required(),
    endDate: Joi.date().greater(Joi.ref("startDate")).required(),
    acceptanceLetter: Joi.string().optional(), // File path after upload
  }),

  updatePlacement: Joi.object({
    companyName: Joi.string().min(2).max(200).optional(),
    companyAddress: Joi.string().min(5).max(300).optional(),
    companyEmail: Joi.string().email().optional(),
    companyPhone: customValidators.phone.optional(),
    position: Joi.string().min(2).max(100).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().greater(Joi.ref("startDate")).optional(),
  }).min(1),

  reviewPlacement: Joi.object({
    status: Joi.string()
      .valid(PLACEMENT_STATUS.APPROVED, PLACEMENT_STATUS.REJECTED)
      .required(),
    reviewComment: Joi.string().max(500).optional(),
  }),
};

/**
 * Logbook Validation Schemas
 */
const logbookValidation = {
  createLogbookEntry: Joi.object({
    tasksPerformed: Joi.string().min(10).max(2000).required(),
    skillsAcquired: Joi.string().min(5).max(1000).optional(),
    challenges: Joi.string().max(1000).optional(),
    lessonsLearned: Joi.string().max(1000).optional(),
    evidence: Joi.array().items(Joi.string()).optional(), // File paths
  }),

  updateLogbookEntry: Joi.object({
    tasksPerformed: Joi.string().min(10).max(2000).optional(),
    skillsAcquired: Joi.string().min(5).max(1000).optional(),
    challenges: Joi.string().max(1000).optional(),
  }).min(1),

  reviewLogbookEntry: Joi.object({
    status: Joi.string()
      .valid(
        LOGBOOK_STATUS.APPROVED,
        LOGBOOK_STATUS.REJECTED,
        LOGBOOK_STATUS.REVIEWED,
      )
      .required(),
    comment: Joi.string().max(1000).required(),
    rating: Joi.number().min(0).max(10).optional(),
  }),
};

/**
 * Assessment Validation Schemas
 */
const assessmentValidation = {
  createAssessment: Joi.object({
    student: customValidators.objectId.required(),
    type: Joi.string().valid("departmental", "industrial", "final").required(),
    scores: Joi.object({
      technical: Joi.number().min(0).max(100).required(),
      communication: Joi.number().min(0).max(100).required(),
      punctuality: Joi.number().min(0).max(100).required(),
      initiative: Joi.number().min(0).max(100).required(),
      teamwork: Joi.number().min(0).max(100).required(),
    }).required(),
    comment: Joi.string().max(1000).optional(),
    recommendation: Joi.string().max(500).optional(),
  }),

  updateAssessment: Joi.object({
    scores: Joi.object({
      technical: Joi.number().min(0).max(100).optional(),
      communication: Joi.number().min(0).max(100).optional(),
      punctuality: Joi.number().min(0).max(100).optional(),
      initiative: Joi.number().min(0).max(100).optional(),
      teamwork: Joi.number().min(0).max(100).optional(),
    }).optional(),
    comment: Joi.string().max(1000).optional(),
    recommendation: Joi.string().max(500).optional(),
  }).min(1),
};

const visitValidation = {
  createVisit: Joi.object({
    student: customValidators.objectId.required(),
    visitDate: Joi.date().greater("now").required().messages({
      "date.greater": "Visit date must be in the future",
    }),
    type: Joi.string().valid("physical", "virtual").required(),
    objective: Joi.string().max(1000).allow("").optional(),
    location: Joi.string().max(300).allow("").optional(),
    feedback: Joi.string().max(2000).allow("").optional(),
  }),

  updateVisit: Joi.object({
    visitDate: Joi.date().optional(),
    type: Joi.string().valid("physical", "virtual").optional(),
    objective: Joi.string().max(1000).allow("").optional(),
    location: Joi.string().max(300).allow("").optional(),
    feedback: Joi.string().max(2000).allow("").optional(),
  }).min(1),

  completeVisit: Joi.object({
    feedback: Joi.string().max(2000).allow("").optional(),
    understandingScore: Joi.number().integer().min(0).max(5).optional(),
    relevanceScore: Joi.number().integer().min(0).max(5).optional(),
    industryFeedback: Joi.number().integer().min(0).max(3).optional(),
    professionalism: Joi.number().integer().min(0).max(2).optional(),
  }),

  cancelVisit: Joi.object({
    reason: Joi.string().max(1000).required(),
  }).messages({ "any.required": "Cancellation reason is required" }),
};



/**
 * Notification Validation Schemas
 */
const notificationValidation = {
  createNotification: Joi.object({
    recipient: customValidators.objectId.required(),
    type: Joi.string().required(),
    title: Joi.string().min(3).max(100).required(),
    message: Joi.string().min(5).max(500).required(),
    priority: Joi.string().valid("low", "medium", "high", "urgent").optional(),
  }),
};

/**
 * Query Parameter Validation
 */
const queryValidation = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sort: Joi.string().optional(),
    order: Joi.string().valid("asc", "desc").optional(),
  }),

  filter: Joi.object({
    status: Joi.string().optional(),
    department: customValidators.objectId.optional(),
    faculty: customValidators.objectId.optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    search: Joi.string().optional(),
  }),
};

module.exports = {
  authValidation,
  userValidation,
  studentValidation,
  facultyValidation,
  departmentValidation,
  placementValidation,
  logbookValidation,
  assessmentValidation,
  visitValidation,
  notificationValidation,
  queryValidation,
  customValidators,
};
