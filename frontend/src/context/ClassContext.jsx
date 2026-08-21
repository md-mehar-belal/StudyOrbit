import { createContext, useContext, useEffect, useState } from "react";

import { classApi } from "../api/api";
import { useAuth } from "./AuthContext";

// ======================================================
// CONTEXT
// ======================================================

const ClassContext = createContext(null);

// ======================================================
// NORMALIZE SINGLE CLASS
// ======================================================

function normalizeClass(data) {
  if (!data) {
    return null;
  }

  const classData = data?.class || data?.data || data;

  if (!classData) {
    return null;
  }

  // -----------------------------------------------
  // IMPORTANT:
  // Backend should return _id.
  // id is kept only for backward compatibility.
  // -----------------------------------------------

  const normalizedId = classData._id || classData.id || null;

  return {
    ...classData,

    _id: normalizedId,

    name: classData.name || "",

    subject: classData.subject || "",

    classCode: classData.classCode || "",

    teacherId: classData.teacherId || null,

    students: Array.isArray(classData.students) ? classData.students : [],

    isActive: classData.isActive !== false,

    maxStudents: Number(classData.maxStudents) || 100,
  };
}

// ======================================================
// NORMALIZE MULTIPLE CLASSES
// ======================================================

function normalizeClasses(data) {
  let list = [];

  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(data?.classes)) {
    list = data.classes;
  } else if (Array.isArray(data?.data)) {
    list = data.data;
  }

  return list.map(normalizeClass).filter((classItem) => classItem?._id);
}

// ======================================================
// PROVIDER
// ======================================================

