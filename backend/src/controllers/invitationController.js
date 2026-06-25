const invitationService = require("../services/invitationService");
const { formatResponse } = require("../utils/helpers");
const { ApiError } = require("../middleware/errorHandler");

exports.createInvitation = async (req, res, next) => {
  try {
    const invitation = await invitationService.createInvitation(
      req.user,
      req.body,
    );

    res
      .status(201)
      .json(
        formatResponse(
          true,
          "Invitation created successfully.",
          invitation,
        ),
      );
  } catch (error) {
    next(error);
  }
};

exports.getInvitations = async (req, res, next) => {
  try {
    const { status, role, email } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (role) filters.role = role;
    if (email) filters.email = email;

    const invitations = await invitationService.getInvitations(
      req.user,
      filters,
    );

    res.json(
      formatResponse(true, "Invitations retrieved successfully", invitations),
    );
  } catch (error) {
    next(error);
  }
};

exports.getInvitationById = async (req, res, next) => {
  try {
    const invitation = await invitationService.getInvitationById(
      req.params.id,
      req.user,
    );

    res.json(
      formatResponse(true, "Invitation retrieved successfully", invitation),
    );
  } catch (error) {
    next(error);
  }
};

exports.verifyToken = async (req, res, next) => {
  try {
    const invitation = await invitationService.verifyToken(req.params.token);

    // Return all data needed for setup form including prefill data
    const data = {
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      department: invitation.department,
      departmentId: invitation.departmentId,
      expiresAt: invitation.expiresAt,
      // Student metadata
      matricNumber: invitation.matricNumber,
      level: invitation.level,
      session: invitation.session,
      // Industrial supervisor metadata (for prefilling)
      companyName: invitation.companyName,
      companyAddress: invitation.companyAddress,
      position: invitation.position,
      yearsOfExperience: invitation.yearsOfExperience,
      placementId: invitation.placementId,
    };

    res.json(formatResponse(true, "Invitation verified successfully", data));
  } catch (error) {
    next(error);
  }
};

exports.completeSetup = async (req, res, next) => {
  try {
    const { token, ...userData } = req.body;

    if (!token) {
      throw new ApiError(400, "Invitation token is required");
    }

    const user = await invitationService.completeSetup(token, userData);

    res
      .status(201)
      .json(
        formatResponse(
          true,
          "Account created successfully. You can now login.",
          user,
        ),
      );
  } catch (error) {
    next(error);
  }
};

exports.resendInvitation = async (req, res, next) => {
  try {
    const invitation = await invitationService.resendInvitation(
      req.params.id,
      req.user,
    );

    res.json(
      formatResponse(true, "Invitation resent successfully", invitation),
    );
  } catch (error) {
    next(error);
  }
};

exports.cancelInvitation = async (req, res, next) => {
  try {
    const invitation = await invitationService.cancelInvitation(
      req.params.id,
      req.user,
    );

    res.json(
      formatResponse(true, "Invitation cancelled successfully", invitation),
    );
  } catch (error) {
    next(error);
  }
};

exports.getStatistics = async (req, res, next) => {
  try {
    const stats = await invitationService.getStatistics(req.user);

    res.json(formatResponse(true, "Statistics retrieved successfully", stats));
  } catch (error) {
    next(error);
  }
};

exports.bulkCreateInvitations = async (req, res, next) => {
  try {
    const { invitations } = req.body;

    if (!invitations) {
      throw new ApiError(400, "Request body must contain an 'invitations' array");
    }

    const result = await invitationService.createBulkInvitations(
      req.user,
      invitations,
    );

    res.status(201).json(
      formatResponse(true, "Bulk invitations processed", result),
    );
  } catch (error) {
    next(error);
  }
};

exports.cleanupExpired = async (req, res, next) => {
  try {
    const count = await invitationService.cleanupExpired();

    res.json(
      formatResponse(true, `Cleaned up ${count} expired invitations`, {
        count,
      }),
    );
  } catch (error) {
    next(error);
  }
};
