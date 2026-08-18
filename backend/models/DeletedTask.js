const mongoose = require("mongoose");

// ======================================================
// DELETED TASK SCHEMA
// ======================================================

const deletedTaskSchema = new mongoose.Schema(
  {
    // ====================================================
    // ORIGINAL TASK ID
    // ====================================================

    originalTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // ====================================================
    // TASK TITLE
    // ====================================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // ====================================================
    // TASK DESCRIPTION
    // ====================================================

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // ====================================================
    // CLASS
    // ====================================================

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    // ====================================================
    // TEACHER
    // ====================================================

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ====================================================
    // STUDENT
    // ====================================================

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ====================================================
    // TASK STATUS
    // ====================================================

    completed: {
      type: Boolean,
      default: false,
    },

    // ====================================================
    // PROOF IMAGE
    // ====================================================

    proofImage: {
      type: String,
      default: "",
      trim: true,
    },

    // ====================================================
    // TEACHER RATING
    // ====================================================

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    // ====================================================
    // TEACHER COMMENT
    // ====================================================

    teacherComment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    // ====================================================
    // REVIEW STATUS
    // ====================================================

    reviewStatus: {
      type: String,
      enum: [
        "pending",
        "submitted",
        "reviewed",
      ],
      default: "pending",
    },

    // ====================================================
    // REVIEWED AT
    // ====================================================

    reviewedAt: {
      type: Date,
      default: null,
    },

    // ====================================================
    // CLASS SNAPSHOT
    // ====================================================

    className: {
      type: String,
      default: "",
      trim: true,
    },

    // ====================================================
    // SUBJECT SNAPSHOT
    // ====================================================

    subject: {
      type: String,
      default: "",
      trim: true,
    },

    // ====================================================
    // DELETED AT
    // ====================================================
    //
    // IMPORTANT:
    // No TTL / expires is used here.
    //
    // Deleted task history will remain in MongoDB
    // until an authorized teacher explicitly removes it
    // through a future/manual deletion feature.
    //

    deletedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },

  {
    timestamps: true,
  }
);


// ======================================================
// INDEXES
// ======================================================

deletedTaskSchema.index({
  teacherId: 1,
  deletedAt: -1,
});

deletedTaskSchema.index({
  studentId: 1,
  deletedAt: -1,
});

deletedTaskSchema.index({
  classId: 1,
  deletedAt: -1,
});


// ======================================================
// MODEL
// ======================================================

module.exports = mongoose.model(
  "DeletedTask",
  deletedTaskSchema
);