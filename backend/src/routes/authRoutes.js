const express = require("express");
const router = express.Router();
const { authController } = require("../controllers");
const { authenticate, refreshAccessToken } = require("../middleware/auth");
const { validateBody } = require("../middleware/validation");
const { authValidation, userValidation } = require("../utils/validators");
const { authLimiter } = require("../middleware/security");

router.post(
  "/login",
  authLimiter,
  validateBody(authValidation.login),
  authController.login,
);

router.post(
  "/change-password",
  authenticate,
  validateBody(authValidation.changePassword),
  authController.changePassword,
);

router.post("/refresh-token", refreshAccessToken);

router.post("/logout", authenticate, authController.logout);

router.post("/logout-all-devices", authenticate, authController.logoutAllDevices);

router.get("/profile", authenticate, authController.getProfile);

router.put(
  "/profile",
  authenticate,
  validateBody(userValidation.updateProfile),
  authController.updateProfile,
);

router.get("/me", authenticate, authController.getMe);

// Password reset endpoints
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post(
  "/reset-password-first-login",
  validateBody(authValidation.resetPasswordFirstLogin),
  authController.resetPasswordFirstLogin,
);

module.exports = router;
