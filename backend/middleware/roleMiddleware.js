// ========================================
// ROLE AUTHORIZATION MIDDLEWARE
// ========================================

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // ======================================
    // AUTHENTICATION CHECK
    // ======================================

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // ======================================
    // ROLE CHECK
    // ======================================

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    // ======================================
    // ACCESS GRANTED
    // ======================================

    next();
  };
};

module.exports = requireRole;