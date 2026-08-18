import { useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";
import { useClasses } from "../../context/ClassContext";
import { API_URL } from "../../api/api";

// ======================================================
// SERVER URL
// ======================================================

const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

// ======================================================
// HELPERS
// ======================================================

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return value._id || value.id || "";
  }

  return value;
};

const getName = (value, fallback = "Unknown") => {
  if (!value) return fallback;

  if (typeof value === "string") {
    return value;
  }

  return (
    value.name || value.fullName || value.username || value.email || fallback
  );
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatus = (task) => {
  if (task?.reviewStatus === "reviewed") {
    return {
      label: "Reviewed",
      className: "status-reviewed",
    };
  }

  if (task?.reviewStatus === "submitted") {
    return {
      label: "Submitted",
      className: "status-submitted",
    };
  }

  if (task?.completed === true) {
    return {
      label: "Completed",
      className: "status-completed",
    };
  }

  return {
    label: "Pending",
    className: "status-pending",
  };
};

// ======================================================
// TASK VIEW
// ======================================================

export default function TaskView() {
  // ====================================================
  // AUTH
  // ====================================================

  const { user } = useAuth();

  // ====================================================
  // TASK CONTEXT
  // ====================================================

  const {
    tasks = [],
    loading,
    actionLoading,
    error,
    clearError,

    getTasksByClass,
    getPendingReviewTasks,
    getCompletedTasks,
    getPendingTasks,

    fetchTasks,
    deleteTask,
  } = useTasks();

  // ====================================================
  // CLASS CONTEXT
  // ====================================================

  const { classes = [], currentClass, setCurrentClass } = useClasses();

  // ====================================================
  // LOCAL STATE
  // ====================================================

  const [selectedClassId, setSelectedClassId] = useState(
    currentClass?._id || "",
  );

  const [statusFilter, setStatusFilter] = useState("all");

  const [search, setSearch] = useState("");

  const [deleteId, setDeleteId] = useState("");

  // Proof preview modal
  const [proofPreview, setProofPreview] = useState(null);

  // ====================================================
  // ROLE
  // ====================================================

  const isTeacher = user?.role === "teacher";

  const isStudent = user?.role === "student";

  // ====================================================
  // SELECTED CLASS
  // ====================================================

  const selectedClass = useMemo(() => {
    if (!selectedClassId) {
      return currentClass || null;
    }

    return (
      classes.find((item) => String(item?._id) === String(selectedClassId)) ||
      currentClass ||
      null
    );
  }, [classes, currentClass, selectedClassId]);

  // ====================================================
  // FILTER TASKS
  // ====================================================

  const visibleTasks = useMemo(() => {
    let result = [...tasks];

    // ----------------------------------------------
    // CLASS FILTER
    // ----------------------------------------------

    if (selectedClassId) {
      result = getTasksByClass(selectedClassId);
    }

    // ----------------------------------------------
    // STATUS FILTER
    // ----------------------------------------------

    if (statusFilter === "pending") {
      result = result.filter((task) => task?.completed !== true);
    }

    if (statusFilter === "completed") {
      result = result.filter((task) => task?.completed === true);
    }

    if (statusFilter === "submitted") {
      result = result.filter((task) => task?.reviewStatus === "submitted");
    }

    if (statusFilter === "reviewed") {
      result = result.filter((task) => task?.reviewStatus === "reviewed");
    }

    // ----------------------------------------------
    // SEARCH
    // ----------------------------------------------

    const cleanSearch = search.trim().toLowerCase();

    if (cleanSearch) {
      result = result.filter((task) => {
        const title = task?.title?.toLowerCase() || "";

        const description = task?.description?.toLowerCase() || "";

        const studentName = getName(task?.studentId, "").toLowerCase();

        return (
          title.includes(cleanSearch) ||
          description.includes(cleanSearch) ||
          studentName.includes(cleanSearch)
        );
      });
    }

    return result;
  }, [tasks, selectedClassId, statusFilter, search, getTasksByClass]);

  // ====================================================
  // STATS
  // ====================================================

  const stats = useMemo(() => {
    const total = visibleTasks.length;

    const completed = visibleTasks.filter(
      (task) => task?.completed === true,
    ).length;

    const pending = visibleTasks.filter(
      (task) => task?.completed !== true,
    ).length;

    const submitted = visibleTasks.filter(
      (task) => task?.reviewStatus === "submitted",
    ).length;

    const reviewed = visibleTasks.filter(
      (task) => task?.reviewStatus === "reviewed",
    ).length;

    return {
      total,
      completed,
      pending,
      submitted,
      reviewed,
    };
  }, [visibleTasks]);

  // ====================================================
  // CLASS CHANGE
  // ====================================================

  const handleClassChange = (event) => {
    const classId = event.target.value;

    setSelectedClassId(classId);

    const selected = classes.find(
      (item) => String(item?._id) === String(classId),
    );

    if (selected && setCurrentClass) {
      setCurrentClass(selected);
    }
  };

  // ====================================================
  // REFRESH
  // ====================================================

  const handleRefresh = async () => {
    clearError();

    try {
      await fetchTasks();
    } catch (err) {
      console.error("Task refresh failed:", err);
    }
  };

  // ====================================================
  // DELETE
  // ====================================================

  const handleDelete = async (taskId) => {
    if (!taskId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteId(taskId);

      await deleteTask(taskId);
    } catch (err) {
      console.error("Delete task failed:", err);
    } finally {
      setDeleteId("");
    }
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Tasks</h1>

            <p>Manage and track your assignments.</p>
          </div>
        </div>

        <div className="loading-card">
          <div className="spinner" />

          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  // ====================================================
  // MAIN UI
  // ====================================================

  return (
    <div className="page-container">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="page-header">
        <div>
          <h1>{isTeacher ? "Assigned Tasks" : "My Tasks"}</h1>

          <p>
            {isTeacher
              ? "Create, manage and review assignments for your students."
              : "View your assignments and track your progress."}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleRefresh}
          disabled={loading || actionLoading}
        >
          Refresh
        </button>
      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={clearError}
            className="alert-close"
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {/* ==================================================
          CURRENT CLASS
      ================================================== */}

      <div className="task-toolbar">
        <div className="toolbar-field">
          <label htmlFor="task-class">Subject / Class</label>

          <select
            id="task-class"
            value={selectedClassId}
            onChange={handleClassChange}
          >
            <option value="">All Classes</option>

            {classes.map((classItem) => (
              <option key={classItem?._id} value={classItem?._id}>
                {classItem?.subject || classItem?.name || "Unnamed Class"}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-field">
          <label htmlFor="task-status">Status</label>

          <select
            id="task-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All</option>

            <option value="pending">Pending</option>

            <option value="completed">Completed</option>

            <option value="submitted">Submitted</option>

            <option value="reviewed">Reviewed</option>
          </select>
        </div>

        <div className="toolbar-field search-field">
          <label htmlFor="task-search">Search</label>

          <input
            id="task-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks..."
          />
        </div>
      </div>

      {/* ==================================================
          STATS
      ================================================== */}

      <div className="stats-grid">
        <div className="stat-card">
          <strong>{stats.total}</strong>

          <span>Total</span>
        </div>

        <div className="stat-card">
          <strong>{stats.pending}</strong>

          <span>Pending</span>
        </div>

        <div className="stat-card">
          <strong>{stats.completed}</strong>

          <span>Completed</span>
        </div>

        <div className="stat-card">
          <strong>{stats.submitted}</strong>

          <span>Submitted</span>
        </div>

        {isTeacher && (
          <div className="stat-card">
            <strong>{stats.reviewed}</strong>

            <span>Reviewed</span>
          </div>
        )}
      </div>

      {/* ==================================================
          SELECTED CLASS INFO
      ================================================== */}

      {selectedClass && (
        <div className="class-info-card">
          <div>
            <span>Subject</span>

            <strong>{selectedClass?.subject || "Subject not specified"}</strong>
          </div>

          <div>
            <span>Class</span>

            <strong>{selectedClass?.name || "Class not specified"}</strong>
          </div>

          <div>
            <span>Students</span>

            <strong>
              {Array.isArray(selectedClass?.students)
                ? selectedClass.students.length
                : 0}
            </strong>
          </div>
        </div>
      )}

      {/* ==================================================
          TASK LIST
      ================================================== */}

      <section className="tasks-section">
        <div className="section-header">
          <div>
            <h2>Tasks</h2>

            <p>
              {visibleTasks.length}{" "}
              {visibleTasks.length === 1 ? "task" : "tasks"} found
            </p>
          </div>
        </div>

        {visibleTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✓</div>

            <h3>No tasks found</h3>

            <p>
              {search
                ? "Try changing your search."
                : "There are no tasks matching the selected filters."}
            </p>
          </div>
        ) : (
          <div className="task-list">
            {visibleTasks.map((task) => {
              const status = getStatus(task);

              const taskClassId = getId(task?.classId);

              const student = getName(task?.studentId, "Student");

              const teacher = getName(task?.teacherId, "Teacher");

              const isDeleting = deleteId === task?._id;

              return (
                <article key={task?._id} className="task-card">
                  {/* ========================================
                        TASK HEADER
                    ======================================== */}

                  <div className="task-card-header">
                    <div>
                      <h3>{task?.title || "Untitled Task"}</h3>

                      <span className={`task-status ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* ========================================
                        DESCRIPTION
                    ======================================== */}

                  <div className="task-description">
                    <p>{task?.description || "No description provided."}</p>
                  </div>

                  {/* ========================================
                        META
                    ======================================== */}

                  <div className="task-meta">
                    <div>
                      <span>Student</span>

                      <strong>{student}</strong>
                    </div>

                    <div>
                      <span>Teacher</span>

                      <strong>{teacher}</strong>
                    </div>

                    <div>
                      <span>Created</span>

                      <strong>{formatDate(task?.createdAt)}</strong>
                    </div>

                    <div>
                      <span>Subject / Class</span>

                      <strong>
                        {classes.find(
                          (item) => String(item?._id) === String(taskClassId),
                        )?.subject || "—"}
                      </strong>
                    </div>
                  </div>

                  {/* ========================================
                        PROOF
                    ======================================== */}

                  {task?.proofUrl && (
                    <div className="task-proof">
                      <span>Proof submitted</span>

                      <button
                        type="button"
                        onClick={() => {
                          const proofUrl = task.proofUrl.startsWith("http")
                            ? task.proofUrl
                            : `${SERVER_URL}${task.proofUrl}`;

                          setProofPreview(proofUrl);
                        }}
                      >
                        View Proof
                      </button>
                    </div>
                  )}

                  {/* ========================================
                        REVIEW
                    ======================================== */}

                  {task?.reviewStatus === "reviewed" && (
                    <div className="task-review">
                      <div>
                        <span>Rating</span>

                        <strong>
                          {task?.rating ? `${task.rating}/5` : "—"}
                        </strong>
                      </div>

                      {task?.teacherComment && (
                        <div>
                          <span>Teacher Comment</span>

                          <p>{task.teacherComment}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================
                        ACTIONS
                    ======================================== */}

                  <div className="task-actions">
                    {isStudent && !task?.completed && (
                      <span className="action-hint">
                        Submit proof to complete this task.
                      </span>
                    )}

                    {isTeacher && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(task?._id)}
                        disabled={actionLoading || isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ==================================================
          PROOF PREVIEW MODAL
      ================================================== */}

      {proofPreview && (
        <div className="proof-modal" onClick={() => setProofPreview(null)}>
          <div
            className="proof-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="proof-modal-close"
              onClick={() => setProofPreview(null)}
              aria-label="Close proof preview"
            >
              ×
            </button>

            {proofPreview.split("?")[0].toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={proofPreview}
                title="Proof PDF"
                className="proof-preview-pdf"
              />
            ) : (
              <img
                src={proofPreview}
                alt="Proof"
                className="proof-preview-image"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
