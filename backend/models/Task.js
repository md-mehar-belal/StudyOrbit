const mongoose = require("mongoose");

// ========================================
// TASK SCHEMA
// ========================================

const taskSchema = new mongoose.Schema(
  {
    // ========================================
    // TASK TITLE
    // ========================================

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },

    // ========================================
    // TASK DESCRIPTION
    // ========================================

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },

    // ========================================
    // CLASS
    // ========================================
    // Task kis class / subject ka hai.
    //
    // Example:
    //
    // Class:
    // B.Tech CSE - 3rd Year
    //
    // Subject:
    // DBMS
    //
    // Is field se task exact class ke saath
    // connected rahega.

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    // ========================================
    // TEACHER
    // ========================================
    // Task create karne wala teacher.

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // STUDENT
    // ========================================
    // Jis student ko task assign hua.

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // TASK STATUS
    // ========================================

    completed: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ========================================
    // PROOF IMAGE
    // ========================================
    // Student task complete karte waqt
    // proof upload karega.
    //
    // Example:
    // /uploads/proofs/abc123.jpg

    proofImage: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================
    // TEACHER RATING
    // ========================================
    // Teacher submitted work ko
    // 1 se 5 stars dega.

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    // ========================================
    // TEACHER COMMENT
    // ========================================
    // Teacher student ko feedback dega.

    teacherComment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    // ========================================
    // REVIEW STATUS
    // ========================================

    reviewStatus: {
      type: String,
      enum: [
        "pending",
        "submitted",
        "reviewed",
      ],
      default: "pending",
      index: true,
    },

    // ========================================
    // REVIEWED AT
    // ========================================

    reviewedAt: {
      type: Date,
      default: null,
    },
  },

  // ========================================
  // TIMESTAMPS
  // ========================================

  {
    timestamps: true,
  }
);

// ========================================
// COMPOUND INDEXES
// ========================================

// ========================================
// TEACHER + CLASS
// ========================================
// Teacher ke kisi particular subject/class
// ke tasks quickly find karne ke liye.

taskSchema.index({
  teacherId: 1,
  classId: 1,
  createdAt: -1,
});

// ========================================
// STUDENT + CLASS
// ========================================
// Student ke particular subject ke tasks
// quickly find karne ke liye.

taskSchema.index({
  studentId: 1,
  classId: 1,
  createdAt: -1,
});

// ========================================
// CLASS + CREATED DATE
// ========================================
// Kisi subject/class ke saare tasks
// quickly find karne ke liye.

taskSchema.index({
  classId: 1,
  createdAt: -1,
});

// ========================================
// TEACHER + REVIEW STATUS
// ========================================
// Teacher ke pending reviews quickly find
// karne ke liye.

taskSchema.index({
  teacherId: 1,
  reviewStatus: 1,
});

// ========================================
// STUDENT + COMPLETED
// ========================================
// Student ke completed/pending tasks
// quickly find karne ke liye.

taskSchema.index({
  studentId: 1,
  completed: 1,
});

// ========================================
// STUDENT + REVIEW STATUS
// ========================================
// Student ke submitted/reviewed tasks
// quickly find karne ke liye.

taskSchema.index({
  studentId: 1,
  reviewStatus: 1,
});

// ========================================
// MODEL
// ========================================

module.exports = mongoose.model(
  "Task",
  taskSchema
);