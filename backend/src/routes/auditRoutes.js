const express = require("express");
const router = express.Router();
const { auditController } = require("../controllers");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/authorization");

router.use(authenticate);

router.get("/", requireRole("admin", "coordinator"), auditController.getAuditLogs);
router.get("/:id", requireRole("admin", "coordinator"), auditController.getAuditLogById);

module.exports = router;
