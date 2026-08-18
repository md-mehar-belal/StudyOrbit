import { useEffect, useRef, useState } from "react";
import { API_URL } from "../../api/api";

// ========================================
// SERVER URL
// ========================================

const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

// ========================================
// TASK ITEM
// ========================================

function TaskItem({
  task,
  readOnly = false,
  onUpdate,
  onDelete,
  onComplete,
  onReview,
}) {
  // ========================================
  // FILE INPUT
  // ========================================

  const fileInputRef = useRef(null);

  // ========================================
  // UI STATES
  // ========================================

  const [editing, setEditing] = useState(false);

  const [showDetails, setShowDetails] = useState(false);

  const [showReview, setShowReview] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [reviewing, setReviewing] = useState(false);

  // ========================================
  // EDIT STATES
  // ========================================

  const [editTitle, setEditTitle] = useState(task?.title || "");

  const [editDescription, setEditDescription] = useState(
    task?.description || "",
  );

  // ========================================
  // REVIEW STATES
  // ========================================

  const [rating, setRating] = useState(Number(task?.rating) || 0);

  const [teacherComment, setTeacherComment] = useState(
    task?.teacherComment || "",
  );

  // ========================================
  // SYNC TASK DATA
  // ========================================

  useEffect(() => {
    setEditTitle(task?.title || "");

    setEditDescription(task?.description || "");

    setRating(Number(task?.rating) || 0);

    setTeacherComment(task?.teacherComment || "");

    setEditing(false);
    setShowReview(false);
  }, [
    task?._id,
    task?.title,
    task?.description,
    task?.rating,
    task?.teacherComment,
  ]);

  // ========================================
  // SAFETY CHECK
  // ========================================

  if (!task) {
    return null;
  }

  // ========================================
  // TASK INFORMATION
  // ========================================

  const classInfo =
    task.classId && typeof task.classId === "object" ? task.classId : null;

  const studentInfo =
    task.studentId && typeof task.studentId === "object"
      ? task.studentId
      : null;

  const teacherInfo =
    task.teacherId && typeof task.teacherId === "object"
      ? task.teacherId
      : null;

  // ========================================
  // STATUS
  // ========================================

  const isCompleted = Boolean(task.completed);

  const isPending = !isCompleted;

  const reviewStatus = task.reviewStatus || "pending";

  const isSubmitted = reviewStatus === "submitted";

  const isReviewed = reviewStatus === "reviewed";

  // ========================================
  // DESCRIPTION
  // ========================================

  const description = task.description || "No description available.";

  const descriptionPreview =
    description.length > 120
      ? `${description.substring(0, 120)}...`
      : description;

  // ========================================
  // EDIT PERMISSION
  // ========================================

  const canEdit = Boolean(onUpdate) && !readOnly && !isCompleted && !editing;

  // ========================================
  // DELETE PERMISSION
  // ========================================

  const canDelete = Boolean(onDelete) && !readOnly && !editing;

  // ========================================
  // COMPLETE PERMISSION
  // ========================================

  const canComplete =
    Boolean(onComplete) && !readOnly && !isCompleted && !editing && !uploading;

  // ========================================
  // REVIEW PERMISSION
  // ========================================

  // Teacher completed task ko review karega.

  const canReview = Boolean(onReview) && isCompleted && !readOnly;

  // ========================================
  // SAVE EDIT
  // ========================================

  const handleSave = async () => {
    const title = editTitle.trim();

    const taskDescription = editDescription.trim();

    // ======================================
    // TITLE VALIDATION
    // ======================================

    if (!title) {
      alert("Task heading is required.");

      return;
    }

    if (title.length > 200) {
      alert("Task heading cannot exceed 200 characters.");

      return;
    }

    // ======================================
    // DESCRIPTION VALIDATION
    // ======================================

    if (!taskDescription) {
      alert("Task description is required.");

      return;
    }

    // ======================================
    // UPDATE FUNCTION CHECK
    // ======================================

    if (!onUpdate) {
      return;
    }

    try {
      await onUpdate(task, {
        title,
        description: taskDescription,
      });

      setEditing(false);
    } catch (error) {
      console.error("Update task failed:", error);

      alert(error?.message || "Failed to update task.");
    }
  };

  // ========================================
  // START EDIT
  // ========================================

  const handleEdit = () => {
    if (!canEdit) {
      return;
    }

    setEditTitle(task.title || "");

    setEditDescription(task.description || "");

    setEditing(true);
    setShowDetails(true);
  };

  // ========================================
  // CANCEL EDIT
  // ========================================

  const handleCancel = () => {
    setEditTitle(task.title || "");

    setEditDescription(task.description || "");

    setEditing(false);
  };

  // ========================================
  // COMPLETE BUTTON
  // ========================================

  const handleCompleteClick = () => {
    if (!canComplete) {
      return;
    }

    fileInputRef.current?.click();
  };

  // ========================================
  // FILE CHANGE
  // ========================================

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // ====================================
    // IMAGE TYPE
    // ====================================

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");

      event.target.value = "";

      return;
    }

    // ====================================
    // FILE SIZE
    // ====================================

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Image size must be less than 5 MB.");

      event.target.value = "";

      return;
    }

    // ====================================
    // UPLOAD
    // ====================================

    try {
      setUploading(true);

      if (!onComplete) {
        throw new Error("Complete task function is not available.");
      }

      await onComplete(task._id, file);
    } catch (error) {
      console.error("Proof upload failed:", error);

      alert(error?.message || "Proof upload failed.");
    } finally {
      setUploading(false);

      event.target.value = "";
    }
  };

  // ========================================
  // VIEW PROOF
  // ========================================

  const handleViewProof = () => {
    if (!task.proofImage) {
      return;
    }

    const proofUrl = task.proofImage.startsWith("http")
      ? task.proofImage
      : `${SERVER_URL}${task.proofImage}`;

    window.open(proofUrl, "_blank", "noopener,noreferrer");
  };

  // ========================================
  // OPEN REVIEW
  // ========================================

  const handleOpenReview = () => {
    if (!canReview) {
      return;
    }

    setRating(Number(task.rating) || 0);

    setTeacherComment(task.teacherComment || "");

    setShowReview(true);
  };

  // ========================================
  // CLOSE REVIEW
  // ========================================

  const handleCloseReview = () => {
    if (reviewing) {
      return;
    }

    setRating(Number(task.rating) || 0);

    setTeacherComment(task.teacherComment || "");

    setShowReview(false);
  };

  // ========================================
  // SUBMIT REVIEW
  // ========================================

  const handleSubmitReview = async () => {
    if (!onReview) {
      return;
    }

    // ====================================
    // RATING VALIDATION
    // ====================================

    if (!rating || rating < 1 || rating > 5) {
      alert("Please select a rating from 1 to 5.");

      return;
    }

    // ====================================
    // COMMENT VALIDATION
    // ====================================

    const comment = teacherComment.trim();

    if (comment.length > 1000) {
      alert("Teacher comment cannot exceed 1000 characters.");

      return;
    }

    try {
      setReviewing(true);

      await onReview(task._id, Number(rating), comment);

      setShowReview(false);
    } catch (error) {
      console.error("Review task failed:", error);

      alert(error?.message || "Failed to submit review.");
    } finally {
      setReviewing(false);
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className={isCompleted ? "task-card completed-card" : "task-card"}>
      {/* ==================================
          LEFT SIDE
      ================================== */}

      <div className="task-left">
        {/* ==================================
            CHECKBOX
        ================================== */}

        <input
          className="task-checkbox"
          type="checkbox"
          checked={isCompleted}
          disabled={readOnly || isCompleted || uploading || !onComplete}
          onChange={handleCompleteClick}
        />

        {/* ==================================
            TASK CONTENT
        ================================== */}

        <div className="task-content">
          {editing ? (
            <>
              {/* ============================
                  EDIT TITLE
              ============================ */}

              <input
                className="edit-input"
                type="text"
                value={editTitle}
                autoFocus
                maxLength={200}
                placeholder="Task heading"
                disabled={reviewing}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    handleCancel();
                  }

                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();

                    handleSave();
                  }
                }}
              />

              {/* ============================
                  TITLE COUNT
              ============================ */}

              <div className="input-hint">
                {editTitle.length}
                /200 characters
              </div>

              {/* ============================
                  EDIT DESCRIPTION
              ============================ */}

              <textarea
                className="edit-description-input"
                value={editDescription}
                placeholder="Assignment description..."
                rows={6}
                disabled={reviewing}
                onChange={(e) => setEditDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    handleCancel();
                  }
                }}
              />
            </>
          ) : (
            <>
              {/* ============================
                  SUBJECT / CLASS
              ============================ */}

              {classInfo && (
                <div className="task-meta">
                  <span className="task-subject">
                    {classInfo.subject || "Subject"}
                  </span>

                  <span className="task-class">
                    {classInfo.name || "Class"}
                  </span>
                </div>
              )}

              {/* ============================
                  TITLE
              ============================ */}

              <span
                className={
                  isCompleted ? "task-title completed-title" : "task-title"
                }
              >
                {task.title}
              </span>

              {/* ============================
                  STUDENT
              ============================ */}

              {studentInfo && (
                <div className="task-student-info">
                  <strong>Student:</strong> {studentInfo.name || "Student"}
                  {studentInfo.email && <span> ({studentInfo.email})</span>}
                </div>
              )}

              {/* ============================
                  TEACHER
              ============================ */}

              {teacherInfo && (
                <div className="task-teacher-info">
                  <strong>Teacher:</strong> {teacherInfo.name || "Teacher"}
                  {teacherInfo.email && <span> ({teacherInfo.email})</span>}
                </div>
              )}

              {/* ============================
                  DESCRIPTION
              ============================ */}

              <p className="task-description">
                {showDetails ? description : descriptionPreview}
              </p>

              {/* ============================
                  SHOW MORE
              ============================ */}

              {description.length > 120 && (
                <button
                  type="button"
                  className="description-toggle-btn"
                  onClick={() => setShowDetails((previous) => !previous)}
                >
                  {showDetails ? "Show Less" : "Read Full Assignment"}
                </button>
              )}

              {/* ============================
                  TASK STATUS
              ============================ */}

              <span
                className={
                  isCompleted
                    ? "status completed-status"
                    : "status pending-status"
                }
              >
                {isCompleted ? "Completed" : "Pending"}
              </span>

              {/* ============================
                  REVIEW STATUS
              ============================ */}

              {isSubmitted && !isReviewed && (
                <span className="status submitted-status">
                  Submitted - Awaiting Review
                </span>
              )}

              {isReviewed && (
                <div className="task-review-info">
                  <span>
                    ⭐ {task.rating || 0}
                    /5
                  </span>

                  <span>Reviewed</span>
                </div>
              )}

              {/* ============================
                  TEACHER COMMENT
              ============================ */}

              {isReviewed && task.teacherComment && (
                <div className="teacher-comment-preview">
                  <strong>Teacher Feedback:</strong>

                  <p>{task.teacherComment}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ==================================
          ACTION BUTTONS
      ================================== */}

      <div className="task-actions">
        {/* ==================================
            EDIT
        ================================== */}

        {canEdit && (
          <button type="button" className="edit-btn" onClick={handleEdit}>
            Edit
          </button>
        )}

        {/* ==================================
            SAVE
        ================================== */}

        {editing && (
          <>
            <button type="button" className="save-btn" onClick={handleSave}>
              Save
            </button>

            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </>
        )}

        {/* ==================================
            DELETE
        ================================== */}

        {canDelete && (
          <button
            type="button"
            className="delete-btn"
            onClick={() => onDelete(task)}
          >
            Delete
          </button>
        )}

        {/* ==================================
            COMPLETE + PROOF
        ================================== */}

        {canComplete && (
          <button
            type="button"
            className="complete-proof-btn"
            onClick={handleCompleteClick}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Complete & Upload Proof"}
          </button>
        )}

        {/* ==================================
            VIEW PROOF
        ================================== */}

        {task.proofImage && (
          <button type="button" className="proof-btn" onClick={handleViewProof}>
            View Proof
          </button>
        )}

        {/* ==================================
            REVIEW
        ================================== */}

        {canReview && !isReviewed && (
          <button
            type="button"
            className="review-btn"
            onClick={handleOpenReview}
          >
            Review
          </button>
        )}

        {/* ==================================
            VIEW REVIEW
        ================================== */}

        {isReviewed && onReview && (
          <button
            type="button"
            className="review-btn"
            onClick={handleOpenReview}
          >
            View Review
          </button>
        )}
      </div>

      {/* ==================================
          REVIEW PANEL
      ================================== */}

      {showReview && (
        <div className="task-review-panel">
          {/* ==================================
              REVIEW HEADER
          ================================== */}

          <div className="review-header">
            <div>
              <h3>{isReviewed ? "Task Review" : "Review Student Task"}</h3>

              {classInfo && (
                <p>
                  {classInfo.subject || "Subject"}

                  {" • "}

                  {classInfo.name || "Class"}
                </p>
              )}
            </div>

            <button
              type="button"
              className="review-close-btn"
              onClick={handleCloseReview}
              disabled={reviewing}
              aria-label="Close review"
            >
              ×
            </button>
          </div>

          {/* ==================================
              STUDENT
          ================================== */}

          {studentInfo && (
            <p className="review-student">
              Student: <strong>{studentInfo.name || "Student"}</strong>
              {studentInfo.email && <span> ({studentInfo.email})</span>}
            </p>
          )}

          {/* ==================================
              PROOF
          ================================== */}

          {task.proofImage && (
            <button
              type="button"
              className="proof-btn"
              onClick={handleViewProof}
            >
              View Submitted Proof
            </button>
          )}

          {/* ==================================
              RATING
          ================================== */}

          <div className="rating-section">
            <label>Rating</label>

            <div className="rating-buttons">
              {[1, 2, 3, 4, 5].map((number) => (
                <button
                  key={number}
                  type="button"
                  className={
                    number <= rating ? "rating-star active" : "rating-star"
                  }
                  onClick={() => setRating(number)}
                  disabled={reviewing}
                  aria-label={`Rate ${number} out of 5`}
                >
                  ★
                </button>
              ))}
            </div>

            <span className="rating-value">
              {rating > 0 ? `${rating}/5` : "Not rated"}
            </span>
          </div>

          {/* ==================================
              COMMENT
          ================================== */}

          <div className="comment-section">
            <label htmlFor={`comment-${task._id}`}>Teacher Comment</label>

            <textarea
              id={`comment-${task._id}`}
              value={teacherComment}
              rows={4}
              maxLength={1000}
              placeholder="Write feedback for the student..."
              disabled={reviewing}
              onChange={(e) => setTeacherComment(e.target.value)}
            />

            <small>
              {teacherComment.length}
              /1000
            </small>
          </div>

          {/* ==================================
              REVIEW ACTIONS
          ================================== */}

          <div className="review-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={handleCloseReview}
              disabled={reviewing}
            >
              Cancel
            </button>

            <button
              type="button"
              className="save-btn"
              onClick={handleSubmitReview}
              disabled={reviewing || !rating}
            >
              {reviewing
                ? "Submitting..."
                : isReviewed
                  ? "Update Review"
                  : "Submit Review"}
            </button>
          </div>
        </div>
      )}

      {/* ==================================
          HIDDEN FILE INPUT
      ================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{
          display: "none",
        }}
        onChange={handleFileChange}
      />
    </div>
  );
}

export default TaskItem;
