const express = require("express");
const multer = require("multer");

const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const Task = require("../models/Task");
const DeletedTask = require("../models/DeletedTask");
const User = require("../models/User");
const Class = require("../models/Class");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// CLOUDINARY STORAGE
// ======================================================

const storage = new CloudinaryStorage({
  cloudinary,

  params: {
    folder: "StudyOrbit/proofs",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

// ======================================================
// MULTER CONFIG
// ======================================================

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }

    cb(new Error("Only image files are allowed"));
  },
});



// ======================================================
// HELPER: POPULATE TASK
// ======================================================

async function getPopulatedTask(taskId) {
  return Task.findById(taskId)
    .populate(
      "studentId",
      "name email role isActive",
    )
    .populate(
      "teacherId",
      "name email role isActive",
    )
    .populate(
      "classId",
      "name subject classCode teacherId students isActive maxStudents",
    );
}

// ======================================================
// HELPER: GET TEACHER CLASS
// ======================================================

async function getTeacherClass(
  classId,
  teacherId,
) {
  if (!classId) {
    return null;
  }

  return Class.findOne({
    _id: classId,
    teacherId,
    isActive: true,
  });
}

// ======================================================
// HELPER: CHECK STUDENT MEMBERSHIP
// ======================================================

function isStudentInClass(
  classItem,
  studentId,
) {
  if (
    !classItem ||
    !Array.isArray(classItem.students)
  ) {
    return false;
  }

  return classItem.students.some(
    (id) =>
      String(id) ===
      String(studentId),
  );
}



// ======================================================
// GET ALL TASKS
// ======================================================

router.get(
  "/",
  authMiddleware,

  async (req, res) => {
    try {
      let tasks = [];

      // ==================================================
      // TEACHER
      // ==================================================

      if (req.user.role === "teacher") {
        tasks = await Task.find({
          teacherId: req.user.id,
        })
          .populate(
            "studentId",
            "name email role isActive",
          )
          .populate(
            "teacherId",
            "name email role isActive",
          )
          .populate(
            "classId",
            "name subject classCode teacherId students isActive maxStudents",
          )
          .sort({
            createdAt: -1,
          });
      }

      // ==================================================
      // STUDENT
      // ==================================================

      else if (
        req.user.role === "student"
      ) {
        tasks = await Task.find({
          studentId: req.user.id,
        })
          .populate(
            "studentId",
            "name email role isActive",
          )
          .populate(
            "teacherId",
            "name email role isActive",
          )
          .populate(
            "classId",
            "name subject classCode teacherId students isActive maxStudents",
          )
          .sort({
            createdAt: -1,
          });
      }

      // ==================================================
      // PARENT
      // ==================================================

      else if (
        req.user.role === "parent"
      ) {
        const linkedStudentId =
          req.user.studentId ||
          req.user.childId;

        if (!linkedStudentId) {
          return res.json([]);
        }

        tasks = await Task.find({
          studentId: linkedStudentId,
        })
          .populate(
            "studentId",
            "name email role isActive",
          )
          .populate(
            "teacherId",
            "name email role isActive",
          )
          .populate(
            "classId",
            "name subject classCode teacherId students isActive maxStudents",
          )
          .sort({
            createdAt: -1,
          });
      }

      // ==================================================
      // ADMIN
      // ==================================================

      else if (
        req.user.role === "admin"
      ) {
        tasks = await Task.find()
          .populate(
            "studentId",
            "name email role isActive",
          )
          .populate(
            "teacherId",
            "name email role isActive",
          )
          .populate(
            "classId",
            "name subject classCode teacherId students isActive maxStudents",
          )
          .sort({
            createdAt: -1,
          });
      }

      // ==================================================
      // UNKNOWN ROLE
      // ==================================================

      else {
        return res.status(403).json({
          message:
            "You are not authorized to view tasks",
        });
      }

      return res.json(tasks);
    } catch (error) {
      console.error(
        "Get tasks error:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to fetch tasks",
      });
    }
  },
);

// ======================================================
// GET TASK BY ID
// ======================================================

