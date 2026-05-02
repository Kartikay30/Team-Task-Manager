const ApiError = require("../utils/ApiError");

// Only allow admins
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  throw new ApiError(403, "Access denied. Admins only.");
};

// Allow both admin and member (just must be authenticated)
const adminOrMember = (req, res, next) => {
  if (req.user) {
    return next();
  }
  throw new ApiError(403, "Access denied.");
};

module.exports = { adminOnly, adminOrMember };
