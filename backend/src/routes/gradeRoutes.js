const express = require("express");
const router = express.Router();
const gradeController = require("../controllers/gradeController");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/authorization");
const { validateBody } = require("../middleware/validation");
const { ROLES } = require("../utils/constants");

router.use(authenticate);

router.get(
  "/my-grade",
  requireRole(ROLES.STUDENT),
  gradeController.getMyGrade,
);

router.get(
  "/export",
  requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
  gradeController.exportGrades,
);

router.post(
  "/recalculate/:studentId",
  requireRole(ROLES.COORDINATOR, ROLES.ADMIN),
  gradeController.recalculateGrade,
);

router.post(
  "/defense/:studentId",
  requireRole(ROLES.COORDINATOR, ROLES.ADMIN),
  validateBody(
    require("joi").object({
      defenseScore: require("joi").number().integer().min(0).max(20).required(),
    }),
  ),
  gradeController.inputDefenseScore,
);

router.post(
  "/finalize/:studentId",
  requireRole(ROLES.COORDINATOR, ROLES.ADMIN),
  gradeController.finalizeGrade,
);

router.get(
  "/:studentId",
  requireRole(ROLES.COORDINATOR, ROLES.ADMIN, ROLES.ACADEMIC_SUPERVISOR),
  gradeController.getStudentGrade,
);

router.get(
  "/",
  requireRole(ROLES.COORDINATOR, ROLES.ADMIN),
  gradeController.getAllGrades,
);

module.exports = router;
