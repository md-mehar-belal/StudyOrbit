function Navbar({ user, page, setPage, onLogout }) {
  // ========================================
  // USER ROLE
  // ========================================

  const role = user?.role;

  const isTeacher = role === "teacher";
  const isStudent = role === "student";
  const isParent = role === "parent";
  const isAdmin = role === "admin";

  // ========================================
  // NAVIGATION ITEMS
  // ========================================

  let navigationItems = [];

  // ========================================
  // TEACHER NAVIGATION
  // ========================================

  if (isTeacher) {
    navigationItems = [
      {
        id: "classes",
        label: "My Classes",
      },
      {
        id: "tasks",
        label: "Tasks",
      },
      {
        id: "summary",
        label: "Summary",
      },
    ];
  }

  // ========================================
  // STUDENT NAVIGATION
  // ========================================

  if (isStudent) {
    navigationItems = [
      {
        id: "class",
        label: "My Class",
      },
      {
        id: "tasks",
        label: "My Tasks",
      },
      {
        id: "summary",
        label: "Summary",
      },
    ];
  }

  // ========================================
  // PARENT NAVIGATION
  // ========================================

  if (isParent) {
    navigationItems = [
      {
        id: "child",
        label: "Child Progress",
      },
      {
        id: "tasks",
        label: "Tasks",
      },
      {
        id: "summary",
        label: "Summary",
      },
    ];
  }

  // ========================================
  // ADMIN NAVIGATION
  // ========================================

  if (isAdmin) {
    navigationItems = [
      {
        id: "admin",
        label: "Admin Dashboard",
      },
    ];
  }

  // ========================================
  // HANDLE NAVIGATION
  // ========================================

  const handleNavigation = (pageName) => {
    setPage(pageName);
  };

  // ========================================
  // ROLE LABEL
  // ========================================

  const getRoleLabel = () => {
    if (isTeacher) {
      return "Teacher";
    }

    if (isStudent) {
      return "Student";
    }

    if (isParent) {
      return "Parent";
    }

    if (isAdmin) {
      return "Admin";
    }

    return "User";
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <header className="navbar">
      <div className="nav-inner">
        {/* ==================================
            BRAND
        ================================== */}

        <div className="brand">
          <div className="brand-icon">✓</div>

          <span>StudyOrbit</span>
        </div>

        {/* ==================================
            NAVIGATION
        ================================== */}

        <nav className="nav-links" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-btn ${page === item.id ? "active" : ""}`}
              onClick={() => handleNavigation(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* ==================================
            USER SECTION
        ================================== */}

        <div className="nav-user">
          {/* USER NAME */}

          <span className="nav-user-name">Hi, {user?.name || "User"}</span>

          {/* ROLE */}

          <span className="nav-role">{getRoleLabel()}</span>

          {/* LOGOUT */}

          <button type="button" className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
