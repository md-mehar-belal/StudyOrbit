const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

// ========================================
// HELPER: EMAIL VALIDATION
// ========================================

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ========================================
// SIGNUP
// PUBLIC SIGNUP = STUDENT ONLY
// ========================================

router.post("/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (!isValidEmail(email.trim())) {
      return res.status(400).json({
        message: "Please enter a valid email",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters",
      });
    }

    // ========================================
    // NORMALIZE EMAIL
    // ========================================

    const normalizedEmail =
      email.trim().toLowerCase();

    // ========================================
    // CHECK EXISTING USER
    // ========================================

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(400).json({
        message:
          "An account with this email already exists",
      });
    }

    // ========================================
    // HASH PASSWORD
    // ========================================

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    // ========================================
    // CREATE STUDENT
    // ========================================
    // IMPORTANT:
    // Role client se nahi liya ja raha.
    //
    // Public signup se hamesha student
    // account create hoga.

    const user = await User.create({
      name: name.trim(),

      email: normalizedEmail,

      password: hashedPassword,

      role: "student",

      isActive: true,

      teacherId: null,

      parentId: null,

      parentLinkStatus: "none",

      createdBy: null,
    });

    // ========================================
    // RESPONSE
    // ========================================
    // Password kabhi response me nahi jayega.

    return res.status(201).json({
      message: "Student signup successful",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        teacherId: user.teacherId,
        parentId: user.parentId,
        parentLinkStatus:
          user.parentLinkStatus,
      },
    });

  } catch (error) {
    console.error(
      "Signup error:",
      error
    );

    // ========================================
    // DUPLICATE EMAIL
    // ========================================

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "An account with this email already exists",
      });
    }

    // ========================================
    // SAFE ERROR
    // ========================================

    return res.status(500).json({
      message:
        "Unable to create account",
    });
  }
});

// ========================================
// LOGIN
// EMAIL + PASSWORD
// ========================================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    // ========================================
    // NORMALIZE EMAIL
    // ========================================

    const normalizedEmail =
      email.trim().toLowerCase();

    // ========================================
    // FIND USER
    // ========================================
    // Password select:false hai,
    // isliye login ke liye explicitly
    // password select karna padega.

    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select("+password");

    // ========================================
    // USER NOT FOUND
    // ========================================

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    // ========================================
    // ACCOUNT STATUS
    // ========================================

    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Your account has been deactivated. Please contact the administrator.",
      });
    }

    // ========================================
    // PASSWORD CHECK
    // ========================================

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    // ========================================
    // JWT SECRET CHECK
    // ========================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing from .env"
      );

      return res.status(500).json({
        message:
          "Authentication service is not configured",
      });
    }

    // ========================================
    // CREATE JWT
    // ========================================
    // JWT me minimum information rakhenge.
    //
    // IMPORTANT:
    // Backend authorization ke time database
    // se current user/role verify karega.

    const token =
      jwt.sign(
        {
          id: user._id.toString(),
        },

        process.env.JWT_SECRET,

        {
          expiresIn: "1d",
        }
      );

    // ========================================
    // LOGIN RESPONSE
    // ========================================

    return res.json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        teacherId: user.teacherId,
        parentId: user.parentId,
        parentLinkStatus:
          user.parentLinkStatus,
      },
    });

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to login",
    });
  }
});

// ========================================
// EXPORT ROUTER
// ========================================

module.exports = router;