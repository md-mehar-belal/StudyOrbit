const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// SEND PARENT LINK REQUEST
// Parent -> Student
// ======================================================

router.post("/request-link", authMiddleware, async (req, res) => {
  try {
    // Only parent can use this API
    if (req.user.role !== "parent") {
      return res.status(403).json({
        message: "Only parents can send link requests",
      });
    }

    const { studentEmail } = req.body;

    if (!studentEmail || !studentEmail.trim()) {
      return res.status(400).json({
        message: "Student email is required",
      });
    }

    const normalizedEmail = studentEmail.trim().toLowerCase();

    // Find student
    const student = await User.findOne({
      email: normalizedEmail,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // Already linked with this parent
    if (
      student.parentId &&
      student.parentId.toString() === req.user.id.toString() &&
      student.parentLinkStatus === "linked"
    ) {
      return res.status(400).json({
        message: "This student is already linked with you",
      });
    }

    // Student already has another parent
    if (student.parentId && student.parentLinkStatus === "linked") {
      return res.status(400).json({
        message: "This student is already linked with another parent",
      });
    }

    // Request already pending
    if (
      student.parentId &&
      student.parentId.toString() === req.user.id.toString() &&
      student.parentLinkStatus === "pending"
    ) {
      return res.status(400).json({
        message: "Link request is already pending",
      });
    }

    // Create pending request
    student.parentId = req.user.id;
    student.parentLinkStatus = "pending";

    await student.save();

    return res.json({
      message: "Link request sent successfully",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        parentLinkStatus: student.parentLinkStatus,
      },
    });
  } catch (error) {
    console.error("Send parent link request error:", error);

    return res.status(500).json({
      message: "Unable to send link request",
    });
  }
});

// ======================================================
// GET PENDING PARENT REQUEST
// Student side
// ======================================================

router.get("/link-request", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can view parent requests",
      });
    }

    const student = await User.findById(req.user.id)
      .populate("parentId", "name email role");

    if (
      !student.parentId ||
      student.parentLinkStatus !== "pending"
    ) {
      return res.json({
        request: null,
      });
    }

    return res.json({
      request: {
        parent: {
          id: student.parentId._id,
          name: student.parentId.name,
          email: student.parentId.email,
        },
        status: student.parentLinkStatus,
      },
    });
  } catch (error) {
    console.error("Get parent request error:", error);

    return res.status(500).json({
      message: "Unable to get parent request",
    });
  }
});

// ======================================================
// ACCEPT PARENT REQUEST
// Student -> Accept
// ======================================================

router.post("/accept-link", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can accept parent requests",
      });
    }

    const student = await User.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    if (
      !student.parentId ||
      student.parentLinkStatus !== "pending"
    ) {
      return res.status(400).json({
        message: "No pending parent request found",
      });
    }

    student.parentLinkStatus = "linked";

    await student.save();

    return res.status(200).json({
      message: "Parent linked successfully",
      parentId: student.parentId,
    });
  } catch (error) {
    console.error("Accept parent request error:", error);

    return res.status(500).json({
      message: error.message || "Unable to accept parent request",
    });
  }
});

// ======================================================
// REJECT PARENT REQUEST
// Student -> Reject
// ======================================================

router.post("/reject-link", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can reject parent requests",
      });
    }

    const student = await User.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    if (
      !student.parentId ||
      student.parentLinkStatus !== "pending"
    ) {
      return res.status(400).json({
        message: "No pending parent request found",
      });
    }

    student.parentId = null;
    student.parentLinkStatus = "none";

    await student.save();

    return res.json({
      message: "Parent request rejected",
    });
  } catch (error) {
    console.error("Reject parent request error:", error);

    return res.status(500).json({
      message: "Unable to reject parent request",
    });
  }
});

// ======================================================
// GET LINKED CHILD
// Parent side
// ======================================================

router.get("/child", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({
        message: "Only parents can view child information",
      });
    }

    const child = await User.findOne({
      parentId: req.user.id,
      parentLinkStatus: "linked",
      role: "student",
    }).select("name email role parentLinkStatus");

    if (!child) {
      return res.json({
        child: null,
      });
    }

    return res.json({
      child,
    });
  } catch (error) {
    console.error("Get linked child error:", error);

    return res.status(500).json({
      message: "Unable to fetch child",
    });
  }
});

module.exports = router;