router.get(
  "/:id",
  authMiddleware,

  async (req, res) => {
    try {
      const task =
        await getPopulatedTask(
          req.params.id,
        );

      if (!task) {
        return res.status(404).json({
          message:
            "Task not found",
        });
      }

      // ==================================================
      // STUDENT
      // ==================================================

      const isStudent =
        req.user.role === "student" &&
        task.studentId &&
        String(task.studentId._id) ===
        String(req.user.id);

      // ==================================================
      // TEACHER
      // ==================================================

      const isTeacher =
        req.user.role === "teacher" &&
        task.teacherId &&
        String(task.teacherId._id) ===
        String(req.user.id);

      // ==================================================
      // PARENT
      // ==================================================

      const linkedStudentId =
        req.user.studentId ||
        req.user.childId;

      const isParent =
        req.user.role === "parent" &&
        task.studentId &&
        linkedStudentId &&
        String(task.studentId._id) ===
        String(linkedStudentId);

      // ==================================================
      // ADMIN
      // ==================================================

      const isAdmin =
        req.user.role === "admin";

      // ==================================================
      // ACCESS DENIED
      // ==================================================

      if (
        !isStudent &&
        !isTeacher &&
        !isParent &&
        !isAdmin
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to view this task",
        });
      }

      return res.json(task);
    } catch (error) {
      console.error(
        "Get task error:",
        error,
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          message:
            "Invalid task ID",
        });
      }

      return res.status(500).json({
        message:
          "Failed to fetch task",
      });
    }
  },
);

// ======================================================
// CREATE TASK
// TEACHER ONLY
// ======================================================

router.post(
  "/",
  authMiddleware,
  requireRole("teacher"),

  async (req, res) => {
    try {
      const {
        title,
        description,
        classId,
        studentId,
      } = req.body;

      // ==================================================
      // TITLE VALIDATION
      // ==================================================

      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          message:
            "Task title is required",
        });
      }

      if (
        title.trim().length > 200
      ) {
        return res.status(400).json({
          message:
            "Task title cannot exceed 200 characters",
        });
      }

      // ==================================================
      // DESCRIPTION VALIDATION
      // ==================================================

      if (
        typeof description !== "string" ||
        !description.trim()
      ) {
        return res.status(400).json({
          message:
            "Task description is required",
        });
      }

      // ==================================================
      // CLASS VALIDATION
      // ==================================================

      if (!classId) {
        return res.status(400).json({
          message:
            "Class / subject is required",
        });
      }

      // ==================================================
      // STUDENT VALIDATION
      // ==================================================

      if (!studentId) {
        return res.status(400).json({
          message:
            "Student is required",
        });
      }

      // ==================================================
      // FIND TEACHER'S CLASS
      // ==================================================

      const classItem =
        await getTeacherClass(
          classId,
          req.user.id,
        );

      if (!classItem) {
        return res.status(403).json({
          message:
            "You can only create tasks for your own active classes",
        });
      }

      // ==================================================
      // FIND STUDENT
      // ==================================================

      const student =
        await User.findById(
          studentId,
        );

      if (!student) {
        return res.status(404).json({
          message:
            "Student not found",
        });
      }

      // ==================================================
      // STUDENT ROLE
      // ==================================================

      if (
        student.role !==
        "student"
      ) {
        return res.status(400).json({
          message:
            "Selected user is not a student",
        });
      }

      // ==================================================
      // STUDENT ACTIVE
      // ==================================================

      if (
        student.isActive === false
      ) {
        return res.status(400).json({
          message:
            "Selected student account is inactive",
        });
      }

      // ==================================================
      // CLASS MEMBERSHIP
      // ==================================================

      if (
        !isStudentInClass(
          classItem,
          student._id,
        )
      ) {
        return res.status(403).json({
          message:
            "Selected student is not enrolled in this subject/class",
        });
      }

      // ==================================================
      // CREATE TASK
      // ==================================================

      const task =
        await Task.create({
          title: title.trim(),

          description:
            description.trim(),

          classId:
            classItem._id,

          teacherId:
            req.user.id,

          studentId:
            student._id,

          completed: false,

          proofImage: "",

          rating: null,

          teacherComment: "",

          reviewStatus:
            "pending",

          reviewedAt: null,
        });

      // ==================================================
      // POPULATE
      // ==================================================

      const createdTask =
        await getPopulatedTask(
          task._id,
        );

      return res.status(201).json({
        message:
          "Task created successfully",

        task: createdTask,
      });
    } catch (error) {
      console.error(
        "Create task error:",
        error,
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          message:
            "Invalid class or student ID",
        });
      }

      return res.status(500).json({
        message:
          "Failed to create task",
      });
    }
  },
);

