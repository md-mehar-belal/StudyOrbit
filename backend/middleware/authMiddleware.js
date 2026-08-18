const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================

const authMiddleware = async (req, res, next) => {
  try {
    // ======================================
    // JWT SECRET CHECK
    // ======================================

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");

      return res.status(500).json({
        message: "Authentication service is not configured",
      });
    }

    // ======================================
    // AUTHORIZATION HEADER
    // ======================================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Expected:
    // Authorization: Bearer TOKEN

    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer" ||
      !parts[1]
    ) {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    const token = parts[1];

    // ======================================
    // VERIFY JWT
    // ======================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ======================================
    // VALIDATE JWT ID
    // ======================================

    if (!decoded.id) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    // ======================================
    // GET CURRENT USER FROM DATABASE
    // ======================================
    // Role, teacherId, parentId etc.
    // JWT se trust nahi karenge.

    const user = await User.findById(
      decoded.id
    );

    if (!user) {
      return res.status(401).json({
        message: "User account no longer exists",
      });
    }

    // ======================================
    // ACCOUNT STATUS
    // ======================================

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated",
      });
    }

    // ======================================
    // STORE CURRENT USER
    // ======================================

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      teacherId: user.teacherId,
      parentId: user.parentId,
      parentLinkStatus: user.parentLinkStatus,
    };

    // ======================================
    // CONTINUE
    // ======================================

    next();

  } catch (error) {
    console.error(
      "Authentication error:",
      error.message
    );

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;