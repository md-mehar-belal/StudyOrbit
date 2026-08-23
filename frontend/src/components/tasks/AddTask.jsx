import { useEffect, useMemo, useState } from "react";

// ======================================================
// HELPERS
// ======================================================

const getId = (value) => {
  if (!value) return "";

  // Normal string ID 
  if (typeof value === "string") {
    return value;
  }

  // Object ID / student object
  if (typeof value === "object") {
    return (
      value._id ||
      value.id ||
      value.$oid ||
      value._id?.$oid ||
      value.id?.$oid ||
      ""
    );
  }

  return String(value);
};

const getStudentName = (student) => {
  if (!student) {
    return "Unnamed Student";
  }

  // If backend gives plain string
  if (typeof student === "string") {
    return student;
  }

  // If backend gives MongoDB ObjectId format
  if (student.$oid) {
    return student.$oid;
  }

  return (
    student.name ||
    student.fullName ||
    student.username ||
    student.email ||
    student.user?.name ||
    student.user?.fullName ||
    student.user?.username ||
    student.user?.email ||
    "Unnamed Student"
  );
};

// ======================================================
// ADD TASK
// ======================================================

function AddTask({
  onAdd,
  students = [],
  classes = [],
  actionLoading = false,
}) {
  // ====================================================
  // FORM STATE
  // ====================================================

  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // ====================================================
  // UI STATE
  // ====================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ====================================================
  // EFFECTIVE LOADING
  // ====================================================

  const isSubmitting = loading || actionLoading;

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
  // AUTO SELECT CLASS
  // ====================================================

  useEffect(() => {
    if (activeClasses.length === 0) {
      setClassId("");
      setStudentId("");
      return;
    }

    // Current selected class still exists
    const currentClassExists = activeClasses.some(
      (classItem) => String(classItem._id) === String(classId),
    );

    if (currentClassExists) {
      return;
    }

    // Automatically select first active class
    const firstClass = activeClasses[0];

    if (firstClass?._id) {
      setClassId(String(firstClass._id));
      setStudentId("");
    }
  }, [activeClasses, classId]);

  // ====================================================
  // SELECTED CLASS
  // ====================================================

  const selectedClass = useMemo(() => {
    if (!classId) {
      return null;
    }

    return (
      activeClasses.find(
        (classItem) => String(classItem._id) === String(classId),
      ) || null
    );
  }, [activeClasses, classId]);

  // ====================================================
  // STUDENTS OF SELECTED CLASS
  // ====================================================

  const classStudents = useMemo(() => {
    if (!selectedClass) {
      return [];
    }

    // --------------------------------------------------
    // CLASS STUDENTS
    // --------------------------------------------------

    const classStudentList = Array.isArray(selectedClass.students)
      ? selectedClass.students
      : [];

    // --------------------------------------------------
    // CASE 1:
    // Backend returned populated student objects
    // --------------------------------------------------

    const populatedStudents = classStudentList.filter(
      (student) =>
        student && typeof student === "object" && (student._id || student.id),
    );

    if (populatedStudents.length > 0) {
      return populatedStudents;
    }

    // --------------------------------------------------
    // CASE 2:
    // Backend returned only student IDs
    //
    // Example:
    //
    // students: [
    //   "68xxxxxxxxxxxx"
    // ]
    //
    // Find those IDs from parent students array.
    // --------------------------------------------------

    if (classStudentList.length > 0) {
      if (!Array.isArray(students)) {
        return [];
      }

      const classStudentIds = new Set(
        classStudentList.map((student) => String(getId(student))),
      );

      return students.filter((student) => {
        const id = getId(student);

        return id && classStudentIds.has(String(id));
      });
    }

    // --------------------------------------------------
    // CASE 3:
    // No students stored in class
    // --------------------------------------------------

    return [];
  }, [selectedClass, students]);

  // ====================================================
  // RESET STUDENT WHEN CLASS CHANGES
  // ====================================================

  useEffect(() => {
    setStudentId("");
    setError("");
    setSuccess("");
  }, [classId]);

  // ====================================================
  // RESET INVALID STUDENT
  // ====================================================

  useEffect(() => {
    if (!studentId) {
      return;
    }

    const exists = classStudents.some(
      (student) => String(getId(student)) === String(studentId),
    );

    if (!exists) {
      setStudentId("");
    }
  }, [classStudents, studentId]);

  // ====================================================
  // FORM VALIDATION
  // ====================================================

  const validateForm = () => {
    if (!classId) {
      return "Please select a subject/class.";
    }

    if (!selectedClass) {
      return "Selected class is no longer available.";
    }

    if (selectedClass.isActive === false) {
      return "This class is inactive.";
    }

    if (!studentId) {
      return "Please select a student.";
    }

    const studentExists = classStudents.some(
      (student) => String(getId(student)) === String(studentId),
    );

    if (!studentExists) {
      return "Selected student does not belong to this class.";
    }

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      return "Task heading is required.";
    }

    if (cleanTitle.length < 2) {
      return "Task heading must contain at least 2 characters.";
    }

    if (cleanTitle.length > 200) {
      return "Task heading cannot exceed 200 characters.";
    }

    const cleanDescription = description.trim();

    if (!cleanDescription) {
      return "Task description is required.";
    }

    if (cleanDescription.length < 2) {
      return "Task description must contain at least 2 characters.";
    }

    if (cleanDescription.length > 5000) {
      return "Task description cannot exceed 5000 characters.";
    }

    if (typeof onAdd !== "function") {
      return "Task creation service is unavailable.";
    }

    return null;
  };

  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (isSubmitting) {
      return;
    }

    // --------------------------------------------------
    // VALIDATE
    // --------------------------------------------------

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    // --------------------------------------------------
    // API
    // --------------------------------------------------

    try {
      setLoading(true);

      await onAdd(cleanTitle, cleanDescription, classId, studentId);

      // ------------------------------------------------
      // SUCCESS
      // ------------------------------------------------

      setSuccess("Assignment created successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);

      // ------------------------------------------------
      // RESET FORM
      // ------------------------------------------------

      setStudentId("");
      setTitle("");
      setDescription("");

      // IMPORTANT:
      // Class ko reset nahi kar rahe.
      //
      // DBMS selected rahega.
    } catch (err) {
      console.error("Create assignment error:", err);

      setError(err?.message || "Failed to create assignment.");
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // CLEAR MESSAGES
  // ====================================================

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <form className="add-task-form" onSubmit={handleSubmit} noValidate>
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="add-task-header">
        <div>
          <h2>Create Assignment</h2>

          <p>Select a subject, student and create an assignment.</p>
        </div>
      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="form-error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {/* ==================================================
          SUCCESS
      ================================================== */}

      {success && (
        <div className="form-success" role="status">
          <span>{success}</span>
        </div>
      )}

      {/* ==================================================
          SUBJECT / CLASS
      ================================================== */}

      <div className="form-group">
        <label htmlFor="taskClass">Subject / Class</label>

        <select
          id="taskClass"
          value={classId}
          onChange={(event) => {
            clearMessages();
            setClassId(event.target.value);
          }}
          disabled={isSubmitting || activeClasses.length === 0}
        >
          <option value="">Select Subject / Class</option>

          {activeClasses.map((classItem) => (
            <option key={classItem._id} value={classItem._id}>
              {classItem.subject
                ? `${classItem.subject} — ${classItem.name}`
                : classItem.name || "Unnamed Class"}
            </option>
          ))}
        </select>

        {activeClasses.length === 0 && (
          <small className="input-hint">
            No active classes available. Create an active class first.
          </small>
        )}
      </div>

      {/* ==================================================
          CLASS INFORMATION
      ================================================== */}

      {selectedClass && (
        <div className="selected-class-info">
          <div>
            <span>Subject</span>

            <strong>{selectedClass.subject || "Subject not specified"}</strong>
          </div>

          <div>
            <span>Class</span>

            <strong>{selectedClass.name || "Class not specified"}</strong>
          </div>

          <div>
            <span>Students</span>

            <strong>{classStudents.length}</strong>
          </div>
        </div>
      )}

      {/* ==================================================
          STUDENT
      ================================================== */}

      <div className="form-group">
        <label htmlFor="taskStudent">Student</label>

        <select
          id="taskStudent"
          value={studentId}
          onChange={(event) => {
            clearMessages();
            setStudentId(event.target.value);
          }}
          disabled={isSubmitting || !classId || classStudents.length === 0}
        >
          <option value="">
            {!classId
              ? "Select subject first"
              : classStudents.length === 0
                ? "No students in this class"
                : "Select Student"}
          </option>

          {classStudents.map((student, index) => {
            const id = getId(student);

            if (!id) {
              return null;
            }

            const name = getStudentName(student);

            const email =
              typeof student === "object"
                ? student.email || student.user?.email || ""
                : "";

            return (
              <option key={`${id}-${index}`} value={id}>
                {name}
                {email ? ` (${email})` : ""}
              </option>
            );
          })}
        </select>

        {selectedClass && (
          <small className="input-hint">
            {classStudents.length}{" "}
            {classStudents.length === 1 ? "student" : "students"} available in
            this class.
          </small>
        )}
      </div>

      {/* ==================================================
          TASK HEADING
      ================================================== */}

      <div className="form-group">
        <label htmlFor="taskTitle">Task Heading</label>

        <input
          id="taskTitle"
          type="text"
          value={title}
          maxLength={200}
          disabled={isSubmitting}
          placeholder="e.g. DBMS Assignment - SQL Queries"
          onChange={(event) => {
            clearMessages();
            setTitle(event.target.value);
          }}
        />

        <div className="input-counter">{title.length}/200</div>
      </div>

      {/* ==================================================
          DESCRIPTION
      ================================================== */}

      <div className="form-group">
        <label htmlFor="taskDescription">Assignment Description</label>

        <textarea
          id="taskDescription"
          className="task-description-input"
          value={description}
          maxLength={5000}
          rows={7}
          disabled={isSubmitting}
          placeholder="Write assignment details, questions, instructions, deadline information, etc..."
          onChange={(event) => {
            clearMessages();
            setDescription(event.target.value);
          }}
        />

        <div className="input-counter">{description.length}/5000</div>
      </div>

      {/* ==================================================
          PREVIEW
      ================================================== */}

      {(title.trim() || description.trim()) && (
        <div className="assignment-preview">
          <div className="preview-label">Preview</div>

          <h3>{title.trim() || "Untitled Assignment"}</h3>

          <p>{description.trim() || "No description provided."}</p>
        </div>
      )}

      {/* ==================================================
          SUBMIT
      ================================================== */}

      <button
        type="submit"
        className="primary-btn"
        disabled={
          isSubmitting ||
          activeClasses.length === 0 ||
          !classId ||
          !studentId ||
          !title.trim() ||
          !description.trim()
        }
      >
        {isSubmitting ? "Creating Assignment..." : "Create Assignment"}
      </button>
    </form>
  );
}

export default AddTask;
