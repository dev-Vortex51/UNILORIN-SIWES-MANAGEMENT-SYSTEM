const express = require("express");
const router = express.Router();
const invitationController = require("../controllers/invitationController");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorization");
const { USER_ROLES } = require("../utils/constants");

// Public routes (no authentication required)
router.get("/verify/:token", invitationController.verifyToken);

router.post("/complete-setup", invitationController.completeSetup);

// Protected routes (authentication required)
router.use(authenticate);

// Get invitation statistics (must be before /:id route)
router.get(
  "/stats",
  authorize(USER_ROLES.ADMIN, USER_ROLES.COORDINATOR),
  invitationController.getStatistics
);

// Cleanup expired invitations (admin only)
router.post(
  "/cleanup",
  authorize(USER_ROLES.ADMIN),
  invitationController.cleanupExpired
);

// Create invitation (admin and coordinator)
router.post(
  "/",
  authorize(USER_ROLES.ADMIN, USER_ROLES.COORDINATOR),
  invitationController.createInvitation
);

// Bulk create invitations
router.post(
  "/bulk",
  authorize(USER_ROLES.ADMIN, USER_ROLES.COORDINATOR),
  invitationController.bulkCreateInvitations
);

// Get all invitations
router.get(
  "/",
  authorize(USER_ROLES.ADMIN, USER_ROLES.COORDINATOR),
  invitationController.getInvitations
);

// Resend invitation
router.post(
  "/:id/resend",
  authorize(USER_ROLES.ADMIN, USER_ROLES.COORDINATOR),
  invitationController.resendInvitation
);

// Cancel invitation
router.delete(
  "/:id",
  authorize(USER_ROLES.ADMIN, USER_ROLES.COORDINATOR),
  invitationController.cancelInvitation
);

// Get invitation by ID (must be LAST to avoid catching other routes)
router.get(
  "/:id",
  authorize(USER_ROLES.ADMIN, USER_ROLES.COORDINATOR),
  invitationController.getInvitationById
);

module.exports = router;
