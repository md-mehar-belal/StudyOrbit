const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");

const Class = require("../models/Class");
const User = require("../models/User");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// CONSTANTS
// ======================================================

const CLASS_CODE_LENGTH = 8;
const MAX_CLASS_CODE_ATTEMPTS = 10;
const DEFAULT_MAX_STUDENTS = 100;

// ======================================================
// GENERATE CLASS CODE
// ======================================================

function generateClassCode() {
  return crypto
    .randomBytes(CLASS_CODE_LENGTH / 2)
    .toString("hex")
    .toUpperCase();
}

// ======================================================
// VALIDATE OBJECT ID
// ======================================================

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ======================================================
// GENERATE UNIQUE CLASS CODE
// ======================================================

async function createUniqueClassCode() {
  for (
    let attempt = 0;
    attempt < MAX_CLASS_CODE_ATTEMPTS;
    attempt++
  ) {
    const classCode = generateClassCode();

    const existingClass = await Class.exists({
      classCode,
    });

    if (!existingClass) {
      return classCode;
    }
  }

  throw new Error("Unable to generate unique class code");
}

// ======================================================
// POPULATE CLASS
// ======================================================

function populateClass(query) {
  return query
    .populate(
      "teacherId",
      "name email role isActive",
    )
    .populate(
      "students",
      "name email role isActive",
    );
}

// ======================================================
// NORMALIZE CLASS RESPONSE
// ======================================================

function normalizeClassResponse(classData) {
  if (!classData) {
    return null;
  }

  return {
    ...classData.toObject(),

    _id: classData._id,

    name: classData.name || "",

    subject: classData.subject || "",

    classCode: classData.classCode || "",

    teacherId: classData.teacherId || null,

    students: Array.isArray(classData.students)
      ? classData.students
      : [],

    isActive:
      classData.isActive !== false,

    maxStudents:
      Number(classData.maxStudents) ||
      DEFAULT_MAX_STUDENTS,

    createdAt: classData.createdAt || null,

    updatedAt: classData.updatedAt || null,
  };
}

// ======================================================
// CREATE CLASS
// TEACHER ONLY
// ======================================================
//
// POST /api/classes
//
// Body:
//
// {
//   "name": "B.Tech CSE - 3rd Year",
//   "subject": "DBMS"
// }
//
// ======================================================

router.post(
  "/",
  authMiddleware,
  requireRole("teacher"),

  async (req, res) => {
    try {
      // ==================================================
      // GET DATA
      // ==================================================

      const {
        name,
        subject,
      } = req.body;

      // ==================================================
      // VALIDATE CLASS NAME
      // ==================================================

      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          message: "Class name is required",
        });
      }

      const className = name.trim();

      if (className.length < 2) {
        return res.status(400).json({
          message:
            "Class name must be at least 2 characters",
        });
      }

      if (className.length > 100) {
        return res.status(400).json({
          message:
            "Class name cannot exceed 100 characters",
        });
      }

      // ==================================================
      // VALIDATE SUBJECT
      // ==================================================

      if (
        typeof subject !== "string" ||
        !subject.trim()
      ) {
        return res.status(400).json({
          message: "Subject is required",
        });
      }

      const classSubject = subject.trim();

      if (classSubject.length < 2) {
        return res.status(400).json({
          message:
            "Subject must be at least 2 characters",
        });
      }

      if (classSubject.length > 100) {
        return res.status(400).json({
          message:
            "Subject cannot exceed 100 characters",
        });
      }

      // ==================================================
      // VERIFY TEACHER
      // ==================================================

      const teacher = await User.findById(
        req.user.id,
      ).select(
        "_id name email role isActive",
      );

      if (!teacher) {
        return res.status(404).json({
          message:
            "Teacher account not found",
        });
      }

      // ==================================================
      // ROLE CHECK
      // ==================================================

      if (teacher.role !== "teacher") {
        return res.status(403).json({
          message:
            "Only teachers can create classes",
        });
      }

      // ==================================================
      // ACCOUNT STATUS
      // ==================================================

      if (!teacher.isActive) {
        return res.status(403).json({
          message:
            "Your account is inactive",
        });
      }

      // ==================================================
      // DUPLICATE CLASS CHECK
      // ==================================================

      const existingClass =
        await Class.findOne({
          teacherId: teacher._id,
          name: className,
          subject: classSubject,
          isActive: true,
        }).select("_id");

      if (existingClass) {
        return res.status(409).json({
          message:
            "You already have an active class for this subject",
        });
      }

      // ==================================================
      // GENERATE CLASS CODE
      // ==================================================

      const classCode =
        await createUniqueClassCode();

      // ==================================================
      // CREATE CLASS
      // ==================================================

      const newClass =
        await Class.create({
          name: className,

          subject: classSubject,

          classCode,

          teacherId: teacher._id,

          students: [],

          isActive: true,

          maxStudents:
            DEFAULT_MAX_STUDENTS,
        });

      // ==================================================
      // GET POPULATED CLASS
      // ==================================================

      const populatedClass =
        await populateClass(
          Class.findById(newClass._id),
        );

      if (!populatedClass) {
        return res.status(500).json({
          message:
            "Class was created but could not be loaded",
        });
      }

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(201).json({
        success: true,

        message:
          "Class created successfully",

        class:
          normalizeClassResponse(
            populatedClass,
          ),
      });
    } catch (error) {
      console.error(
        "Create class error:",
        error,
      );

      if (error.code === 11000) {
        return res.status(409).json({
          message:
            "This class or class code already exists",
        });
      }

      return res.status(500).json({
        message:
          "Failed to create class",
      });
    }
  },
);

