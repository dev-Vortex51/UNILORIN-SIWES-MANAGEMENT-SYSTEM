/**
 * Application Constants
 * Centralized constants for roles, statuses, and other enumerated values
 * Ensures consistency across the application
 */

/**
 * User Roles
 * Defines all possible user roles in the system
 */
const USER_ROLES = {
  ADMIN: "admin",
  FACULTY: "faculty",
  DEPARTMENT: "department",
  COORDINATOR: "coordinator",
  STUDENT: "student",
  ACADEMIC_SUPERVISOR: "academic_supervisor",
  INDUSTRIAL_SUPERVISOR: "industrial_supervisor",
  // Backward compatibility alias
  DEPT_SUPERVISOR: "academic_supervisor",
};

// Backward compatibility alias (deprecated — use USER_ROLES instead)
/** @deprecated Use USER_ROLES */
const ROLES = USER_ROLES;

/**
 * Placement Status
 * Tracks the lifecycle of a placement application
 */
const PLACEMENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
};

/**
 * Logbook Status
 * Tracks the review status of logbook entries
 */
const LOGBOOK_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  REVIEWED: "reviewed",
  APPROVED: "approved",
  REJECTED: "rejected",
};

/**
 * Assessment Status
 * Tracks the completion status of assessments
 */
const ASSESSMENT_STATUS = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  COMPLETED: "completed",
};

/**
 * Notification Types
 * Categories of notifications sent to users
 */
const NOTIFICATION_TYPES = {
  INVITE_SENT: "invite_sent",
  INVITE_ACCEPTED: "invite_accepted",
  PASSWORD_RESET_REQUESTED: "password_reset_requested",
  PASSWORD_CHANGED: "password_changed",
  PLACEMENT_SUBMITTED: "placement_submitted",
  PLACEMENT_UPDATED: "placement_updated",
  PLACEMENT_APPROVED: "placement_approved",
  PLACEMENT_REJECTED: "placement_rejected",
  LOGBOOK_DRAFT_SAVED: "logbook_draft_saved",
  LOGBOOK_SUBMITTED: "logbook_submitted",
  LOGBOOK_REVIEWED: "logbook_reviewed",
  LOGBOOK_REJECTED_BY_INDUSTRIAL: "logbook_rejected_by_industrial",
  LOGBOOK_APPROVED_FINAL: "logbook_approved_final",
  LOGBOOK_REJECTED_FINAL: "logbook_rejected_final",
  ATTENDANCE_CHECKED_IN: "attendance_checked_in",
  ABSENCE_REQUEST_SUBMITTED: "absence_request_submitted",
  ATTENDANCE_APPROVED: "attendance_approved",
  ATTENDANCE_REJECTED: "attendance_rejected",
  ATTENDANCE_RECLASSIFIED: "attendance_reclassified",
  SUPERVISOR_ASSIGNED: "supervisor_assigned",
  SUPERVISOR_UNASSIGNED: "supervisor_unassigned",
  ASSESSMENT_ASSIGNED: "assessment_assigned",
  ASSESSMENT_SUBMITTED: "assessment_submitted",
  ASSESSMENT_REVIEWED: "assessment_reviewed",
  ASSESSMENT_DEADLINE_REMINDER: "assessment_deadline_reminder",
  DEADLINE_REMINDER: "deadline_reminder",
  BROADCAST_ANNOUNCEMENT: "broadcast_announcement",
  LOGBOOK_COMMENT: "logbook_comment",
  LOGBOOK_APPROVED: "logbook_approved",
  LOGBOOK_REJECTED: "logbook_rejected",
  PASSWORD_RESET: "password_reset",
  ACCOUNT_CREATED: "account_created",
  GENERAL: "general",
};

/**
 * Notification Priority Levels
 */
const NOTIFICATION_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

/**
 * Supervisor Types
 */
const SUPERVISOR_TYPES = {
  ACADEMIC: "academic",
  DEPARTMENTAL: "departmental",
  INDUSTRIAL: "industrial",
};

/**
 * Assessment Types
 */
const ASSESSMENT_TYPES = {
  DEPARTMENTAL: "departmental",
  INDUSTRIAL: "industrial",
  FINAL: "final",
};

/**
 * File Upload Types
 */
const UPLOAD_TYPES = {
  ACCEPTANCE_LETTER: "acceptance_letter",
  LOGBOOK_EVIDENCE: "logbook_evidence",
  PROFILE_PHOTO: "profile_photo",
  ASSESSMENT_DOCUMENT: "assessment_document",
};

/**
 * HTTP Status Codes (commonly used)
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Error Messages
 */
const ERROR_MESSAGES = {
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "You do not have permission to perform this action",
  NOT_FOUND: "Resource not found",
  INVALID_CREDENTIALS: "Invalid email or password",
  PASSWORD_RESET_REQUIRED: "Password reset required on first login",
  VALIDATION_ERROR: "Validation error",
  DUPLICATE_ENTRY: "Resource already exists",
  SERVER_ERROR: "Internal server error",
  INVALID_TOKEN: "Invalid or expired token",
};

/**
 * Success Messages
 */
const SUCCESS_MESSAGES = {
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  PASSWORD_RESET: "Password reset successfully",
};

/**
 * Academic Session Configuration
 */
const ACADEMIC_CONFIG = {
  MIN_TRAINING_WEEKS: 12,
  MAX_TRAINING_WEEKS: 52,
  MIN_LOGBOOK_ENTRIES: 12,
  ASSESSMENT_SCORE_MAX: 100,
};

/**
 * Regex Patterns for Validation
 */
const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+?\d{1,3}[- ]?)?\d{10,14}$/,
  MATRIC_NUMBER: /^[A-Z]{2,4}\/\d{2,4}\/\d{3,5}$/i,
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/.+/,
};

/**
 * Pagination Defaults
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

module.exports = {
  USER_ROLES,
  ROLES,
  PLACEMENT_STATUS,
  LOGBOOK_STATUS,
  ASSESSMENT_STATUS,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  SUPERVISOR_TYPES,
  ASSESSMENT_TYPES,
  UPLOAD_TYPES,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ACADEMIC_CONFIG,
  REGEX_PATTERNS,
  PAGINATION,
};
