import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { taskApi } from "../api/api";

import { useAuth } from "./AuthContext";

import { useClasses } from "./ClassContext";

// ======================================================
// CONTEXT
// ======================================================

const TaskContext = createContext(null);

// ======================================================
// PROVIDER
// ======================================================

export function TaskProvider({ children }) {
  // ====================================================
  // AUTH
  // ====================================================

  const { user, token } = useAuth();

  // ====================================================
  // CLASS CONTEXT
  // ====================================================
  //
  // Current selected subject/class.
  //
  // Example:
  //
  // DBMS -> currentClass
  //
  // Then TaskDetails can show only
  // DBMS tasks.

  const { currentClass, classes = [] } = useClasses();

  // ====================================================
  // TASKS
  // ====================================================

  const [tasks, setTasks] = useState([]);

  // ====================================================
  // DELETED TASKS
  // ====================================================

  const [deletedTasks, setDeletedTasks] = useState([]);

  // ====================================================
  // LOADING
  // ====================================================

  const [loading, setLoading] = useState(false);

  // ====================================================
  // ACTION LOADING
  // ====================================================
  //
  // Create / update / delete / submit / review
  // ke waqt useful.

  const [actionLoading, setActionLoading] = useState(false);

  // ====================================================
  // ERROR
  // ====================================================

  const [error, setError] = useState("");

  // ====================================================
  // CLEAR ERROR
  // ====================================================

  const clearError = useCallback(() => {
    setError("");
  }, []);

  // ====================================================
  // RESET TASK STATE
  // ====================================================

  const resetTasks = useCallback(() => {
    setTasks([]);

    setDeletedTasks([]);

    setError("");

    setLoading(false);

    setActionLoading(false);
  }, []);

  // ====================================================
  // NORMALIZE TASK LIST
  // ====================================================

  const normalizeTaskList = useCallback((data) => {
    // ----------------------------------------------
    // Direct array
    // ----------------------------------------------

    if (Array.isArray(data)) {
      return data;
    }

    // ----------------------------------------------
    // { tasks: [] }
    // ----------------------------------------------

    if (Array.isArray(data?.tasks)) {
      return data.tasks;
    }

    // ----------------------------------------------
    // { data: [] }
    // ----------------------------------------------

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    // ----------------------------------------------
    // { data: { tasks: [] } }
    // ----------------------------------------------

    if (Array.isArray(data?.data?.tasks)) {
      return data.data.tasks;
    }

    return [];
  }, []);

  // ====================================================
  // NORMALIZE SINGLE TASK
  // ====================================================

  const normalizeTask = useCallback((data) => {
    // ----------------------------------------------
    // { task: {...} }
    // ----------------------------------------------

    if (data?.task) {
      return data.task;
    }

    // ----------------------------------------------
    // { data: { task: {...} } }
    // ----------------------------------------------

    if (data?.data?.task) {
      return data.data.task;
    }

    // ----------------------------------------------
    // { data: {...task} }
    // ----------------------------------------------

    if (data?.data?._id) {
      return data.data;
    }

    // ----------------------------------------------
    // Direct task
    // ----------------------------------------------

    if (data?._id) {
      return data;
    }

    return null;
  }, []);

  // ====================================================
  // GET ID FROM RELATION
  // ====================================================
  //
  // Backend populated object:
  //
  // classId: {
  //   _id: "..."
  // }
  //
  // OR direct ObjectId:
  //
  // classId: "..."

  const getRelationId = useCallback((value) => {
    if (!value) {
      return null;
    }

    if (typeof value === "object") {
      return value._id || value.id || null;
    }

    return value;
  }, []);

  // ====================================================
  // SORT TASKS
  // ====================================================

  const sortTasks = useCallback((taskList) => {
    if (!Array.isArray(taskList)) {
      return [];
    }

    return [...taskList].sort((a, b) => {
      const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;

      const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;

      return dateB - dateA;
    });
  }, []);

  // ====================================================
  // MERGE TASK
  // ====================================================

  const mergeTask = useCallback(
    (task) => {
      if (!task?._id) {
        return;
      }

      setTasks((previousTasks) => {
        const exists = previousTasks.some((item) => item?._id === task._id);

        if (exists) {
          return sortTasks(
            previousTasks.map((item) => (item?._id === task._id ? task : item)),
          );
        }

        return sortTasks([task, ...previousTasks]);
      });
    },
    [sortTasks],
  );

  // ====================================================
  // REPLACE TASK
  // ====================================================

  const replaceTask = useCallback((updatedTask) => {
    if (!updatedTask?._id) {
      return;
    }

    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task?._id === updatedTask._id ? updatedTask : task,
      ),
    );
  }, []);

  // ====================================================
  // REMOVE TASK
  // ====================================================

  const removeTask = useCallback((taskId) => {
    if (!taskId) {
      return;
    }

    setTasks((previousTasks) =>
      previousTasks.filter((task) => task?._id !== taskId),
    );
  }, []);

  // ====================================================
  // FETCH ACTIVE TASKS
  // ====================================================

  const fetchTasks = useCallback(async () => {
    if (!token || !user) {
      setTasks([]);

      return [];
    }

    try {
      setLoading(true);

      setError("");

      const data = await taskApi.getAll(token);

      const taskList = normalizeTaskList(data);

      const sortedTasks = sortTasks(taskList);

      setTasks(sortedTasks);

      return sortedTasks;
    } catch (error) {
      console.error("Fetch tasks error:", error);

      const message = error?.message || "Failed to fetch tasks";

      setError(message);

      setTasks([]);

      throw error;
    } finally {
      setLoading(false);
    }
  }, [token, user, normalizeTaskList, sortTasks]);

  // ====================================================
  // FETCH DELETED TASKS
  // ====================================================

  const fetchDeletedTasks = useCallback(async () => {
    if (!token || !user) {
      setDeletedTasks([]);

      return [];
    }

    try {
      setError("");

      const data = await taskApi.getDeleted(token);

      const deletedList = normalizeTaskList(data);

      setDeletedTasks(sortTasks(deletedList));

      return deletedList;
    } catch (error) {
      console.error("Fetch deleted tasks error:", error);

      const message = error?.message || "Failed to fetch deleted tasks";

      setError(message);

      setDeletedTasks([]);

      throw error;
    }
  }, [token, user, normalizeTaskList, sortTasks]);

  // ====================================================
  // LOAD TASKS AFTER LOGIN
  // ====================================================

  useEffect(() => {
    let cancelled = false;

    const loadTaskData = async () => {
      if (!token || !user) {
        resetTasks();

        return;
      }

      try {
        setLoading(true);

        setError("");

        // ==========================================
        // ACTIVE TASKS
        // ==========================================

        const activeData = await taskApi.getAll(token);

        if (cancelled) {
          return;
        }

        const activeTasks = normalizeTaskList(activeData);

        setTasks(sortTasks(activeTasks));

        // ==========================================
        // DELETED TASKS
        // ==========================================

        try {
          const deletedData = await taskApi.getDeleted(token);

          if (cancelled) {
            return;
          }

          const deletedList = normalizeTaskList(deletedData);

          setDeletedTasks(sortTasks(deletedList));
        } catch (deletedError) {
          // ----------------------------------------
          // Deleted history failure should not
          // destroy active task data.
          // ----------------------------------------

          console.warn(
            "Deleted task history could not be loaded:",
            deletedError,
          );

          setDeletedTasks([]);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Load task data error:", error);

        setError(error?.message || "Failed to load tasks");

        setTasks([]);

        setDeletedTasks([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTaskData();

    return () => {
      cancelled = true;
    };
  }, [token, user, resetTasks, normalizeTaskList, sortTasks]);

  // ====================================================
  // ADD TASK
  // ====================================================
  //
  // Teacher only.
  //
  // Required:
  //
  // title
  // description
  // classId
  // studentId
  //
  // Relationship:
  //
  // Teacher
  //    ↓
  // Class / Subject
  //    ↓
  // Student
  //    ↓
  // Task

  const addTask = useCallback(
    async (title, description, classId, studentId) => {
      try {
        setError("");

        // ==============================================
        // AUTH
        // ==============================================

        if (!token) {
          throw new Error("Authentication required");
        }

        if (!user) {
          throw new Error("User information is unavailable");
        }

        // ==============================================
        // ROLE
        // ==============================================

        if (user.role !== "teacher") {
          throw new Error("Only teachers can create tasks");
        }

        // ==============================================
        // TITLE
        // ==============================================

        const cleanTitle = typeof title === "string" ? title.trim() : "";

        if (!cleanTitle) {
          throw new Error("Task heading is required");
        }

        if (cleanTitle.length > 200) {
          throw new Error("Task heading cannot exceed 200 characters");
        }

        // ==============================================
        // DESCRIPTION
        // ==============================================

        const cleanDescription =
          typeof description === "string" ? description.trim() : "";

        if (!cleanDescription) {
          throw new Error("Task description is required");
        }

        // ==============================================
        // CLASS
        // ==============================================

        if (!classId) {
          throw new Error("Please select a subject/class");
        }

        // ==============================================
        // VERIFY CLASS
        // ==============================================

        const selectedClass = classes.find(
          (classItem) => String(classItem?._id) === String(classId),
        );

        if (!selectedClass) {
          throw new Error("Selected class was not found");
        }

        // ==============================================
        // ACTIVE CLASS
        // ==============================================

        if (selectedClass.isActive === false) {
          throw new Error("This class is inactive");
        }

        // ==============================================
        // TEACHER OWNERSHIP
        // ==============================================
        //
        // Frontend safety check.
        //
        // Backend must ALSO verify this.

        const classTeacherId = getRelationId(selectedClass.teacherId);

        if (
          classTeacherId &&
          user?._id &&
          String(classTeacherId) !== String(user._id)
        ) {
          throw new Error("You can only create tasks for your own classes");
        }

        // ==============================================
        // STUDENT
        // ==============================================

        if (!studentId) {
          throw new Error("Please select a student");
        }

        // ==============================================
        // VERIFY STUDENT BELONGS TO CLASS
        // ==============================================
        //
        // Important:
        //
        // Teacher should not assign DBMS task
        // to a student who is not enrolled in DBMS.

        if (Array.isArray(selectedClass.students)) {
          const studentBelongsToClass = selectedClass.students.some(
            (student) => String(getRelationId(student)) === String(studentId),
          );

          if (!studentBelongsToClass) {
            throw new Error("Selected student is not enrolled in this class");
          }
        }

        // ==============================================
        // CREATE TASK
        // ==============================================

        setActionLoading(true);

        const response = await taskApi.create(
          token,
          cleanTitle,
          cleanDescription,
          classId,
          studentId,
        );

        const newTask = normalizeTask(response);

        if (!newTask) {
          throw new Error("Task was created but task data was not returned");
        }

        // ==============================================
        // LOCAL UPDATE
        // ==============================================

        mergeTask(newTask);

        return newTask;
      } catch (error) {
        console.error("Add task error:", error);

        setError(error?.message || "Failed to create task");

        throw error;
      } finally {
        setActionLoading(false);
      }
    },
    [token, user, classes, getRelationId, normalizeTask, mergeTask],
  );

  // ====================================================
  // UPDATE TASK
  // ====================================================
  //
  // Teacher can update:
  //
  // title
  // description
  //
  // classId/studentId intentionally
  // change nahi honge.

  const updateTask = useCallback(
    async (task, data) => {
      try {
        setError("");

        // ==========================================
        // AUTH
        // ==========================================

        if (!token) {
          throw new Error("Authentication required");
        }

        if (!user) {
          throw new Error("User information is unavailable");
        }

        // ==========================================
        // TEACHER
        // ==========================================

        if (user.role !== "teacher") {
          throw new Error("Only teachers can update tasks");
        }

        // ==========================================
        // TASK
        // ==========================================

        if (!task?._id) {
          throw new Error("Task ID is required");
        }

        // ==========================================
        // DATA
        // ==========================================

        if (!data || typeof data !== "object") {
          throw new Error("Task update data is required");
        }

        const updateData = {};

        // ==========================================
        // TITLE
        // ==========================================

        if (Object.prototype.hasOwnProperty.call(data, "title")) {
          const cleanTitle =
            typeof data.title === "string" ? data.title.trim() : "";

          if (!cleanTitle) {
            throw new Error("Task heading is required");
          }

          if (cleanTitle.length > 200) {
            throw new Error("Task heading cannot exceed 200 characters");
          }

          updateData.title = cleanTitle;
        }

        // ==========================================
        // DESCRIPTION
        // ==========================================

        if (Object.prototype.hasOwnProperty.call(data, "description")) {
          const cleanDescription =
            typeof data.description === "string" ? data.description.trim() : "";

          if (!cleanDescription) {
            throw new Error("Task description is required");
          }

          updateData.description = cleanDescription;
        }

        // ==========================================
        // NO CHANGES
        // ==========================================

        if (Object.keys(updateData).length === 0) {
          throw new Error("No task changes were provided");
        }

        setActionLoading(true);

        // ==========================================
        // API
        // ==========================================

        const response = await taskApi.update(token, task._id, updateData);

        const updatedTask = normalizeTask(response);

        if (!updatedTask) {
          throw new Error("Updated task data was not returned");
        }

        // ==========================================
        // UPDATE LOCAL
        // ==========================================

        replaceTask(updatedTask);

        return updatedTask;
      } catch (error) {
        console.error("Update task error:", error);

        setError(error?.message || "Failed to update task");

        throw error;
      } finally {
        setActionLoading(false);
      }
    },
    [token, user, normalizeTask, replaceTask],
  );

  // ====================================================
  // COMPLETE TASK + PROOF
  // ====================================================
  //
  // Student only.
  //
  // Student:
  //
  // pending
  //    ↓
  // upload proof
  //    ↓
  // completed = true
  //    ↓
  // submitted
  //
  // Backend should control actual status.

  const completeWithProof = useCallback(
    async (taskId, file) => {
      try {
        setError("");

        // ==========================================
        // AUTH
        // ==========================================

        if (!token) {
          throw new Error("Authentication required");
        }

        if (!user) {
          throw new Error("User information is unavailable");
        }

        // ==========================================
        // STUDENT
        // ==========================================

        if (user.role !== "student") {
          throw new Error("Only students can complete tasks");
        }

        // ==========================================
        // TASK
        // ==========================================

        if (!taskId) {
          throw new Error("Task ID is required");
        }

        const existingTask = tasks.find(
          (task) => String(task?._id) === String(taskId),
        );

        // ==========================================
        // ALREADY COMPLETED
        // ==========================================

        if (existingTask?.completed) {
          throw new Error("This task has already been completed");
        }

        // ==========================================
        // FILE
        // ==========================================

        if (!file) {
          throw new Error("Please select an image");
        }

        // ==========================================
        // IMAGE TYPE
        // ==========================================

        if (!file.type || !file.type.startsWith("image/")) {
          throw new Error("Only image files are allowed");
        }

        // ==========================================
        // SIZE
        // ==========================================

        const maxFileSize = 5 * 1024 * 1024;

        if (file.size > maxFileSize) {
          throw new Error("Image size must be less than 5 MB");
        }

        setActionLoading(true);

        // ==========================================
        // API
        // ==========================================

        const response = await taskApi.completeWithProof(token, taskId, file);

        const updatedTask = normalizeTask(response);

        if (!updatedTask) {
          throw new Error("Completed task data was not returned");
        }

        // ==========================================
        // LOCAL UPDATE
        // ==========================================

        replaceTask(updatedTask);

        return updatedTask;
      } catch (error) {
        console.error("Complete task error:", error);

        setError(error?.message || "Failed to complete task");

        throw error;
      } finally {
        setActionLoading(false);
      }
    },
    [token, user, tasks, normalizeTask, replaceTask],
  );

  // ====================================================
  // REVIEW TASK
  // ====================================================
  //
  // Teacher:
  //
  // rating: 1 - 5
  // teacherComment
  //
  // submitted → reviewed

  const reviewTask = useCallback(
    async (taskId, rating, teacherComment = "") => {
      try {
        setError("");

        // ==========================================
        // AUTH
        // ==========================================

        if (!token) {
          throw new Error("Authentication required");
        }

        if (!user) {
          throw new Error("User information is unavailable");
        }

        // ==========================================
        // TEACHER
        // ==========================================

        if (user.role !== "teacher") {
          throw new Error("Only teachers can review tasks");
        }

        // ==========================================
        // TASK
        // ==========================================

        if (!taskId) {
          throw new Error("Task ID is required");
        }

        // ==========================================
        // FIND TASK
        // ==========================================

        const existingTask = tasks.find(
          (task) => String(task?._id) === String(taskId),
        );

        if (existingTask && existingTask.reviewStatus !== "submitted") {
          throw new Error("Only submitted tasks can be reviewed");
        }

        // ==========================================
        // RATING
        // ==========================================

        const numericRating = Number(rating);

        if (
          !Number.isInteger(numericRating) ||
          numericRating < 1 ||
          numericRating > 5
        ) {
          throw new Error("Rating must be between 1 and 5");
        }

        // ==========================================
        // COMMENT
        // ==========================================

        const comment =
          typeof teacherComment === "string" ? teacherComment.trim() : "";

        if (comment.length > 1000) {
          throw new Error("Teacher comment cannot exceed 1000 characters");
        }

        setActionLoading(true);

        // ==========================================
        // API
        // ==========================================

        const response = await taskApi.review(
          token,
          taskId,
          numericRating,
          comment,
        );

        const updatedTask = normalizeTask(response);

        if (!updatedTask) {
          throw new Error("Reviewed task data was not returned");
        }

        // ==========================================
        // LOCAL UPDATE
        // ==========================================

        replaceTask(updatedTask);

        return updatedTask;
      } catch (error) {
        console.error("Review task error:", error);

        setError(error?.message || "Failed to review task");

        throw error;
      } finally {
        setActionLoading(false);
      }
    },
    [token, user, tasks, normalizeTask, replaceTask],
  );

  // ====================================================
  // DELETE TASK
  // ====================================================
  //
  // Teacher only.
  //
  // Backend should create DeletedTask
  // before deleting original task.

  const deleteTask = useCallback(
    async (taskId) => {
      try {
        setError("");

        // ==========================================
        // AUTH
        // ==========================================

        if (!token) {
          throw new Error("Authentication required");
        }

        if (!user) {
          throw new Error("User information is unavailable");
        }

        // ==========================================
        // TEACHER
        // ==========================================

        if (user.role !== "teacher") {
          throw new Error("Only teachers can delete tasks");
        }

        // ==========================================
        // TASK
        // ==========================================

        if (!taskId) {
          throw new Error("Task ID is required");
        }

        setActionLoading(true);

        // ==========================================
        // DELETE API
        // ==========================================

        await taskApi.delete(token, taskId);

        // ==========================================
        // REMOVE ACTIVE TASK
        // ==========================================

        removeTask(taskId);

        // ==========================================
        // REFRESH DELETED HISTORY
        // ==========================================

        try {
          await fetchDeletedTasks();
        } catch (historyError) {
          console.warn("Deleted task history refresh failed:", historyError);
        }

        return true;
      } catch (error) {
        console.error("Delete task error:", error);

        setError(error?.message || "Failed to delete task");

        throw error;
      } finally {
        setActionLoading(false);
      }
    },
    [token, user, removeTask, fetchDeletedTasks],
  );

  // ====================================================
  // GET TASKS BY CLASS
  // ====================================================
  //
  // DBMS select:
  //
  // only DBMS tasks.
  //
  // Java select:
  //
  // only Java tasks.

  const getTasksByClass = useCallback(
    (classId) => {
      if (!classId) {
        return [];
      }

      return tasks.filter((task) => {
        const taskClassId = getRelationId(task.classId);

        return String(taskClassId) === String(classId);
      });
    },
    [tasks, getRelationId],
  );

  // ====================================================
  // GET CURRENT CLASS TASKS
  // ====================================================

  const getCurrentClassTasks = useCallback(() => {
    if (!currentClass?._id) {
      return [];
    }

    return getTasksByClass(currentClass._id);
  }, [currentClass, getTasksByClass]);

  // ====================================================
  // GET TASKS BY STUDENT
  // ====================================================
  //
  // Teacher ke liye useful.
  //
  // Ek student ke multiple subjects
  // ke tasks milenge.

  const getTasksByStudent = useCallback(
    (studentId) => {
      if (!studentId) {
        return [];
      }

      return tasks.filter((task) => {
        const taskStudentId = getRelationId(task.studentId);

        return String(taskStudentId) === String(studentId);
      });
    },
    [tasks, getRelationId],
  );

  // ====================================================
  // GET TASKS BY STUDENT + CLASS
  // ====================================================
  //
  // Example:
  //
  // Student A + DBMS
  //
  // only DBMS tasks for Student A.

  const getTasksByStudentAndClass = useCallback(
    (studentId, classId) => {
      if (!studentId || !classId) {
        return [];
      }

      return tasks.filter((task) => {
        const taskStudentId = getRelationId(task.studentId);

        const taskClassId = getRelationId(task.classId);

        return (
          String(taskStudentId) === String(studentId) &&
          String(taskClassId) === String(classId)
        );
      });
    },
    [tasks, getRelationId],
  );

  // ====================================================
  // GET TASKS BY TEACHER
  // ====================================================

  const getTasksByTeacher = useCallback(
    (teacherId) => {
      if (!teacherId) {
        return [];
      }

      return tasks.filter((task) => {
        const taskTeacherId = getRelationId(task.teacherId);

        return String(taskTeacherId) === String(teacherId);
      });
    },
    [tasks, getRelationId],
  );

  // ====================================================
  // GET TASKS BY REVIEW STATUS
  // ====================================================

  const getTasksByReviewStatus = useCallback(
    (reviewStatus) => {
      if (!reviewStatus) {
        return [];
      }

      return tasks.filter((task) => task.reviewStatus === reviewStatus);
    },
    [tasks],
  );

  // ====================================================
  // GET PENDING REVIEW TASKS
  // ====================================================
  //
  // Teacher dashboard ke liye.
  //
  // completed = true
  // reviewStatus = submitted

  const getPendingReviewTasks = useCallback(() => {
    return tasks.filter(
      (task) => task.completed === true && task.reviewStatus === "submitted",
    );
  }, [tasks]);

  // ====================================================
  // GET COMPLETED TASKS
  // ====================================================

  const getCompletedTasks = useCallback(() => {
    return tasks.filter((task) => task.completed === true);
  }, [tasks]);

  // ====================================================
  // GET PENDING TASKS
  // ====================================================

  const getPendingTasks = useCallback(() => {
    return tasks.filter((task) => task.completed !== true);
  }, [tasks]);

  // ====================================================
  // GET REVIEWED TASKS
  // ====================================================

  const getReviewedTasks = useCallback(() => {
    return tasks.filter((task) => task.reviewStatus === "reviewed");
  }, [tasks]);

  // ====================================================
  // GET SUBMITTED TASKS
  // ====================================================

  const getSubmittedTasks = useCallback(() => {
    return tasks.filter((task) => task.reviewStatus === "submitted");
  }, [tasks]);

  // ====================================================
  // CURRENT CLASS TASK COUNTS
  // ====================================================

  const currentClassStats = useMemo(() => {
    const classTasks = currentClass?._id
      ? getTasksByClass(currentClass._id)
      : [];

    const total = classTasks.length;

    const completed = classTasks.filter(
      (task) => task.completed === true,
    ).length;

    const pending = total - completed;

    const submitted = classTasks.filter(
      (task) => task.reviewStatus === "submitted",
    ).length;

    const reviewed = classTasks.filter(
      (task) => task.reviewStatus === "reviewed",
    ).length;

    return {
      total,
      completed,
      pending,
      submitted,
      reviewed,
    };
  }, [currentClass, getTasksByClass]);

  // ====================================================
  // ALL TASK STATS
  // ====================================================

  const taskStats = useMemo(() => {
    const total = tasks.length;

    const completed = tasks.filter((task) => task.completed === true).length;

    const pending = total - completed;

    const submitted = tasks.filter(
      (task) => task.reviewStatus === "submitted",
    ).length;

    const reviewed = tasks.filter(
      (task) => task.reviewStatus === "reviewed",
    ).length;

    return {
      total,
      completed,
      pending,
      submitted,
      reviewed,
    };
  }, [tasks]);

  // ====================================================
  // CONTEXT VALUE
  // ====================================================

  const contextValue = useMemo(
    () => ({
      // ==============================================
      // DATA
      // ==============================================

      tasks,

      deletedTasks,

      // ==============================================
      // CLASS DATA
      // ==============================================

      currentClass,

      classes,

      // ==============================================
      // STATE
      // ==============================================

      loading,

      actionLoading,

      error,

      // ==============================================
      // TASK OPERATIONS
      // ==============================================

      addTask,

      updateTask,

      completeWithProof,

      reviewTask,

      deleteTask,

      // ==============================================
      // FETCH
      // ==============================================

      fetchTasks,

      fetchDeletedTasks,

      // ==============================================
      // FILTERS
      // ==============================================

      getTasksByClass,

      getCurrentClassTasks,

      getTasksByStudent,

      getTasksByStudentAndClass,

      getTasksByTeacher,

      getTasksByReviewStatus,

      // ==============================================
      // STATUS FILTERS
      // ==============================================

      getPendingReviewTasks,

      getCompletedTasks,

      getPendingTasks,

      getReviewedTasks,

      getSubmittedTasks,

      // ==============================================
      // STATISTICS
      // ==============================================

      currentClassStats,

      taskStats,

      // ==============================================
      // ERROR
      // ==============================================

      clearError,

      // ==============================================
      // RESET
      // ==============================================

      resetTasks,
    }),
    [
      tasks,
      deletedTasks,
      currentClass,
      classes,
      loading,
      actionLoading,
      error,
      addTask,
      updateTask,
      completeWithProof,
      reviewTask,
      deleteTask,
      fetchTasks,
      fetchDeletedTasks,
      getTasksByClass,
      getCurrentClassTasks,
      getTasksByStudent,
      getTasksByStudentAndClass,
      getTasksByTeacher,
      getTasksByReviewStatus,
      getPendingReviewTasks,
      getCompletedTasks,
      getPendingTasks,
      getReviewedTasks,
      getSubmittedTasks,
      currentClassStats,
      taskStats,
      clearError,
      resetTasks,
    ],
  );

  // ====================================================
  // PROVIDER
  // ====================================================

  return (
    <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>
  );
}

// ======================================================
// CUSTOM HOOK
// ======================================================

export function useTasks() {
  const context = useContext(TaskContext);

  if (!context) {
    throw new Error("useTasks must be used inside TaskProvider");
  }

  return context;
}
