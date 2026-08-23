import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { parentApi } from "../../api/api";

function LinkChild() {
  const { token } = useAuth();

  const [studentEmail, setStudentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!studentEmail.trim()) {
      setError("Student email is required");
      return;
    }

    try {
      setLoading(true);

      const data = await parentApi.requestLink(token, studentEmail);

      setSuccess(data?.message || "Link request sent successfully");
      setStudentEmail("");

      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (error) {
      setError(error.message || "Unable to send link request");

      setTimeout(() => {
        setError("");
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="link-child">
      <div className="link-child-header">
        <h2>Link Your Child</h2>
        <p>Enter your child's registered email address.</p>
      </div>

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

      <form className="link-child-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="studentEmail">Student Email</label>

          <input
            id="studentEmail"
            type="email"
            value={studentEmail}
            placeholder="Enter student email"
            onChange={(e) => setStudentEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Link Request"}
        </button>
      </form>

      <div className="child-progress-info">
        <h3>Child Progress</h3>
        <p>View your child's tasks, submissions, and teacher ratings here.</p>
      </div>
    </div>
  );
}

export default LinkChild;
