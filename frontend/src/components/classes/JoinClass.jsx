import { useState } from "react";

import { useClasses } from "../../context/ClassContext";
import { useAuth } from "../../context/AuthContext";

// ========================================
// JOIN CLASS
// ========================================

function JoinClass() {
  // ========================================
  // AUTH
  // ========================================

  const { user } = useAuth();

  // ========================================
  // CLASS CONTEXT
  // ========================================

  const { joinClass, loading, error, clearError } = useClasses();

  // ========================================
  // CLASS CODE
  // ========================================

  const [classCode, setClassCode] = useState("");

  // ========================================
  // SUCCESS CLASS
  // ========================================
  //
  // Joined class ka complete information
  // yahan temporarily store hoga.

  const [joinedClass, setJoinedClass] = useState(null);

  // ========================================
  // LOCAL ERROR
  // ========================================

  const [localError, setLocalError] = useState("");

  // ========================================
  // SUBMIT
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    clearError();
    setLocalError("");
    setJoinedClass(null);

    // ======================================
    // STUDENT CHECK
    // ======================================

    if (user?.role !== "student") {
      setLocalError("Only students can join a class.");

      return;
    }

    // ======================================
    // CLEAN CLASS CODE
    // ======================================

    const cleanedCode = classCode.trim().toUpperCase();

    // ======================================
    // VALIDATION
    // ======================================

    if (!cleanedCode) {
      setLocalError("Class code is required.");

      return;
    }

    if (cleanedCode.length !== 8) {
      setLocalError("Class code must contain exactly 8 characters.");

      return;
    }

    // ======================================
    // HEX CLASS CODE VALIDATION
    // ======================================
    //
    // Backend Class model ke according
    // generated code 8 characters ka hai.
    //
    // Example:
    // A12BC34D

    if (!/^[A-F0-9]{8}$/.test(cleanedCode)) {
      setLocalError(
        "Invalid class code. Please enter the code provided by your teacher.",
      );

      return;
    }

    // ======================================
    // JOIN CLASS
    // ======================================

    try {
      const newClass = await joinClass(cleanedCode);

      // ====================================
      // STORE JOINED CLASS
      // ====================================

      if (newClass) {
        setJoinedClass(newClass);
      }

      // ====================================
      // CLEAR INPUT
      // ====================================

      setClassCode("");
    } catch (error) {
      console.error("Join class error:", error);
    }
  };

  // ========================================
  // NON-STUDENT
  // ========================================

  if (user?.role !== "student") {
    return null;
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <section className="join-class-section">
      {/* ==================================
          HEADER
      ================================== */}

      <div className="page-header">
        <div>
          <h1>Join a Class</h1>

          <p>
            Enter the class code provided by your teacher to join a subject.
          </p>
        </div>
      </div>

      {/* ==================================
          JOIN CARD
      ================================== */}

      <div className="class-card">
        {/* ==================================
            CARD HEADER
        ================================== */}

        <div className="class-card-header">
          <h2>Join Subject Class</h2>

          <p>
            You can join multiple classes with different teachers and subjects.
          </p>
        </div>

        {/* ==================================
            ERROR
        ================================== */}

        {(localError || error) && (
          <div className="form-error" role="alert">
            {localError || error}
          </div>
        )}

        {/* ==================================
            FORM
        ================================== */}

        <form onSubmit={handleSubmit} className="class-form">
          {/* ==================================
              CLASS CODE LABEL
          ================================== */}

          <label htmlFor="classCode">Class Code</label>

          {/* ==================================
              CLASS CODE INPUT
          ================================== */}

          <input
            id="classCode"
            type="text"
            value={classCode}
            placeholder="Enter 8-character class code"
            maxLength={8}
            minLength={8}
            autoComplete="off"
            disabled={loading}
            required
            onChange={(e) => {
              const value = e.target.value
                .toUpperCase()
                .replace(/[^A-F0-9]/g, "")
                .slice(0, 8);

              setClassCode(value);

              // Error clear karo jab user
              // dobara type kare.

              if (localError) {
                setLocalError("");
              }

              if (error) {
                clearError();
              }
            }}
          />

          {/* ==================================
              CHARACTER COUNT
          ================================== */}

          <div className="input-hint">{classCode.length}/8 characters</div>

          {/* ==================================
              JOIN BUTTON
          ================================== */}

          <button
            type="submit"
            className="primary-btn"
            disabled={loading || classCode.length !== 8}
          >
            {loading ? "Joining Class..." : "Join Class"}
          </button>
        </form>

        {/* ==================================
            SUCCESS / JOINED CLASS
        ================================== */}

        {joinedClass && (
          <div className="created-class-card" role="status">
            {/* ==================================
                SUCCESS MESSAGE
            ================================== */}

            <div className="success-message">Class joined successfully!</div>

            {/* ==================================
                CLASS NAME
            ================================== */}

            <div className="class-info-row">
              <span>Class</span>

              <strong>{joinedClass.name || "Not available"}</strong>
            </div>

            {/* ==================================
                SUBJECT
            ================================== */}

            <div className="class-info-row">
              <span>Subject</span>

              <strong>{joinedClass.subject || "Not available"}</strong>
            </div>

            {/* ==================================
                TEACHER
            ================================== */}

            <div className="class-info-row">
              <span>Teacher</span>

              <strong>
                {typeof joinedClass.teacherId === "object"
                  ? joinedClass.teacherId.name ||
                    joinedClass.teacherId.email ||
                    "Teacher"
                  : "Teacher"}
              </strong>
            </div>

            {/* ==================================
                CLASS CODE
            ================================== */}

            <div className="class-info-row">
              <span>Class Code</span>

              <strong>{joinedClass.classCode}</strong>
            </div>

            {/* ==================================
                HELP TEXT
            ================================== */}

            <p className="class-code-help">
              You can now access assignments and activities for this subject.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default JoinClass;
