import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function Login({ onSwitch }) {
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  // ========================================
  // LOGIN
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (error) {
      setError(error.message || "Unable to login");
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome Back</h1>

        <p>Login to your StudyOrbit account.</p>

        {/* ==================================
            ERROR
        ================================== */}

        {error && <div className="form-error">{error}</div>}

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
          autoComplete="email"
          required
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
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              // Eye Off
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
              // Eye
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
            LOGIN BUTTON
        ================================== */}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* ==================================
            SIGNUP
        ================================== */}

        <div className="auth-switch">
          Don't have an account?
          <button type="button" onClick={onSwitch}>
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;
