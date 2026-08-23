import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { parentApi } from "../../api/api";

function ParentRequest() {
  const { token, user } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ========================================
  // FETCH PARENT REQUEST
  // ========================================

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await parentApi.getLinkRequest(token);

      setRequest(data?.request || null);
    } catch (error) {
      setError(error.message || "Unable to fetch parent request");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // LOAD REQUEST
  // ========================================

  useEffect(() => {
    if (token && user?.role === "student") {
      fetchRequest();
    }
  }, [token, user]);

  // ========================================
  // ACCEPT / REJECT
  // ========================================

  const handleAction = async (action) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      let data;

      if (action === "accept") {
        data = await parentApi.acceptLink(token);
      } else {
        data = await parentApi.rejectLink(token);
      }

      setSuccess(
        data?.message ||
          (action === "accept"
            ? "Parent linked successfully"
            : "Parent request rejected"),
      );

      setRequest(null);

      // 5 seconds ke baad success message hide
      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (error) {
      setError(error.message || "Unable to process request");

      // 5 seconds ke baad error message hide
      setTimeout(() => {
        setError("");
      }, 5000);
    } finally {
      setActionLoading(false);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="parent-request">
        <p>Loading parent request...</p>
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="parent-request">
      <h2>Parent Link</h2>

      {error && (
        <div className="form-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="form-success" role="status">
          <span>{success}</span>
        </div>
      )}

      {request ? (
        <div className="parent-request-card">
          <h3>Parent Link Request</h3>

          <p>
            <strong>{request.parent.name}</strong> wants to link with your
            account.
          </p>

          <p>{request.parent.email}</p>

          <div className="parent-request-actions">
            <button
              type="button"
              onClick={() => handleAction("accept")}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : "Accept"}
            </button>

            <button
              type="button"
              onClick={() => handleAction("reject")}
              disabled={actionLoading}
            >
              Reject
            </button>
          </div>
        </div>
      ) : (
        <p>No pending parent request.</p>
      )}
    </div>
  );
}

export default ParentRequest;
