const mongoose = require("mongoose");

// ========================================
// USER SCHEMA
// ========================================

const userSchema = new mongoose.Schema(
  {
    // ========================================
    // USER NAME
    // ========================================

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // ========================================
    // EMAIL
    // ========================================

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 150,
    },

    // ========================================
    // PASSWORD
    // ========================================
    // Password bcrypt se hash hokar store hoga.
    // select:false ka matlab normal query me
    // password automatically return nahi hoga.

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    // ========================================
    // USER ROLE
    // ========================================

    role: {
      type: String,
      enum: [
        "admin",
        "teacher",
        "student",
        "parent",
      ],
      default: "student",
      required: true,
    },

    // ========================================
    // ACCOUNT STATUS
    // ========================================

    isActive: {
      type: Boolean,
      default: true,
    },

    // ========================================
    // STUDENT -> PARENT
    // ========================================
    // Ek student ka ek parent ho sakta hai.

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ========================================
    // PARENT LINK STATUS
    // ========================================

    parentLinkStatus: {
      type: String,
      enum: [
        "none",
        "pending",
        "approved",
      ],
      default: "none",
    },

    // ========================================
    // CREATED BY
    // ========================================
    // Admin/parent/teacher kisne account create
    // kiya uska reference.

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

// ========================================
// INDEXES
// ========================================

userSchema.index({
  role: 1,
});

userSchema.index({
  parentId: 1,
});

userSchema.index({
  isActive: 1,
});

// ========================================
// MODEL
// ========================================

module.exports = mongoose.model(
  "User",
  userSchema
);