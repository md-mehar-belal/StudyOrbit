import { useState } from "react";

import { useClasses } from "../../context/ClassContext";

// ========================================
// CREATE CLASS
// ========================================

function CreateClass() {
  const { createClass, loading } = useClasses();

  // ========================================
  // CLASS NAME
  // ========================================

  const [className, setClassName] = useState("");

  // ========================================
  // SUBJECT
  // ========================================

  const [subject, setSubject] = useState("");

  // ========================================
  // CREATED CLASS
  // ========================================

  const [createdClass, setCreatedClass] = useState(null);

  // ========================================
  // LOCAL ERROR
  // ========================================

  const [error, setError] = useState("");

  // ========================================
  // SUBMIT
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setCreatedClass(null);

    const name = className.trim();
    const subjectName = subject.trim();

    // ======================================
    // CLASS NAME VALIDATION
    // ======================================

    if (!name) {
      setError("Class name is required.");
      return;
    }

    if (name.length < 2) {
      setError("Class name must be at least 2 characters.");
      return;
    }

    if (name.length > 100) {
      setError("Class name cannot exceed 100 characters.");
      return;
    }

    // ======================================
    // SUBJECT VALIDATION
    // ======================================

    if (!subjectName) {
      setError("Subject is required.");
      return;
    }

    if (subjectName.length < 2) {
      setError("Subject must be at least 2 characters.");
      return;
    }

    if (subjectName.length > 100) {
      setError("Subject cannot exceed 100 characters.");
      return;
    }

    // ======================================
    // CREATE CLASS
    // ======================================

    try {
      const newClass = await createClass(name, subjectName);

      setCreatedClass(newClass);

      setClassName("");
      setSubject("");
    } catch (error) {
      console.error("Create class failed:", error);

      setError(error.message || "Failed to create class.");
    }
  };

  // ========================================
  // COPY CLASS CODE
  // ========================================

  const handleCopyCode = async () => {
    if (!createdClass?.classCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdClass.classCode);

      alert("Class code copied!");
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <section className="create-class-section">
      {/* ==================================
          HEADER
      ================================== */}

      <div className="page-header">
        <div>
          <h1>Create New Class</h1>

          <p>
            Create a class, select a subject, and share the generated code with
            your students.
          </p>
        </div>
      </div>

      {/* ==================================
          CREATE FORM
      ================================== */}

      <form className="create-class-form" onSubmit={handleSubmit}>
        {/* ==================================
            CLASS NAME
        ================================== */}

        <label htmlFor="className">Class Name</label>

        <input
          id="className"
          type="text"
          value={className}
          placeholder="e.g. B.Tech CSE - 3rd Year"
          maxLength={100}
          disabled={loading}
          onChange={(e) => setClassName(e.target.value)}
        />

        <div className="input-hint">{className.length}/100 characters</div>

        {/* ==================================
            SUBJECT
        ================================== */}

        <label htmlFor="subject">Subject</label>

        <input
          id="subject"
          type="text"
          value={subject}
          placeholder="e.g. Database Management System"
          maxLength={100}
          disabled={loading}
          onChange={(e) => setSubject(e.target.value)}
        />

        <div className="input-hint">{subject.length}/100 characters</div>

        {/* ==================================
            ERROR
        ================================== */}

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        {/* ==================================
            BUTTON
        ================================== */}

        <button
          type="submit"
          className="primary-btn"
          disabled={loading || !className.trim() || !subject.trim()}
        >
          {loading ? "Creating Class..." : "Create Class"}
        </button>
      </form>

      {/* ==================================
          CREATED CLASS
      ================================== */}

      {createdClass && (
        <div className="created-class-card">
          <div className="success-message">Class created successfully!</div>

          {/* CLASS NAME */}

          <div className="class-info-row">
            <span>Class Name</span>

            <strong>{createdClass.name}</strong>
          </div>

          {/* SUBJECT */}

          <div className="class-info-row">
            <span>Subject</span>

            <strong>{createdClass.subject}</strong>
          </div>

          {/* TEACHER */}

          {createdClass.teacherId && (
            <div className="class-info-row">
              <span>Teacher</span>

              <strong>
                {createdClass.teacherId.name || createdClass.teacherId}
              </strong>
            </div>
          )}

          {/* CLASS CODE */}

          <div className="class-code-section">
            <span>Class Code</span>

            <div className="class-code">{createdClass.classCode}</div>

            <button
              type="button"
              className="secondary-btn"
              onClick={handleCopyCode}
            >
              Copy Code
            </button>
          </div>

          {/* INSTRUCTION */}

          <p className="class-code-help">
            Students can use this code to join this subject class.
          </p>
        </div>
      )}
    </section>
  );
}

export default CreateClass;
