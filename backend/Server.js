const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

// ========================================
// ROUTES
// ========================================

const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");
const deletedTaskRoutes = require("./routes/deletedTaskRoutes");
const classRoutes = require("./routes/classRoutes");

// ========================================
// APP
// ========================================

const app = express();

// ========================================
// MIDDLEWARE
// ========================================

app.use(
  cors()
);

app.use(
  express.json()
);

// ========================================
// STATIC FILES
// ========================================

// Uploaded files
app.use(
  "/uploads",
  express.static("uploads")
);

// ========================================
// API ROUTES
// ========================================

// Authentication
app.use(
  "/api/auth",
  authRoutes
);

// Tasks
app.use(
  "/api/tasks",
  taskRoutes
);

// Deleted task history
app.use(
  "/api/deleted-tasks",
  deletedTaskRoutes
);

// Classes
app.use(
  "/api/classes",
  classRoutes
);

// ========================================
// TEST ROUTE
// ========================================

app.get(
  "/",
  (req, res) => {
    res.send(
      "StudyOrbit API Running"
    );
  }
);

// ========================================
// MONGODB + SERVER
// ========================================

mongoose
  .connect(process.env.MONGO_URI)

  .then(() => {
    console.log(
      "MongoDB Connected"
    );

    app.listen(
      5000,
      () => {
        console.log(
          "Server running on http://localhost:5000"
        );
      }
    );
  })

  .catch((error) => {
    console.error(
      "MongoDB Error:",
      error.message
    );
  });