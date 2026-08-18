const express = require("express");

const DeletedTask = require("../models/DeletedTask");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// GET DELETED TASK HISTORY
// ======================================================
//
// Access:
//   Teacher -> only tasks deleted by that teacher
//   Student -> only their own deleted tasks
//   Parent  -> currently disabled until a verified
//              parent-child relationship is available
//
// IMPORTANT:
// We never return another student's deleted tasks.
//

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH CHECK
      // ==================================================

      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }


      const userId = req.user.id;

      const role = req.user.role;


      // ==================================================
      // VALIDATE USER ID
      // ==================================================

      if (!userId) {
        return res.status(401).json({
          message: "Invalid authenticated user",
        });
      }


      // ==================================================
      // TEACHER
      // ==================================================
      //
      // Teacher can see ONLY tasks that this teacher
      // deleted.
      //

      if (role === "teacher") {
        const deletedTasks =
          await DeletedTask.find({
            teacherId: userId,
          })
            .populate(
              "studentId",
              "name email",
            )
            .populate(
              "classId",
              "name subject classCode",
            )
            .sort({
              deletedAt: -1,
            })
            .lean();


        return res.status(200).json(
          deletedTasks,
        );
      }


      // ==================================================
      // STUDENT
      // ==================================================
      //
      // Student can see ONLY their own deleted tasks.
      //

      if (role === "student") {
        const deletedTasks =
          await DeletedTask.find({
            studentId: userId,
          })
            .populate(
              "teacherId",
              "name email",
            )
            .populate(
              "classId",
              "name subject classCode",
            )
            .sort({
              deletedAt: -1,
            })
            .lean();


        return res.status(200).json(
          deletedTasks,
        );
      }


      // ==================================================
      // PARENT
      // ==================================================
      //
      // IMPORTANT:
      //
      // Current User model / route contract available
      // here does not establish a verified child relation.
      //
      // Therefore we must NOT return all deleted tasks.
      //
      // Once parent-child relation is implemented,
      // this branch should query only the verified
      // child's studentId.
      //

      if (role === "parent") {
        return res.status(403).json({
          message:
            "Parent deleted-task history requires a verified child relationship.",
        });
      }


      // ==================================================
      // ADMIN
      // ==================================================
      //
      // Admin does not automatically receive task history.
      // If required later, create a dedicated admin route
      // with explicit authorization and pagination.
      //

      if (role === "admin") {
        return res.status(403).json({
          message:
            "Admin deleted-task history is not available through this endpoint.",
        });
      }


      // ==================================================
      // UNKNOWN ROLE
      // ==================================================

      return res.status(403).json({
        message: "You are not authorized to view deleted tasks.",
      });

    } catch (error) {
      console.error(
        "Get deleted task history error:",
        error,
      );


      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        message:
          "Failed to fetch deleted task history",
      });
    }
  },
);


// ======================================================
// NO DELETE ROUTE
// ======================================================
//
// Deleted history is intentionally immutable.
//
// MongoDB TTL automatically removes records after
// the configured retention period from DeletedTask.js.
//
// Therefore:
//
// DELETE /api/deleted-tasks/:id
//
// is intentionally NOT implemented.
//

module.exports = router;