// ======================================================
// GET MY CLASSES
// ======================================================
//
// GET /api/classes
//
// Teacher -> Own classes
// Student -> Joined classes
// Admin   -> All active classes
// Parent  -> Empty
//
// ======================================================

router.get(
  "/",
  authMiddleware,

  async (req, res) => {
    try {
      // ==================================================
      // TEACHER
      // ==================================================

      if (req.user.role === "teacher") {
        const classes =
          await populateClass(
            Class.find({
              teacherId:
                req.user.id,

              isActive: true,
            }).sort({
              createdAt: -1,
            }),
          );

        return res.json(
          classes.map(
            normalizeClassResponse,
          ),
        );
      }

      // ==================================================
      // STUDENT
      // ==================================================

      if (req.user.role === "student") {
        const classes =
          await populateClass(
            Class.find({
              students:
                req.user.id,

              isActive: true,
            }).sort({
              createdAt: -1,
            }),
          );

        return res.json(
          classes.map(
            normalizeClassResponse,
          ),
        );
      }

      // ==================================================
      // ADMIN
      // ==================================================

      if (req.user.role === "admin") {
        const classes =
          await populateClass(
            Class.find({
              isActive: true,
            }).sort({
              createdAt: -1,
            }),
          );

        return res.json(
          classes.map(
            normalizeClassResponse,
          ),
        );
      }

      // ==================================================
      // PARENT
      // ==================================================

      if (req.user.role === "parent") {
        return res.json([]);
      }

      return res.status(403).json({
        message:
          "You are not authorized to view classes",
      });
    } catch (error) {
      console.error(
        "Get classes error:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to fetch classes",
      });
    }
  },
);

// ======================================================
// GET CLASS BY ID
// ======================================================
//
// GET /api/classes/:id
//
// ======================================================

router.get(
  "/:id",
  authMiddleware,

  async (req, res) => {
    try {
      const { id } = req.params;

      // ==================================================
      // VALIDATE ID
      // ==================================================

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message:
            "Invalid class ID",
        });
      }

      // ==================================================
      // FIND CLASS
      // ==================================================

      const classData =
        await populateClass(
          Class.findById(id),
        );

      if (!classData) {
        return res.status(404).json({
          message:
            "Class not found",
        });
      }

      // ==================================================
      // ACTIVE CHECK
      // ==================================================

      if (!classData.isActive) {
        return res.status(404).json({
          message:
            "This class is no longer active",
        });
      }

      // ==================================================
      // ADMIN
      // ==================================================

      if (req.user.role === "admin") {
        return res.json(
          normalizeClassResponse(
            classData,
          ),
        );
      }

      // ==================================================
      // TEACHER
      // ==================================================

      if (req.user.role === "teacher") {
        const teacherId =
          classData.teacherId?._id?.toString();

        if (
          teacherId !==
          req.user.id
        ) {
          return res.status(403).json({
            message:
              "You do not have access to this class",
          });
        }

        return res.json(
          normalizeClassResponse(
            classData,
          ),
        );
      }

      // ==================================================
      // STUDENT
      // ==================================================

      if (req.user.role === "student") {
        const isMember =
          Array.isArray(
            classData.students,
          ) &&
          classData.students.some(
            (student) =>
              student._id.toString() ===
              req.user.id,
          );

        if (!isMember) {
          return res.status(403).json({
            message:
              "You are not a member of this class",
          });
        }

        return res.json(
          normalizeClassResponse(
            classData,
          ),
        );
      }

      // ==================================================
      // PARENT
      // ==================================================

      if (req.user.role === "parent") {
        return res.status(403).json({
          message:
            "Parents cannot access class management",
        });
      }

      return res.status(403).json({
        message:
          "You are not authorized to access this class",
      });
    } catch (error) {
      console.error(
        "Get class error:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to fetch class",
      });
    }
  },
);

// ======================================================
// JOIN CLASS
// STUDENT ONLY
// ======================================================
//
// POST /api/classes/join
//
// Body:
//
// {
//   "classCode": "AB12CD34"
// }
//
// ======================================================