// ======================================================
// UPDATE TASK
// TEACHER ONLY
// ======================================================

// ======================================================
// REVIEW TASK
// TEACHER ONLY
// ======================================================

router.put(
  "/:id/review",
  authMiddleware,
  requireRole("teacher"),

  async (req, res) => {
    try {
      const {
        rating,
        teacherComment,
      } = req.body;

      // ==================================================
      // FIND TASK
      // ==================================================

      const task = await Task.findById(
        req.params.id,
      );

      if (!task) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      // ==================================================
      // TEACHER OWNERSHIP
      // ==================================================

      if (
        String(task.teacherId) !==
        String(req.user.id)
      ) {
        return res.status(403).json({
          message:
            "You can only review your own tasks",
        });
      }

      // ==================================================
      // VERIFY CLASS OWNERSHIP
      // ==================================================

      const classItem =
        await getTeacherClass(
          task.classId,
          req.user.id,
        );

      if (!classItem) {
        return res.status(403).json({
          message:
            "You are no longer authorized to review this task",
        });
      }

      // ==================================================
      // STATUS CHECK
      // ==================================================
      //
      // Only submitted tasks can be reviewed.
      //
      // pending
      //    ↓
      // submitted
      //    ↓
      // reviewed
      //
      // reviewed task cannot be reviewed again.
      //

      if (
        task.reviewStatus !==
        "submitted"
      ) {
        return res.status(400).json({
          message:
            "Only submitted tasks can be reviewed",
        });
      }

      // ==================================================
      // COMPLETED CHECK
      // ==================================================

      if (!task.completed) {
        return res.status(400).json({
          message:
            "Student has not completed this task yet",
        });
      }

      // ==================================================
      // PROOF CHECK
      // ==================================================

      if (!task.proofImage) {
        return res.status(400).json({
          message:
            "Student submission is not available",
        });
      }

      // ==================================================
      // RATING REQUIRED
      // ==================================================

      if (
        rating === undefined ||
        rating === null ||
        rating === ""
      ) {
        return res.status(400).json({
          message:
            "Rating is required",
        });
      }

      // ==================================================
      // RATING VALIDATION
      // ==================================================

      const numericRating =
        Number(rating);

      if (
        !Number.isInteger(
          numericRating,
        ) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          message:
            "Rating must be between 1 and 5",
        });
      }

      // ==================================================
      // COMMENT VALIDATION
      // ==================================================

      let cleanComment = "";

      if (
        teacherComment !==
        undefined &&
        teacherComment !== null
      ) {
        if (
          typeof teacherComment !==
          "string"
        ) {
          return res.status(400).json({
            message:
              "Teacher comment must be text",
          });
        }

        cleanComment =
          teacherComment.trim();

        if (
          cleanComment.length > 1000
        ) {
          return res.status(400).json({
            message:
              "Teacher comment cannot exceed 1000 characters",
          });
        }
      }

      // ==================================================
      // SAVE REVIEW
      // ==================================================

      task.rating =
        numericRating;

      task.teacherComment =
        cleanComment;

      task.reviewStatus =
        "reviewed";

      task.reviewedAt =
        new Date();

      await task.save();

      // ==================================================
      // POPULATED RESPONSE
      // ==================================================

      const reviewedTask =
        await getPopulatedTask(
          task._id,
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        message:
          "Task reviewed successfully",

        task:
          reviewedTask,
      });
    } catch (error) {
      console.error(
        "Review task error:",
        error,
      );

      // ==================================================
      // INVALID OBJECT ID
      // ==================================================

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          message:
            "Invalid task ID",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        message:
          "Failed to review task",
      });
    }
  },
);

// ======================================================
// COMPLETE TASK + PROOF
// STUDENT ONLY
// ======================================================

