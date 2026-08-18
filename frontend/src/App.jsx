import { useState } from "react";

import { AuthProvider, useAuth } from "./context/AuthContext";

import { ClassProvider } from "./context/ClassContext";

import { TaskProvider } from "./context/TaskContext";

import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";

import Dashboard from "./components/layout/Dashboard";

// ========================================
// AUTHENTICATION
// ========================================

function Authentication() {
  const [mode, setMode] = useState("login");

  if (mode === "login") {
    return <Login onSwitch={() => setMode("signup")} />;
  }

  return <Signup onSwitch={() => setMode("login")} />;
}

// ========================================
// APP CONTENT
// ========================================

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return user ? <Dashboard /> : <Authentication />;
}

// ========================================
// APP
// ========================================

export default function App() {
  return (
    <AuthProvider>
      {/* ClassProvider ko AuthProvider ke
          andar hona zaroori hai kyunki
          ClassContext me useAuth() use ho raha hai. */}

      <ClassProvider>
        <TaskProvider>
          <AppContent />
        </TaskProvider>
      </ClassProvider>
    </AuthProvider>
  );
}
