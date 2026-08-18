import { createContext, useContext, useState } from "react";

import { authApi } from "../api/api";

// ========================================
// CONTEXT
// ========================================

const AuthContext = createContext(null);

// ========================================
// PROVIDER
// ========================================

export function AuthProvider({ children }) {
  // ========================================
  // USER
  // ========================================

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("task_user");

      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Failed to load saved user:", error);

      localStorage.removeItem("task_user");

      return null;
    }
  });

  // ========================================
  // TOKEN
  // ========================================

  const [token, setToken] = useState(
    () => localStorage.getItem("task_token") || "",
  );

  // ========================================
  // LOADING
  // ========================================

  const [loading, setLoading] = useState(false);

  // ========================================
  // SAVE AUTH DATA
  // ========================================

  const saveAuthData = (data) => {
    if (!data?.token || !data?.user) {
      throw new Error("Invalid authentication response");
    }

    setUser(data.user);
    setToken(data.token);

    localStorage.setItem("task_user", JSON.stringify(data.user));

    localStorage.setItem("task_token", data.token);
  };

  // ========================================
  // LOGIN
  // EMAIL + PASSWORD
  // ========================================

  const login = async ({ email, password }) => {
    setLoading(true);

    try {
      // ======================================
      // VALIDATION
      // ======================================

      if (!email?.trim()) {
        throw new Error("Email is required");
      }

      if (!password) {
        throw new Error("Password is required");
      }

      // ======================================
      // API LOGIN
      // ======================================

      const data = await authApi.login({
        email: email.trim().toLowerCase(),

        password,
      });

      // ======================================
      // SAVE LOGIN
      // ======================================

      saveAuthData(data);

      return data;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // STUDENT SIGNUP
  // ========================================
  // Public signup se sirf STUDENT
  // account create hoga.
  //
  // Role frontend se nahi bhejna hai.
  // Backend automatically:
  //
  // role = "student"
  //
  // set karega.

  const signup = async ({ name, email, password }) => {
    setLoading(true);

    try {
      // ======================================
      // VALIDATION
      // ======================================

      if (!name?.trim()) {
        throw new Error("Name is required");
      }

      if (!email?.trim()) {
        throw new Error("Email is required");
      }

      if (!password) {
        throw new Error("Password is required");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      // ======================================
      // API SIGNUP
      // ======================================

      const data = await authApi.signup({
        name: name.trim(),

        email: email.trim().toLowerCase(),

        password,
      });

      // ======================================
      // IMPORTANT
      // ======================================
      // Signup ke baad backend token nahi
      // bhej raha hai.
      //
      // Isliye automatically login nahi
      // karenge.

      return data;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // LOGOUT
  // ========================================

  const logout = () => {
    setUser(null);
    setToken("");

    localStorage.removeItem("task_user");

    localStorage.removeItem("task_token");
  };

  // ========================================
  // PROVIDER
  // ========================================

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ========================================
// CUSTOM HOOK
// ========================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