export function ClassProvider({ children }) {
  const { user, token } = useAuth();

  const [classes, setClasses] = useState([]);

  const [currentClass, setCurrentClass] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ====================================================
  // CLEAR ERROR
  // ====================================================

  const clearError = () => {
    setError("");
  };

  // ====================================================
  // AUTO CLEAR ERROR AFTER 5 SECONDS
  // ====================================================

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [error]);

  // ====================================================
  // ADD / UPDATE CLASS
  // ====================================================

  const mergeClassIntoList = (classData) => {
    const normalized = normalizeClass(classData);

    if (!normalized?._id) {
      return null;
    }

    setClasses((previousClasses) => {
      const exists = previousClasses.some(
        (item) => item?._id === normalized._id,
      );

      if (exists) {
        return previousClasses.map((item) =>
          item?._id === normalized._id ? normalized : item,
        );
      }

      return [normalized, ...previousClasses];
    });

    return normalized;
  };

  // ====================================================
  // GET ALL CLASSES
  // ====================================================

  const fetchClasses = async () => {
    if (!token || !user) {
      setClasses([]);
      setCurrentClass(null);
      return [];
    }

    try {
      setLoading(true);
      setError("");

      const data = await classApi.getAll(token);

      const receivedClasses = normalizeClasses(data);

      setClasses(receivedClasses);

      // -----------------------------------------------
      // Maintain selected class
      // -----------------------------------------------

      setCurrentClass((previousClass) => {
        if (previousClass?._id) {
          const stillExists = receivedClasses.find(
            (item) => item?._id === previousClass._id,
          );

          if (stillExists) {
            return stillExists;
          }
        }

        return receivedClasses[0] || null;
      });

      return receivedClasses;
    } catch (error) {
      console.error("Fetch classes error:", error);

      setError(error?.message || "Failed to fetch classes");

      return [];
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // GET CLASS BY ID
  // ====================================================

  const fetchClassById = async (classId) => {
    if (!token || !user) {
      throw new Error("Authentication required");
    }

    if (!classId) {
      throw new Error("Class ID is required");
    }

    try {
      setLoading(true);
      setError("");

      const data = await classApi.getById(token, classId);

      const selectedClass = normalizeClass(data);

      if (!selectedClass?._id) {
        throw new Error("Class data was not returned");
      }

      setCurrentClass(selectedClass);

      mergeClassIntoList(selectedClass);

      return selectedClass;
    } catch (error) {
      console.error("Fetch class error:", error);

      setError(error?.message || "Failed to fetch class");

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // SELECT CLASS
  // ====================================================

  const selectClass = (classId) => {
    if (!classId) {
      setCurrentClass(null);
      return null;
    }

    const selectedClass = classes.find((item) => item?._id === classId);

    if (!selectedClass) {
      setError("Selected class was not found");

      return null;
    }

    setCurrentClass(selectedClass);

    return selectedClass;
  };

  // ====================================================
  // CREATE CLASS
  // ====================================================

  const createClass = async (name, subject) => {
    try {
      setError("");

      if (!token) {
        throw new Error("Authentication required");
      }

      if (user?.role !== "teacher") {
        throw new Error("Only teachers can create classes");
      }

      // ---------------------------------------------
      // NAME
      // ---------------------------------------------

      if (typeof name !== "string" || !name.trim()) {
        throw new Error("Class name is required");
      }

      const cleanName = name.trim();

      if (cleanName.length < 2) {
        throw new Error("Class name must be at least 2 characters");
      }

      if (cleanName.length > 100) {
        throw new Error("Class name cannot exceed 100 characters");
      }

      // ---------------------------------------------
      // SUBJECT
      // ---------------------------------------------

      if (typeof subject !== "string" || !subject.trim()) {
        throw new Error("Subject is required");
      }

      const cleanSubject = subject.trim();

      if (cleanSubject.length < 2) {
        throw new Error("Subject must be at least 2 characters");
      }

      if (cleanSubject.length > 100) {
        throw new Error("Subject cannot exceed 100 characters");
      }

      // ---------------------------------------------
      // API
      // ---------------------------------------------

      const data = await classApi.create(token, cleanName, cleanSubject);

      // ---------------------------------------------
      // NORMALIZE
      // ---------------------------------------------

      const newClass = normalizeClass(data);

      if (!newClass?._id) {
        console.error("Invalid create-class response:", data);

        throw new Error("Invalid response from server");
      }

      // ---------------------------------------------
      // UPDATE LIST
      // ---------------------------------------------

      mergeClassIntoList(newClass);

      // ---------------------------------------------
      // SELECT
      // ---------------------------------------------

      setCurrentClass(newClass);

      return newClass;
    } catch (error) {
      console.error("Create class error:", error);

      setError(error?.message || "Failed to create class");

      throw error;
    }
  };

  // ====================================================
  // JOIN CLASS
  // ====================================================

  const joinClass = async (classCode) => {
    try {
      setError("");

      if (!token) {
        throw new Error("Authentication required");
      }

      if (user?.role !== "student") {
        throw new Error("Only students can join classes");
      }

      if (typeof classCode !== "string" || !classCode.trim()) {
        throw new Error("Class code is required");
      }

      const normalizedCode = classCode.trim().toUpperCase();

      if (!/^[A-F0-9]{8}$/.test(normalizedCode)) {
        throw new Error("Class code must contain 8 valid characters");
      }

      const data = await classApi.join(token, normalizedCode);

      const joinedClass = normalizeClass(data);

      if (!joinedClass?._id) {
        throw new Error("Joined class data was not returned");
      }

      mergeClassIntoList(joinedClass);

      setCurrentClass(joinedClass);

      return joinedClass;
    } catch (error) {
      console.error("Join class error:", error);

      setError(error?.message || "Failed to join class");

      throw error;
    }
  };

  // ====================================================
  // LEAVE CLASS
  // ====================================================

  const leaveClass = async (classId) => {
    try {
      setError("");

      if (!token) {
        throw new Error("Authentication required");
      }

      if (user?.role !== "student") {
        throw new Error("Only students can leave classes");
      }

      if (!classId) {
        throw new Error("Class ID is required");
      }

      await classApi.leave(token, classId);

      setClasses((previousClasses) => {
        const remaining = previousClasses.filter(
          (item) => item?._id !== classId,
        );

        setCurrentClass((previousCurrent) => {
          if (previousCurrent?._id !== classId) {
            return previousCurrent;
          }

          return remaining[0] || null;
        });

        return remaining;
      });

      return true;
    } catch (error) {
      console.error("Leave class error:", error);

      setError(error?.message || "Failed to leave class");

      throw error;
    }
  };

  // ====================================================
  // DEACTIVATE CLASS
  // ====================================================

  const deleteClass = async (classId) => {
    try {
      setError("");

      if (!token) {
        throw new Error("Authentication required");
      }

      if (user?.role !== "teacher") {
        throw new Error("Only teachers can deactivate classes");
      }

      if (!classId) {
        throw new Error("Class ID is required");
      }

      await classApi.delete(token, classId);

      setClasses((previousClasses) => {
        const remaining = previousClasses.filter(
          (item) => item?._id !== classId,
        );

        setCurrentClass((previousCurrent) => {
          if (previousCurrent?._id !== classId) {
            return previousCurrent;
          }

          return remaining[0] || null;
        });

        return remaining;
      });

      return true;
    } catch (error) {
      console.error("Deactivate class error:", error);

      setError(error?.message || "Failed to deactivate class");

      throw error;
    }
  };

  // ====================================================
  // REFRESH CURRENT CLASS
  // ====================================================

  const refreshCurrentClass = async () => {
    if (!currentClass?._id) {
      return null;
    }

    return fetchClassById(currentClass._id);
  };

  // ====================================================
  // LOAD AFTER LOGIN
  // ====================================================

  useEffect(() => {
    if (!token || !user) {
      setClasses([]);
      setCurrentClass(null);
      setError("");
      setLoading(false);

      return;
    }

    fetchClasses();

    // eslint-disable-next-line
  }, [token, user]);

  // ====================================================
  // PROVIDER
  // ====================================================

  return (
    <ClassContext.Provider
      value={{
        // DATA
        classes,
        currentClass,

        // STATE
        loading,
        error,

        // FETCH
        fetchClasses,
        fetchClassById,
        refreshCurrentClass,

        // OPERATIONS
        createClass,
        joinClass,
        leaveClass,
        deleteClass,
        selectClass,

        // ERROR
        clearError,
      }}
    >
      {children}
    </ClassContext.Provider>
  );
}

// ======================================================
// CUSTOM HOOK
// ======================================================

export function useClasses() {
  const context = useContext(ClassContext);

  if (!context) {
    throw new Error("useClasses must be used inside ClassProvider");
  }

  return context;
}