router.put(
  "/:id/complete",
  authMiddleware,
  requireRole("student"),
  upload.single("proof"),

  async (req, res) => {
    try {
      const task =
        await Task.findById(
          req.params.id,
        );

      if (!task) {
        return res.status(404).json({
          message:
            "Task not found",
        });
      }

      // ==================================================
      // STUDENT OWNER
      // ==================================================

      if (
        String(task.studentId) !==
        String(req.user.id)
      ) {
        return res.status(403).json({
          message:
            "You cannot complete this task",
        });
      }

      // ==================================================
      // ALREADY COMPLETED
      // ==================================================

      if (task.completed) {
        return res.status(400).json({
          message:
            "Task is already completed",
        });
      }

      // ==================================================
      // VERIFY CLASS
      // ==================================================

      const classItem =
        await Class.findById(
          task.classId,
        );

      if (!classItem) {
        return res.status(400).json({
          message:
            "The subject/class associated with this task no longer exists",
        });
      }

      // ==================================================
      // STUDENT MEMBERSHIP
      // ==================================================

      if (
        !isStudentInClass(
          classItem,
          req.user.id,
        )
      ) {
        return res.status(403).json({
          message:
            "You are no longer enrolled in this subject/class",
        });
      }

      // ==================================================
      // PROOF REQUIRED
      // ==================================================

      if (!req.file) {
        return res.status(400).json({
          message:
            "Please upload a proof image",
        });
      }

      // ==================================================
      // COMPLETE
      // ==================================================

      task.completed =
        true;

      task.proofImage = req.file.path;

      task.reviewStatus =
        "submitted";

      task.rating =
        null;

      task.teacherComment =
        "";

      task.reviewedAt =
        null;

      await task.save();

      const populatedTask =
        await getPopulatedTask(
          task._id,
        );

      return res.status(200).json({
        message:
          "Task completed and proof uploaded successfully",

        task:
          populatedTask,
      });
    } catch (error) {
      console.error(
        "Complete task error:",
        error,
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          message:
            "Invalid task ID",
        });
      }

      return res.status(500).json({
        message:
          error.message ||
          "Failed to complete task",
      });
    }
  },
);



// ======================================================
// DELETE TASK
// TEACHER ONLY
// ======================================================

router.delete(
  "/:id",
  authMiddleware,
  requireRole("teacher"),

  async (req, res) => {
    try {
      const task =
        await Task.findById(
          req.params.id,
        );

      if (!task) {
        return res.status(404).json({
          message:
            "Task not found",
        });
      }

      // ==================================================
      // OWNER CHECK
      // ==================================================

      if (
        String(task.teacherId) !==
        String(req.user.id)
      ) {
        return res.status(403).json({
          message:
            "You can only delete your own tasks",
        });
      }

      // ==================================================
      // GET CLASS
      // ==================================================

      const classItem =
        await Class.findById(
          task.classId,
        );

      // ==================================================
      // SAVE COMPLETE DELETED HISTORY
      // ==================================================

      await DeletedTask.create({
        originalTaskId:
          task._id,

        title:
          task.title,

        description:
          task.description || "",

        classId:
          task.classId,

        teacherId:
          task.teacherId,

        studentId:
          task.studentId,

        completed:
          task.completed,

        proofImage:
          task.proofImage || "",

        rating:
          task.rating,

        teacherComment:
          task.teacherComment ||
          "",

        reviewStatus:
          task.reviewStatus ||
          "pending",

        reviewedAt:
          task.reviewedAt ||
          null,

        className:
          classItem?.name ||
          "",

        subject:
          classItem?.subject ||
          "",

        deletedAt:
          new Date(),
      });

      // ==================================================
      // DELETE ORIGINAL
      // ==================================================

      await Task.findByIdAndDelete(
        task._id,
      );

      return res.json({
        message:
          "Task moved to deleted history",
      });
    } catch (error) {
      console.error(
        "Delete task error:",
        error,
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          message:
            "Invalid task ID",
        });
      }

      return res.status(500).json({
        message:
          "Failed to delete task",
      });
    }
  },
);

// ======================================================
// MULTER ERROR HANDLER
// ======================================================

router.use(
  (
    error,
    req,
    res,
    next,
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          message:
            "Image size must be less than 5 MB",
        });
      }

      return res.status(400).json({
        message:
          error.message ||
          "File upload failed",
      });
    }

    if (
      error &&
      error.message ===
      "Only image files are allowed"
    ) {
      return res.status(400).json({
        message:
          "Only image files are allowed",
      });
    }

    next(error);
  },
);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;