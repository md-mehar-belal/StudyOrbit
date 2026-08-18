import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";
import { useClasses } from "../../context/ClassContext";

import AddTask from "./AddTask";
import TaskStats from "./TaskStats";
import TaskItem from "./TaskItem";

// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(date) {
  if (!date) {
    return "Unknown Date";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown Date";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ======================================================
// GET OBJECT ID
// ======================================================

function getId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
}

// ======================================================
// GET DISPLAY NAME
// ======================================================

function getDisplayName(user, fallback = "Unknown") {
  if (!user) {
    return fallback;
  }

  if (typeof user === "object") {
    return (
      user.name || user.fullName || user.username || user.email || fallback
    );
  }

  return fallback;
}

// ======================================================
// TASK DETAILS
// ======================================================

function TaskDetails() {
  // ====================================================
  // AUTH
  // ====================================================

  const { user } = useAuth();

  const role = user?.role || "";

  const isTeacher = role === "teacher";
  const isStudent = role === "student";
  const isParent = role === "parent";

  // ====================================================
  // TASK CONTEXT
  // ====================================================

  const {
    tasks = [],
    loading = false,
    actionLoading = false,
    error: taskError,
    clearError,
    addTask,
    updateTask,
    deleteTask,
    completeWithProof,
    reviewTask,
    currentClassStats,
  } = useTasks();

  // ====================================================
  // CLASS CONTEXT
  // ====================================================

  const {
    classes = [],
    currentClass,
    loading: classLoading = false,
  } = useClasses();

  // ====================================================
  // FILTER STATES
  // ====================================================

  const [selectedClassId, setSelectedClassId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");

  // ====================================================
  // DELETE / UNDO
  // ====================================================

  const [deletedTask, setDeletedTask] = useState(null);

  const deleteTimerRef = useRef(null);

  // ====================================================
  // LOCAL ERROR
  // ====================================================

  const [localError, setLocalError] = useState("");

  // ====================================================
  // ACTIVE CLASSES
  // ====================================================

  const activeClasses = useMemo(() => {
    if (!Array.isArray(classes)) {
      return [];
    }

    return classes.filter(
      (classItem) => classItem && classItem._id && classItem.isActive !== false,
    );
  }, [classes]);

  // ====================================================
  // SELECTED CLASS
  // ====================================================

  const selectedClass = useMemo(() => {
    if (!selectedClassId) {
      return null;
    }

    return (
      activeClasses.find(
        (classItem) => String(classItem._id) === String(selectedClassId),
      ) || null
    );
  }, [activeClasses, selectedClassId]);

  // ====================================================
  // SYNC CURRENT CLASS
  // ====================================================

  useEffect(() => {
    if (!currentClass?._id || selectedClassId) {
      return;
    }

    const exists = activeClasses.some(
      (classItem) => String(classItem._id) === String(currentClass._id),
    );

    if (exists) {
      setSelectedClassId(String(currentClass._id));
    }
  }, [currentClass, activeClasses, selectedClassId]);

  // ====================================================
  // TEACHER STUDENTS
  // ====================================================

  const students = useMemo(() => {
    if (!isTeacher) {
      return [];
    }

    const studentMap = new Map();

    activeClasses.forEach((classItem) => {
      if (!Array.isArray(classItem.students)) {
        return;
      }

      classItem.students.forEach((student) => {
        if (!student) {
          return;
        }

        // Populated student object
        if (typeof student === "object") {
          const studentId = student._id || student.id;

          if (studentId) {
            studentMap.set(String(studentId), student);
          }

          return;
        }

        // ObjectId only
        const studentId = String(student);

        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            _id: studentId,
            name: "Student",
          });
        }
      });
    });

    return Array.from(studentMap.values());
  }, [activeClasses, isTeacher]);

  // ====================================================
  // CHECK TASK VISIBILITY
  // ====================================================

  const isTaskVisibleToUser = useMemo(() => {
    return (task) => {
      if (!task) {
        return false;
      }

      // ----------------------------------------------
      // TEACHER
      // ----------------------------------------------

      if (isTeacher) {
        const teacherId = getId(task.teacherId);

        if (teacherId && user?._id) {
          return String(teacherId) === String(user._id);
        }

        return true;
      }

      // ----------------------------------------------
      // STUDENT
      // ----------------------------------------------

      if (isStudent) {
        const studentId = getId(task.studentId);

        if (studentId && user?._id) {
          return String(studentId) === String(user._id);
        }

        return true;
      }

      // ----------------------------------------------
      // PARENT
      // ----------------------------------------------

      if (isParent) {
        return true;
      }

      return false;
    };
  }, [isTeacher, isStudent, isParent, user]);

  // ====================================================
  // USER TASKS
  // ====================================================

  const userTasks = useMemo(() => {
    if (!Array.isArray(tasks)) {
      return [];
    }

    return tasks.filter(isTaskVisibleToUser);
  }, [tasks, isTaskVisibleToUser]);

  // ====================================================
  // FILTER TASKS
  // ====================================================

  const filteredTasks = useMemo(() => {
    return userTasks.filter((task) => {
      // ----------------------------------------------
      // CLASS FILTER
      // ----------------------------------------------

      if (selectedClassId) {
        const taskClassId = getId(task.classId);

        if (taskClassId !== String(selectedClassId)) {
          return false;
        }
      }

      // ----------------------------------------------
      // STATUS FILTER
      // ----------------------------------------------

      if (statusFilter === "completed") {
        if (task.completed !== true) {
          return false;
        }
      }

      if (statusFilter === "pending") {
        if (task.completed === true) {
          return false;
        }
      }

      // ----------------------------------------------
      // REVIEW FILTER
      // ----------------------------------------------

      if (reviewFilter !== "all") {
        if (task.reviewStatus !== reviewFilter) {
          return false;
        }
      }

      return true;
    });
  }, [userTasks, selectedClassId, statusFilter, reviewFilter]);

  // ====================================================
  // GROUP TASKS BY DATE
  // ====================================================

  const groupedTasks = useMemo(() => {
    return filteredTasks.reduce((groups, task) => {
      const createdAt = task?.createdAt || new Date();

      const parsedDate = new Date(createdAt);

      const key = Number.isNaN(parsedDate.getTime())
        ? "Unknown Date"
        : parsedDate.toDateString();

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(task);

      return groups;
    }, {});
  }, [filteredTasks]);

  // ====================================================
  // SORT DATE GROUPS
  // ====================================================

  const sortedGroups = useMemo(() => {
    return Object.entries(groupedTasks).sort(([, tasksA], [, tasksB]) => {
      const dateA = new Date(tasksA[0]?.createdAt || 0).getTime();

      const dateB = new Date(tasksB[0]?.createdAt || 0).getTime();

      return dateB - dateA;
    });
  }, [groupedTasks]);

  // ====================================================
  // CLEANUP DELETE TIMER
  // ====================================================

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  // ====================================================
  // RESET CLASS FILTER
  // ====================================================

  useEffect(() => {
    if (!selectedClassId) {
      return;
    }

    const exists = activeClasses.some(
      (classItem) => String(classItem._id) === String(selectedClassId),
    );

    if (!exists) {
      setSelectedClassId("");
    }
  }, [activeClasses, selectedClassId]);

  // ====================================================
  // RESET REVIEW FILTER FOR STUDENT
  // ====================================================

  useEffect(() => {
    if (isStudent && reviewFilter !== "all") {
      setReviewFilter("all");
    }
  }, [isStudent, reviewFilter]);

  // ====================================================
  // ADD TASK
  // ====================================================

  const handleAddTask = async (title, description, classId, studentId) => {
    try {
      setLocalError("");

      return await addTask(title, description, classId, studentId);
    } catch (error) {
      console.error("Add task failed:", error);

      setLocalError(error?.message || "Failed to create assignment");

      throw error;
    }
  };

  // ====================================================
  // UPDATE TASK
  // ====================================================

  const handleUpdate = async (task, data) => {
    if (!isTeacher) {
      return;
    }

    try {
      setLocalError("");

      return await updateTask(task, data);
    } catch (error) {
      console.error("Update task failed:", error);

      setLocalError(error?.message || "Failed to update assignment");

      throw error;
    }
  };

  // ====================================================
  // DELETE TASK
  // ====================================================

  const handleDelete = (task) => {
    if (!isTeacher || !task?._id) {
      return;
    }

    // Clear previous timer
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
    }

    setDeletedTask(task);

    // Actual backend delete after 5 seconds
    deleteTimerRef.current = setTimeout(async () => {
      try {
        await deleteTask(task._id);
      } catch (error) {
        console.error("Delete task failed:", error);

        setLocalError(error?.message || "Failed to delete task");
      } finally {
        setDeletedTask(null);
        deleteTimerRef.current = null;
      }
    }, 5000);
  };

  // ====================================================
  // UNDO DELETE
  // ====================================================

  const handleUndo = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }

    setDeletedTask(null);
  };

  // ====================================================
  // COMPLETE TASK
  // ====================================================

  const handleComplete = async (taskId, file) => {
    if (!isStudent) {
      return;
    }

    try {
      setLocalError("");

      return await completeWithProof(taskId, file);
    } catch (error) {
      console.error("Complete task failed:", error);

      setLocalError(error?.message || "Failed to submit task");

      throw error;
    }
  };

  // ====================================================
  // REVIEW TASK
  // ====================================================

  const handleReview = async (taskId, rating, teacherComment) => {
    if (!isTeacher) {
      return;
    }

    try {
      setLocalError("");

      return await reviewTask(taskId, rating, teacherComment);
    } catch (error) {
      console.error("Review task failed:", error);

      setLocalError(error?.message || "Failed to review task");

      throw error;
    }
  };

  // ====================================================
  // GET CLASS NAME
  // ====================================================

  const getClassName = (task) => {
    // Populated class
    if (task?.classId && typeof task.classId === "object") {
      const subject = task.classId.subject;
      const name = task.classId.name;

      if (subject && name) {
        return `${subject} — ${name}`;
      }

      return subject || name || "Unknown Class";
    }

    // Find locally
    const foundClass = activeClasses.find(
      (classItem) => String(classItem._id) === String(getId(task?.classId)),
    );

    if (foundClass) {
      if (foundClass.subject && foundClass.name) {
        return `${foundClass.subject} — ${foundClass.name}`;
      }

      return foundClass.subject || foundClass.name || "Unknown Class";
    }

    return "Class";
  };

  // ====================================================
  // GET STUDENT NAME
  // ====================================================

  const getTaskStudentName = (task) => {
    if (!task?.studentId) {
      return "";
    }

    // Populated student
    if (typeof task.studentId === "object") {
      return getDisplayName(task.studentId, "Student");
    }

    // Find locally
    const student = students.find(
      (item) => String(item?._id || item?.id) === String(task.studentId),
    );

    return getDisplayName(student, "Student");
  };

  // ====================================================
  // EMPTY MESSAGE
  // ====================================================

  const getEmptyMessage = () => {
    if (isTeacher) {
      if (selectedClassId) {
        return "No assignments found for this subject.";
      }

      if (statusFilter !== "all" || reviewFilter !== "all") {
        return "No assignments match the selected filters.";
      }

      return "Create your first assignment above.";
    }

    if (isParent) {
      return "No student assignments are available.";
    }

    if (selectedClassId) {
      return "No assignments found for this subject.";
    }

    if (statusFilter !== "all") {
      return "No assignments match the selected status.";
    }

    return "No assignments have been assigned to you yet.";
  };

  // ====================================================
  // DISPLAY ERROR
  // ====================================================

  const displayError = localError || taskError;

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <>
      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="page-header">
        <div>
          <h1>
            {isParent
              ? "Student Tasks"
              : isTeacher
                ? "Assigned Tasks"
                : "My Tasks"}
          </h1>

          <p>
            {isParent
              ? "Monitor student assignments, progress, and completed work."
              : isTeacher
                ? "Create, manage, and review assignments for your students."
                : "Manage your assignments, read instructions, and submit proof."}
          </p>
        </div>
      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {displayError && (
        <div className="form-error" role="alert">
          <span>{displayError}</span>

          <button
            type="button"
            onClick={() => {
              setLocalError("");

              if (clearError) {
                clearError();
              }
            }}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {/* ==================================================
          TEACHER SECTION
      ================================================== */}

      {isTeacher && (
        <>
          {/* CREATE ASSIGNMENT */}

          {classLoading ? (
            <div className="empty-state">
              <h3>Loading classes...</h3>

              <p>Please wait while your subjects are loaded.</p>
            </div>
          ) : activeClasses.length === 0 ? (
            <div className="empty-state">
              <h3>No active classes</h3>

              <p>Create a subject/class before assigning assignments.</p>
            </div>
          ) : (
            <AddTask
              students={students}
              classes={activeClasses}
              onAdd={handleAddTask}
            />
          )}

          {/* TEACHER FILTERS */}

          {activeClasses.length > 0 && (
            <div className="task-filters">
              {/* SUBJECT FILTER */}

              <div className="filter-group">
                <label htmlFor="taskClassFilter">Subject / Class</label>

                <select
                  id="taskClassFilter"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">All Subjects</option>

                  {activeClasses.map((classItem) => (
                    <option key={classItem._id} value={classItem._id}>
                      {classItem.subject
                        ? `${classItem.subject} — ${classItem.name}`
                        : classItem.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* STATUS FILTER */}

              <div className="filter-group">
                <label htmlFor="taskStatusFilter">Status</label>

                <select
                  id="taskStatusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* REVIEW FILTER */}

              <div className="filter-group">
                <label htmlFor="taskReviewFilter">Review</label>

                <select
                  id="taskReviewFilter"
                  value={reviewFilter}
                  onChange={(e) => setReviewFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="reviewed">Reviewed</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================================================
          STUDENT FILTERS
      ================================================== */}

      {isStudent && activeClasses.length > 0 && (
        <div className="task-filters">
          {/* SUBJECT */}

          <div className="filter-group">
            <label htmlFor="studentSubjectFilter">Subject / Class</label>

            <select
              id="studentSubjectFilter"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">All Subjects</option>

              {activeClasses.map((classItem) => (
                <option key={classItem._id} value={classItem._id}>
                  {classItem.subject
                    ? `${classItem.subject} — ${classItem.name}`
                    : classItem.name}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS */}

          <div className="filter-group">
            <label htmlFor="studentStatusFilter">Status</label>

            <select
              id="studentStatusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      )}

      {/* ==================================================
          SELECTED CLASS INFO
      ================================================== */}

      {selectedClass && (
        <div className="selected-class-banner">
          <div>
            <span>Subject</span>

            <strong>{selectedClass.subject || "N/A"}</strong>
          </div>

          <div>
            <span>Class</span>

            <strong>{selectedClass.name || "N/A"}</strong>
          </div>

          <div>
            <span>Students</span>

            <strong>
              {Array.isArray(selectedClass.students)
                ? selectedClass.students.length
                : 0}
            </strong>
          </div>
        </div>
      )}

      {/* ==================================================
          STATISTICS
      ================================================== */}

      <TaskStats tasks={filteredTasks} />

      {/* ==================================================
          CURRENT CLASS STATS
      ================================================== */}

      {selectedClass && currentClassStats && filteredTasks.length > 0 && (
        <div className="task-summary">
          <div className="class-info-row">
            <span>Subject</span>

            <strong>{selectedClass.subject || selectedClass.name}</strong>
          </div>

          <div className="class-info-row">
            <span>Total Tasks</span>

            <strong>{currentClassStats.total ?? 0}</strong>
          </div>

          <div className="class-info-row">
            <span>Completed</span>

            <strong>{currentClassStats.completed ?? 0}</strong>
          </div>

          <div className="class-info-row">
            <span>Pending</span>

            <strong>{currentClassStats.pending ?? 0}</strong>
          </div>
        </div>
      )}

      {/* ==================================================
          LOADING
      ================================================== */}

      {loading ? (
        <div className="empty-state">
          <h3>Loading tasks...</h3>

          <p>Please wait while your assignments are loaded.</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        /* EMPTY STATE */
        <div className="empty-state">
          <h3>No tasks found</h3>

          <p>{getEmptyMessage()}</p>
        </div>
      ) : (
        /* TASK GROUPS */
        <div className="task-groups">
          {sortedGroups.map(([date, dateTasks]) => (
            <section className="date-group" key={date}>
              {/* DATE HEADING */}

              <div className="date-heading">
                <span>{formatDate(dateTasks[0]?.createdAt)}</span>

                <span>
                  {dateTasks.length} {dateTasks.length === 1 ? "Task" : "Tasks"}
                </span>
              </div>

              {/* TASK LIST */}

              <div className="task-list">
                {dateTasks.map((task) => (
                  <div className="task-wrapper" key={task._id}>
                    {/* SUBJECT / CLASS */}

                    <div className="task-class-label">{getClassName(task)}</div>

                    {/* STUDENT */}

                    {isTeacher && (
                      <div className="task-student-label">
                        Student: <strong>{getTaskStudentName(task)}</strong>
                      </div>
                    )}

                    {/* TASK ITEM */}

                    <TaskItem
                      task={task}
                      readOnly={isParent}
                      onUpdate={isTeacher ? handleUpdate : undefined}
                      onDelete={isTeacher ? handleDelete : undefined}
                      onComplete={isStudent ? handleComplete : undefined}
                      onReview={isTeacher ? handleReview : undefined}
                      loading={actionLoading}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ==================================================
          UNDO DELETE POPUP
      ================================================== */}

      {deletedTask && isTeacher && (
        <div className="undo-popup" role="status">
          <div>
            <strong>Task deleted</strong>

            <span> You have 5 seconds to undo.</span>
          </div>

          <button type="button" onClick={handleUndo}>
            Undo
          </button>
        </div>
      )}
    </>
  );
}

export default TaskDetails;
