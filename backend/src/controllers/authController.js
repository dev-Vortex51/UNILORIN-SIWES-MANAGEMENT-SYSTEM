const { authService } = require("../services");
const { asyncHandler } = require("../middleware/errorHandler");
const { HTTP_STATUS, SUCCESS_MESSAGES } = require("../utils/constants");
const { formatResponse } = require("../utils/helpers");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  res
    .status(HTTP_STATUS.OK)
    .json(formatResponse(true, SUCCESS_MESSAGES.LOGIN_SUCCESS, result));
});

const resetPasswordFirstLogin = asyncHandler(async (req, res) => {
  const { userId, newPassword } = req.body;
  const result = await authService.resetPasswordFirstLogin(userId, newPassword);
  res
    .status(HTTP_STATUS.OK)
    .json(
      formatResponse(true, "Password reset successful. Please login.", result),
    );
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  await authService.changePassword(req.user.id, oldPassword, newPassword);

  res
    .status(HTTP_STATUS.OK)
    .json(formatResponse(true, SUCCESS_MESSAGES.PASSWORD_RESET));
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);

  res
    .status(HTTP_STATUS.OK)
    .json(formatResponse(true, SUCCESS_MESSAGES.LOGOUT_SUCCESS));
});

const logoutAllDevices = asyncHandler(async (req, res) => {
  const result = await authService.logoutAllDevices(req.user.id);

  res
    .status(HTTP_STATUS.OK)
    .json(formatResponse(true, result.message, result));
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user.id);

  res
    .status(HTTP_STATUS.OK)
    .json(formatResponse(true, "Profile retrieved successfully", profile));
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);

  res
    .status(HTTP_STATUS.OK)
    .json(formatResponse(true, "Profile updated successfully", user));
});

const getMe = asyncHandler(async (req, res) => {
  res
    .status(HTTP_STATUS.OK)
    .json(formatResponse(true, "User retrieved successfully", req.user));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  res
    .status(HTTP_STATUS.OK)
    .json(
      formatResponse(
        true,
        "If an account with that email exists, a reset link has been sent.",
      ),
    );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  res
    .status(HTTP_STATUS.OK)
    .json(
      formatResponse(true, "Password reset successful. You can now log in."),
    );
});

module.exports = {
  login,
  resetPasswordFirstLogin,
  changePassword,
  logout,
  logoutAllDevices,
  getProfile,
  updateProfile,
  getMe,
  forgotPassword,
  resetPassword,
};
