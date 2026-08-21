import { useState, useEffect } from "react";

import { useAuth } from "../../context/AuthContext";
import { useClasses } from "../../context/ClassContext";

// ======================================================
// MY CLASSES / MY SUBJECTS
// ======================================================

function MyClasses() {
  // ====================================================
  // AUTH
  // ====================================================

  const { user } = useAuth();

  // ====================================================
  // CLASS CONTEXT
  // ====================================================

  const {
    classes = [],
    currentClass,
    loading,
    error,
    selectClass,
    deleteClass,
    leaveClass,
    clearError,
    fetchClasses,
  } = useClasses();

  // ====================================================
  // LOCAL STATE
  // ====================================================

  const [actionLoading, setActionLoading] = useState(false);

  const [selectedClassId, setSelectedClassId] = useState(null);

  const [success, setSuccess] = useState("");

  // ====================================================
  // AUTO CLEAR SUCCESS / ERROR MESSAGES
  // ====================================================

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      clearError();
    }, 5000);

    return () => clearTimeout(timer);
  }, [error, clearError]);
  // ====================================================
  // ROLE
  // ====================================================

  const role = user?.role;

  const isTeacher = role === "teacher";

  const isStudent = role === "student";

  // ====================================================
  // CLEAR MESSAGES
  // ====================================================

  const clearMessages = () => {
    setSuccess("");

    if (error) {
      clearError();
    }
  };

  // ====================================================
  // FORMAT DATE
  // ====================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ====================================================
  // GET TEACHER NAME
  // ====================================================

  const getTeacherName = (teacher) => {
    // -----------------------------------------------
    // Populated teacher object
    // -----------------------------------------------

    if (teacher && typeof teacher === "object") {
      return teacher.name || teacher.fullName || teacher.username || "Teacher";
    }

    // -----------------------------------------------
    // Teacher ID only
    // -----------------------------------------------

    if (teacher) {
      return "Teacher";
    }

    return "Not assigned";
  };

  // ====================================================
  // GET TEACHER EMAIL
  // ====================================================

  const getTeacherEmail = (teacher) => {
    if (teacher && typeof teacher === "object") {
      return teacher.email || "";
    }

    return "";
  };

  // ====================================================
  // GET STUDENT COUNT
  // ====================================================

  const getStudentCount = (classItem) => {
    if (!Array.isArray(classItem?.students)) {
      return 0;
    }

    return classItem.students.length;
  };

  // ====================================================
  // GET MAX STUDENTS
  // ====================================================

  const getMaxStudents = (classItem) => {
    const max = Number(classItem?.maxStudents);

    if (!Number.isFinite(max) || max <= 0) {
      return 100;
    }

    return max;
  };

  // ====================================================
  // GET CLASS SUBJECT
  // ====================================================

  const getSubject = (classItem) => {
    return classItem?.subject || "Subject not specified";
  };

  // ====================================================
  // GET CLASS NAME
  // ====================================================

  const getClassName = (classItem) => {
    return classItem?.name || "Class not specified";
  };

  // ====================================================
  // OPEN / SELECT CLASS
  // ====================================================

  const handleOpenClass = (classItem) => {
    if (!classItem?._id) {
      return;
    }

    if (classItem.isActive === false) {
      setSuccess("This class is inactive.");

      return;
    }

    clearMessages();

    const selected = selectClass(classItem._id);

    if (selected) {
      setSuccess(
        `${
          selected.subject || selected.name || "Class"
        } selected successfully.`,
      );
    }
  };

  // ====================================================
  // COPY CLASS CODE
  // ====================================================

  const handleCopyCode = async (classCode) => {
    if (!classCode) {
      return;
    }

    try {
      clearMessages();

      // -----------------------------------------------
      // Modern browser clipboard
      // -----------------------------------------------

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(classCode);
      } else {
        // ---------------------------------------------
        // Fallback
        // ---------------------------------------------

        const textArea = document.createElement("textarea");

        textArea.value = classCode;

        textArea.style.position = "fixed";

        textArea.style.left = "-999999px";

        textArea.style.top = "-999999px";

        document.body.appendChild(textArea);

        textArea.focus();

        textArea.select();

        document.execCommand("copy");

        document.body.removeChild(textArea);
      }

      setSuccess("Class code copied successfully.");
    } catch (copyError) {
      console.error("Copy class code failed:", copyError);

      setSuccess("");

      alert("Unable to copy class code.");
    }
  };

  // ====================================================
  // LEAVE CLASS
  // ====================================================

  const handleLeaveClass = async (classItem) => {
    if (!classItem?._id) {
      return;
    }

    const subject = getSubject(classItem);

    const confirmed = window.confirm(
      `Are you sure you want to leave "${subject}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);

      setSelectedClassId(classItem._id);

      clearMessages();

      await leaveClass(classItem._id);

      setSuccess(`You have left "${subject}" successfully.`);
    } catch (leaveError) {
      console.error("Leave class failed:", leaveError);
    } finally {
      setActionLoading(false);

      setSelectedClassId(null);
    }
  };

  // ====================================================
  // DEACTIVATE CLASS
  // ====================================================

  const handleDeleteClass = async (classItem) => {
    if (!classItem?._id) {
      return;
    }

    const subject = getSubject(classItem);

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${subject}"?\n\nStudents will no longer be able to join this class.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setSelectedClassId(classItem._id);

      clearMessages();

      await deleteClass(classItem._id);

      setSuccess(`"${subject}" deactivated successfully.`);

      // Automatically hide success message after 3 seconds
    } catch (deleteError) {
      console.error("Deactivate class failed:", deleteError);
    } finally {
      setActionLoading(false);
      setSelectedClassId(null);
    }
  };
  // ====================================================
  // REFRESH CLASSES
  // ====================================================

  const handleRefresh = async () => {
    try {
      clearMessages();

      await fetchClasses();

      setSuccess("Classes refreshed successfully.");
    } catch (refreshError) {
      console.error("Refresh classes failed:", refreshError);
    }
  };

  // ====================================================
  // EMPTY STATE
  // ====================================================

  const getEmptyState = () => {
    if (isTeacher) {
      return {
        title: "No classes created yet",

        description:
          "Create your first subject class to start teaching students.",
      };
    }

    if (isStudent) {
      return {
        title: "No subjects joined yet",

        description:
          "Join your subjects using the class code provided by your teachers.",
      };
    }

    return {
      title: "No classes available",

      description: "There are currently no classes available.",
    };
  };

  const emptyState = getEmptyState();

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <section className="my-classes-section">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="page-header">
        <div>
          <h1>
            {isTeacher ? "My Classes" : isStudent ? "My Subjects" : "Classes"}
          </h1>

          <p>
            {isTeacher
              ? "Manage your subjects, students and class codes."
              : isStudent
                ? "View all subjects and teachers you are connected with."
                : "View available classes."}
          </p>
        </div>

        {/* ===============================================
            REFRESH
        =============================================== */}

        <button
          type="button"
          className="secondary-btn"
          onClick={handleRefresh}
          disabled={loading || actionLoading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* =================================================
          CURRENT CLASS
      ================================================= */}

      {currentClass && (
        <div className="selected-class-banner">
          <div>
            <span>Current Subject</span>

            <strong>
              {currentClass.subject || currentClass.name || "Selected Class"}
            </strong>
          </div>

          <div>
            <span>Class</span>

            <strong>{currentClass.name || "N/A"}</strong>
          </div>

          <div>
            <span>Teacher</span>

            <strong>{getTeacherName(currentClass.teacherId)}</strong>
          </div>

          {/* ---------------------------------------------
              CURRENT CLASS CODE
          --------------------------------------------- */}

          {currentClass.classCode && (
            <div>
              <span>Class Code</span>

              <strong>{currentClass.classCode}</strong>
            </div>
          )}
        </div>
      )}

      {/* =================================================
          SUCCESS
      ================================================= */}

      {success && (
        <div className="form-success" role="status">
          {success}
        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="form-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (
        <div className="empty-state">
          <h3>Loading classes...</h3>

          <p>Please wait while we load your classes.</p>
        </div>
      ) : classes.length === 0 ? (
        /* =================================================
           EMPTY STATE
        ================================================= */

        <div className="empty-state">
          <h3>{emptyState.title}</h3>

          <p>{emptyState.description}</p>
        </div>
      ) : (
        /* =================================================
           CLASS GRID
        ================================================= */

        <div className="classes-grid">
          {classes.map((classItem) => {
            // ==========================================
            // INVALID ITEM
            // ==========================================

            if (!classItem?._id) {
              return null;
            }

            // ==========================================
            // TEACHER
            // ==========================================

            const teacher = classItem.teacherId;

            const teacherName = getTeacherName(teacher);

            const teacherEmail = getTeacherEmail(teacher);

            // ==========================================
            // STUDENTS
            // ==========================================

            const studentCount = getStudentCount(classItem);

            const maxStudents = getMaxStudents(classItem);

            const isFull = studentCount >= maxStudents;

            // ==========================================
            // ACTIVE
            // ==========================================

            const isActive = classItem.isActive !== false;

            // ==========================================
            // SELECTED
            // ==========================================

            const isSelected = currentClass?._id === classItem._id;

            // ==========================================
            // ACTION LOADING
            // ==========================================

            const isThisActionLoading =
              actionLoading && selectedClassId === classItem._id;

            // ==========================================
            // SUBJECT
            // ==========================================

            const subject = getSubject(classItem);

            // ==========================================
            // CLASS NAME
            // ==========================================

            const className = getClassName(classItem);

            // ==========================================
            // CARD
            // ==========================================

            return (
              <article
                key={classItem._id}
                className={
                  isSelected ? "class-card selected-class-card" : "class-card"
                }
              >
                {/* ====================================
                        CARD HEADER
                  ==================================== */}

                <div className="class-card-header">
                  <div>
                    <h2>{subject}</h2>

                    <p>{className}</p>
                  </div>

                  {/* STATUS */}

                  <span
                    className={
                      isActive
                        ? "status completed-status"
                        : "status pending-status"
                    }
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* ====================================
                        SUBJECT
                  ==================================== */}

                <div className="class-info-row">
                  <span>Subject</span>

                  <strong>{subject}</strong>
                </div>

                {/* ====================================
                        CLASS
                  ==================================== */}

                <div className="class-info-row">
                  <span>Class</span>

                  <strong>{className}</strong>
                </div>

                {/* ====================================
                        TEACHER
                  ==================================== */}

                <div className="class-info-row">
                  <span>Teacher</span>

                  <strong>{teacherName}</strong>
                </div>

                {/* ====================================
                        TEACHER EMAIL
                  ==================================== */}

                {teacherEmail && (
                  <div className="class-info-row">
                    <span>Teacher Email</span>

                    <strong>{teacherEmail}</strong>
                  </div>
                )}

                {/* ====================================
                        CLASS CODE
                  ==================================== */}

                <div className="class-code-section">
                  <span>Class Code</span>

                  <div className="class-code">
                    {classItem.classCode || "N/A"}
                  </div>

                  {classItem.classCode && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => handleCopyCode(classItem.classCode)}
                      disabled={actionLoading}
                    >
                      Copy Code
                    </button>
                  )}
                </div>

                {/* ====================================
                        STUDENT COUNT
                  ==================================== */}

                <div className="class-info-row">
                  <span>Students</span>

                  <strong>
                    {studentCount}
                    {" / "}
                    {maxStudents}
                  </strong>
                </div>

                {/* ====================================
                        FULL CLASS
                  ==================================== */}

                {isFull && (
                  <div className="input-hint">
                    This class has reached its maximum student capacity.
                  </div>
                )}

                {/* ====================================
                        CREATED
                  ==================================== */}

                <div className="class-info-row">
                  <span>Created</span>

                  <strong>{formatDate(classItem.createdAt)}</strong>
                </div>

                {/* ====================================
                        UPDATED
                  ==================================== */}

                {classItem.updatedAt && (
                  <div className="class-info-row">
                    <span>Updated</span>

                    <strong>{formatDate(classItem.updatedAt)}</strong>
                  </div>
                )}

                {/* ====================================
                        ACTIONS
                  ==================================== */}

                <div className="class-actions">
                  {/* ==================================
                          OPEN CLASS
                    ================================== */}

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => handleOpenClass(classItem)}
                    disabled={!isActive || actionLoading}
                  >
                    {isSelected ? "Selected" : "Open Class"}
                  </button>

                  {/* ==================================
                          STUDENT LEAVE
                    ================================== */}

                  {isStudent && isActive && (
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleLeaveClass(classItem)}
                      disabled={isThisActionLoading}
                    >
                      {isThisActionLoading ? "Leaving..." : "Leave Class"}
                    </button>
                  )}

                  {/* ==================================
                          TEACHER DEACTIVATE
                    ================================== */}

                  {isTeacher && isActive && (
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDeleteClass(classItem)}
                      disabled={isThisActionLoading}
                    >
                      {isThisActionLoading ? "Deactivating..." : "Deactivate"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ======================================================
// EXPORT
// ======================================================

export default MyClasses;
