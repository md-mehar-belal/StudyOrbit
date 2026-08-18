const mongoose = require("mongoose");

// ========================================
// CLASS SCHEMA
// ========================================

const classSchema = new mongoose.Schema(
  {
    // ========================================
    // CLASS NAME
    // ========================================
    // Example:
    // B.Tech CSE - 3rd Year

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // ========================================
    // SUBJECT
    // ========================================
    // Example:
    // DBMS
    // Java
    // Python
    // Computer Networks

    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // ========================================
    // CLASS CODE
    // ========================================
    // Student isi unique code se
    // class join karega.

    classCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 8,
      maxlength: 8,
    },

    // ========================================
    // TEACHER
    // ========================================
    // Is subject/class ko manage karne wala
    // teacher.

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ========================================
    // STUDENTS
    // ========================================
    // Is class/subject me enrolled students.
    //
    // IMPORTANT:
    //
    // Same student multiple classes me
    // enrolled ho sakta hai.
    //
    // Example:
    //
    // Student A
    //   ├── DBMS
    //   ├── Java
    //   ├── React
    //   └── Computer Networks

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ========================================
    // CLASS STATUS
    // ========================================

    isActive: {
      type: Boolean,
      default: true,
    },

    // ========================================
    // MAX STUDENTS
    // ========================================
    // Class ki maximum capacity.

    maxStudents: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// ========================================
// INDEXES
// ========================================

// ========================================
// TEACHER CLASSES
// ========================================
//
// Teacher ki active classes quickly
// find karne ke liye.

classSchema.index({
  teacherId: 1,
  isActive: 1,
});

// ========================================
// STUDENT CLASSES
// ========================================
//
// Student ki joined classes quickly
// find karne ke liye.

classSchema.index({
  students: 1,
  isActive: 1,
});

// ========================================
// SUBJECT SEARCH
// ========================================

classSchema.index({
  subject: 1,
});

// ========================================
// TEACHER + CLASS + SUBJECT
// ========================================
//
// Same teacher ke same class me same
// subject ki duplicate class avoid karne
// ke liye.
//
// Example:
//
// Teacher A
// CSE 3rd Year
// DBMS
//
// same combination dobara create nahi hoga.

classSchema.index(
  {
    teacherId: 1,
    name: 1,
    subject: 1,
  },
  {
    unique: true,
  }
);

// ========================================
// MODEL
// ========================================

module.exports = mongoose.model(
  "Class",
  classSchema
);