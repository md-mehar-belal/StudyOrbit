import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function Signup({ onSwitch }) {
  const { signup, loading } = useAuth();

  // ========================================
  // FORM STATE
  // ========================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ========================================
  // SHOW / HIDE PASSWORD
  // ========================================

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ========================================
  // ERROR
  // ========================================

  const [error, setError] = useState("");

  // ========================================
  // SUCCESS
  // ========================================

  const [success, setSuccess] = useState("");

  // ========================================
  // HANDLE SUBMIT
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ======================================
    // NAME VALIDATION
    // ======================================

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    // ======================================
    // EMAIL VALIDATION
    // ======================================

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // ======================================
    // PASSWORD VALIDATION
    // ======================================

    if (!password) {
      setError("Password is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    // ======================================
    // CONFIRM PASSWORD
    // ======================================

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // ======================================
    // SIGNUP
    // ======================================

    try {
      await signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // ====================================
      // SUCCESS
      // ====================================

      setSuccess("Student account created successfully. Please login.");

      // ====================================
      // CLEAR FORM
      // ====================================

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Password ko hidden state me reset karo
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      console.error("Signup error:", error);

      setError(error.message || "Unable to create account");
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        {/* ==================================
            HEADER
        ================================== */}

        <h1>Create Account</h1>

        <p>Start organizing your student life today.</p>

        {/* ==================================
            ERROR
        ================================== */}

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        {/* ==================================
            SUCCESS
        ================================== */}

        {success && (
          <div className="form-success" role="status">
            {success}
          </div>
        )}

        {/* ==================================
            NAME
        ================================== */}

        <label htmlFor="name">Name</label>

        <input
          id="name"
          type="text"
          value={name}
          placeholder="Enter your name"
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={100}
          autoComplete="name"
          required
          disabled={loading}
        />

        {/* ==================================
            EMAIL
        ================================== */}

        <label htmlFor="email">Email</label>

        <input
          id="email"
          type="email"
          value={email}
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
          maxLength={150}
          autoComplete="email"
          required
          disabled={loading}
        />

        {/* ==================================
            PASSWORD
        ================================== */}

        <label htmlFor="password">Password</label>

        <div className="password-wrapper">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            placeholder="Minimum 8 characters"
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={loading}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={loading}
          >
            {showPassword ? (
              // ==================================
              // EYE OFF
              // ==================================

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 8.7 4 10 8-0.6 1.8-1.6 3.4-3 4.7" />
                <path d="M6.6 6.6C4.8 7.8 3.5 9.7 2 12c1.3 4 5 8 10 8 1.3 0 2.5-.2 3.6-.7" />
              </svg>
            ) : (
              // ==================================
              // EYE
              // ==================================

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {/* ==================================
            CONFIRM PASSWORD
        ================================== */}

        <label htmlFor="confirmPassword">Confirm Password</label>

        <div className="password-wrapper">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            placeholder="Confirm password"
            minLength={8}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={loading}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword((previous) => !previous)}
            aria-label={
              showConfirmPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
            disabled={loading}
          >
            {showConfirmPassword ? (
              // ==================================
              // EYE OFF
              // ==================================

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 8.7 4 10 8-0.6 1.8-1.6 3.4-3 4.7" />
                <path d="M6.6 6.6C4.8 7.8 3.5 9.7 2 12c1.3 4 5 8 10 8 1.3 0 2.5-.2 3.6-.7" />
              </svg>
            ) : (
              // ==================================
              // EYE
              // ==================================

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {/* ==================================
            CREATE ACCOUNT
        ================================== */}

        <button
          type="submit"
          className="primary-btn"
          disabled={
            loading ||
            !name.trim() ||
            !email.trim() ||
            !password ||
            !confirmPassword
          }
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        {/* ==================================
            LOGIN
        ================================== */}

        <div className="auth-switch">
          Already have an account?
          <button type="button" onClick={onSwitch} disabled={loading}>
            Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default Signup;
