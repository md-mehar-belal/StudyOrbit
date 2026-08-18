import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../context/TaskContext";
import { useClasses } from "../../context/ClassContext";

import Navbar from "./Navbar";

import TaskDetails from "../tasks/TaskDetails";
import Summary from "../summary/Summary";

import CreateClass from "../classes/CreateClass";
import JoinClass from "../classes/JoinClass";
import MyClasses from "../classes/MyClasses";

// ======================================================
// DASHBOARD
// ======================================================

function Dashboard() {
  // ====================================================
  // AUTH
  // ====================================================

  const { user, logout } = useAuth();

  // ====================================================
  // TASK CONTEXT
  // ====================================================

  const { error: taskError, clearError: clearTaskError } = useTasks();

  // ====================================================
  // CLASS CONTEXT
  // ====================================================

  const { error: classError, clearError: clearClassError } = useClasses();

  // ====================================================
  // CURRENT PAGE
  // ====================================================

  const [page, setPage] = useState("");

  // ====================================================
  // ROLE
  // ====================================================

  const role = user?.role || "";

  const isTeacher = role === "teacher";

  const isStudent = role === "student";

  const isParent = role === "parent";

  const isAdmin = role === "admin";

  // ====================================================
  // DEFAULT PAGE BASED ON ROLE
  // ====================================================

  const getDefaultPage = (userRole) => {
    switch (userRole) {
      case "teacher":
        return "classes";

      case "student":
        return "class";

      case "parent":
        return "child";

      case "admin":
        return "admin";

      default:
        return "";
    }
  };

  // ====================================================
  // SYNC PAGE WITH AUTHENTICATED USER
  // ====================================================

  useEffect(() => {
    if (!user) {
      setPage("");
      return;
    }

    const defaultPage = getDefaultPage(user.role);

    setPage((currentPage) => {
      // ----------------------------------------------
      // First authenticated render
      // ----------------------------------------------

      if (!currentPage) {
        return defaultPage;
      }

      // ----------------------------------------------
      // If user role changes
      // ----------------------------------------------

      const teacherPages = ["classes", "tasks", "summary"];

      const studentPages = ["class", "tasks", "summary"];

      const parentPages = ["child", "tasks", "summary"];

      const adminPages = ["admin"];

      if (user.role === "teacher" && teacherPages.includes(currentPage)) {
        return currentPage;
      }

      if (user.role === "student" && studentPages.includes(currentPage)) {
        return currentPage;
      }

      if (user.role === "parent" && parentPages.includes(currentPage)) {
        return currentPage;
      }

      if (user.role === "admin" && adminPages.includes(currentPage)) {
        return currentPage;
      }

      return defaultPage;
    });
  }, [user]);

  // ====================================================
  // COMBINED ERROR
  // ====================================================

  const error = taskError || classError;

  // ====================================================
  // CLEAR ERROR
  // ====================================================

  const clearError = () => {
    if (taskError) {
      clearTaskError();
    }

    if (classError) {
      clearClassError();
    }
  };

  // ====================================================
  // PAGE CHANGE
  // ====================================================

  const handlePageChange = (newPage) => {
    clearError();

    setPage(newPage);
  };

  // ====================================================
  // TEACHER PAGE
  // ====================================================

  const renderTeacherPage = () => {
    // ==================================================
    // MY CLASSES
    // ==================================================

    if (page === "classes") {
      return (
        <>
          <MyClasses />

          <CreateClass />
        </>
      );
    }

    // ==================================================
    // TASKS
    // ==================================================

    if (page === "tasks") {
      return <TaskDetails />;
    }

    // ==================================================
    // SUMMARY
    // ==================================================

    if (page === "summary") {
      return <Summary />;
    }

    // ==================================================
    // FALLBACK
    // ==================================================

    return (
      <div className="empty-state">
        <h3>Page not found</h3>

        <p>Please select a valid teacher dashboard page.</p>
      </div>
    );
  };

  // ====================================================
  // STUDENT PAGE
  // ====================================================

  const renderStudentPage = () => {
    // ==================================================
    // MY SUBJECTS
    // ==================================================

    if (page === "class") {
      return (
        <>
          <MyClasses />

          <JoinClass />
        </>
      );
    }

    // ==================================================
    // MY TASKS
    // ==================================================

    if (page === "tasks") {
      return <TaskDetails />;
    }

    // ==================================================
    // SUMMARY
    // ==================================================

    if (page === "summary") {
      return <Summary />;
    }

    // ==================================================
    // FALLBACK
    // ==================================================

    return (
      <div className="empty-state">
        <h3>Page not found</h3>

        <p>Please select a valid student dashboard page.</p>
      </div>
    );
  };

  // ====================================================
  // PARENT PAGE
  // ====================================================

  const renderParentPage = () => {
    // ==================================================
    // CHILD PROGRESS
    // ==================================================

    if (page === "child") {
      return (
        <div className="empty-state">
          <h2>Child Progress</h2>

          <p>
            Yahan parent apne child ke tasks, submissions aur teacher ratings
            dekhega.
          </p>
        </div>
      );
    }

    // ==================================================
    // TASKS
    // ==================================================

    if (page === "tasks") {
      return <TaskDetails />;
    }

    // ==================================================
    // SUMMARY
    // ==================================================

    if (page === "summary") {
      return <Summary />;
    }

    // ==================================================
    // FALLBACK
    // ==================================================

    return (
      <div className="empty-state">
        <h3>Page not found</h3>

        <p>Please select a valid parent dashboard page.</p>
      </div>
    );
  };

  // ====================================================
  // ADMIN PAGE
  // ====================================================

  const renderAdminPage = () => {
    // ==================================================
    // ADMIN DASHBOARD
    // ==================================================

    if (page === "admin") {
      return (
        <div className="empty-state">
          <h2>Admin Dashboard</h2>

          <p>
            Admin yahan users, teachers, students aur classes manage karega.
          </p>
        </div>
      );
    }

    // ==================================================
    // FALLBACK
    // ==================================================

    return (
      <div className="empty-state">
        <h3>Page not found</h3>

        <p>Please select a valid admin dashboard page.</p>
      </div>
    );
  };

  // ====================================================
  // ROLE PAGE
  // ====================================================

  const renderPage = () => {
    // --------------------------------------------------
    // AUTH LOADING
    // --------------------------------------------------

    if (!user) {
      return (
        <div className="empty-state">
          <h3>Loading dashboard...</h3>

          <p>Please wait while we load your account.</p>
        </div>
      );
    }

    // --------------------------------------------------
    // TEACHER
    // --------------------------------------------------

    if (isTeacher) {
      return renderTeacherPage();
    }

    // --------------------------------------------------
    // STUDENT
    // --------------------------------------------------

    if (isStudent) {
      return renderStudentPage();
    }

    // --------------------------------------------------
    // PARENT
    // --------------------------------------------------

    if (isParent) {
      return renderParentPage();
    }

    // --------------------------------------------------
    // ADMIN
    // --------------------------------------------------

    if (isAdmin) {
      return renderAdminPage();
    }

    // --------------------------------------------------
    // UNKNOWN ROLE
    // --------------------------------------------------

    return (
      <div className="empty-state">
        <h3>Invalid user role</h3>

        <p>Your account role could not be determined.</p>
      </div>
    );
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="app">
      {/* ==================================================
          NAVBAR
      ================================================== */}

      <Navbar
        user={user}
        page={page}
        setPage={handlePageChange}
        onLogout={logout}
      />

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="container">{renderPage()}</main>

      {/* ==================================================
          ERROR TOAST
      ================================================== */}

      {error && (
        <div className="error-toast" role="alert">
          <span>{error}</span>

          <button type="button" onClick={clearError} aria-label="Close error">
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