router.post(
  "/join",
  authMiddleware,
  requireRole("student"),

  async (req, res) => {
    try {
      const {
        classCode,
      } = req.body;

      // ==================================================
      // VALIDATE
      // ==================================================

      if (
        typeof classCode !== "string" ||
        !classCode.trim()
      ) {
        return res.status(400).json({
          message:
            "Class code is required",
        });
      }

      const normalizedCode =
        classCode
          .trim()
          .toUpperCase();

      if (
        !/^[A-F0-9]{8}$/.test(
          normalizedCode,
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid class code",
        });
      }

      // ==================================================
      // VERIFY STUDENT
      // ==================================================

      const student =
        await User.findById(
          req.user.id,
        ).select(
          "_id name email role isActive",
        );

      if (!student) {
        return res.status(404).json({
          message:
            "Student account not found",
        });
      }

      if (student.role !== "student") {
        return res.status(403).json({
          message:
            "Only students can join classes",
        });
      }

      if (!student.isActive) {
        return res.status(403).json({
          message:
            "Your account is inactive",
        });
      }

      // ==================================================
      // FIND CLASS
      // ==================================================

      const classData =
        await Class.findOne({
          classCode:
            normalizedCode,

          isActive: true,
        });

      if (!classData) {
        return res.status(404).json({
          message:
            "Invalid or inactive class code",
        });
      }

      // ==================================================
      // ALREADY JOINED
      // ==================================================

      const alreadyJoined =
        classData.students.some(
          (studentId) =>
            studentId.toString() ===
            student._id.toString(),
        );

      if (alreadyJoined) {
        return res.status(409).json({
          message:
            `You have already joined ${classData.subject}`,
        });
      }

      // ==================================================
      // CAPACITY
      // ==================================================

      if (
        classData.students.length >=
        classData.maxStudents
      ) {
        return res.status(409).json({
          message:
            "This class has reached its maximum student capacity",
        });
      }

      // ==================================================
      // ADD STUDENT
      // ==================================================

      classData.students.push(
        student._id,
      );

      await classData.save();

      // ==================================================
      // POPULATE RESULT
      // ==================================================

      const populatedClass =
        await populateClass(
          Class.findById(
            classData._id,
          ),
        );

      return res.status(200).json({
        success: true,

        message:
          "Successfully joined the class",

        class:
          normalizeClassResponse(
            populatedClass,
          ),
      });
    } catch (error) {
      console.error(
        "Join class error:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to join class",
      });
    }
  },
);

// ======================================================
// LEAVE CLASS
// STUDENT ONLY
// ======================================================
//
// POST /api/classes/:id/leave
//
// ======================================================

router.post(
  "/:id/leave",
  authMiddleware,
  requireRole("student"),

  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message:
            "Invalid class ID",
        });
      }

      const classData =
        await Class.findOne({
          _id: id,
          isActive: true,
        });

      if (!classData) {
        return res.status(404).json({
          message:
            "Class not found",
        });
      }

      const isMember =
        classData.students.some(
          (studentId) =>
            studentId.toString() ===
            req.user.id,
        );

      if (!isMember) {
        return res.status(400).json({
          message:
            "You are not a member of this class",
        });
      }

      classData.students =
        classData.students.filter(
          (studentId) =>
            studentId.toString() !==
            req.user.id,
        );

      await classData.save();

      return res.json({
        success: true,

        message:
          `You have left ${classData.subject} successfully`,
      });
    } catch (error) {
      console.error(
        "Leave class error:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to leave class",
      });
    }
  },
);

// ======================================================
// DEACTIVATE CLASS
// TEACHER OWNER ONLY
// ======================================================
//
// DELETE /api/classes/:id
//
// Database se permanently delete nahi hoga.
// isActive = false.
//
// ======================================================

router.delete(
  "/:id",
  authMiddleware,
  requireRole("teacher"),

  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message:
            "Invalid class ID",
        });
      }

      const classData =
        await Class.findById(id);

      if (!classData) {
        return res.status(404).json({
          message:
            "Class not found",
        });
      }

      console.log("Class teacherId:", classData.teacherId);
      console.log("Logged in user:", req.user);
      console.log("Logged in user id:", req.user.id);
      console.log("Logged in user _id:", req.user._id);
      // ==================================================
      // OWNERSHIP
      // ==================================================

      if (
        String(classData.teacherId) !== String(req.user.id)
      ) {
        return res.status(403).json({
          message: "You can only manage your own classes",
        });
      }

      // ==================================================
      // ACTIVE CHECK
      // ==================================================

      if (!classData.isActive) {
        return res.status(400).json({
          message:
            "Class is already inactive",
        });
      }

      // ==================================================
      // DEACTIVATE
      // ==================================================

      classData.isActive = false;

      await classData.save();

      return res.json({
        success: true,

        message:
          "Class deactivated successfully",
      });
    } catch (error) {
      console.error(
        "Deactivate class error:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to deactivate class",
      });
    }
  },
);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;