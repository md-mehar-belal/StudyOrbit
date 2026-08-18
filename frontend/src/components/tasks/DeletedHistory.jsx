import { useTasks } from "../../context/TaskContext";
import { API_URL } from "../../api/api";

// ========================================
// SERVER URL
// ========================================

const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

// ========================================
// FORMAT DATE
// ========================================

function formatDeletedDate(date) {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ========================================
// DELETED HISTORY
// ========================================

function DeletedHistory() {
  const { deletedTasks } = useTasks();

  // ========================================
  // VIEW PROOF
  // ========================================

  const handleViewProof = (task) => {
    if (!task?.proofImage) {
      return;
    }

    const proofUrl = `${SERVER_URL}${task.proofImage}`;

    window.open(proofUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section>
      {/* ==================================
          PAGE HEADER
      ================================== */}

      <div className="page-header">
        <div>
          <h1>Deleted History</h1>

          <p>Deleted assignments are automatically removed after 7 days.</p>
        </div>
      </div>

      {/* ==================================
          EMPTY
      ================================== */}

      {deletedTasks.length === 0 ? (
        <div className="empty-state">
          <h3>No deleted assignments</h3>

          <p>Deleted assignments will appear here.</p>
        </div>
      ) : (
        /* ==================================
           DELETED TASK LIST
        ================================== */

        <div className="deleted-task-list">
          {deletedTasks.map((task) => (
            <article className="deleted-task-card" key={task._id}>
              {/* ==========================
                    HEADER
                ========================== */}

              <div className="deleted-task-header">
                <div>
                  <h3 className="deleted-task-title">{task.title}</h3>

                  <p className="deleted-task-date">
                    Deleted on: {formatDeletedDate(task.deletedAt)}
                  </p>
                </div>

                {/* STATUS */}

                <span
                  className={
                    task.completed
                      ? "status completed-status"
                      : "status pending-status"
                  }
                >
                  {task.completed ? "Completed" : "Pending"}
                </span>
              </div>

              {/* ==========================
                    DESCRIPTION
                ========================== */}

              {task.description && (
                <div className="deleted-task-description">
                  <h4>Assignment Description</h4>

                  <p>{task.description}</p>
                </div>
              )}

              {/* ==========================
                    PROOF
                ========================== */}

              {task.proofImage && (
                <div className="deleted-task-proof">
                  <button
                    className="proof-btn"
                    onClick={() => handleViewProof(task)}
                  >
                    View Proof
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default DeletedHistory;
