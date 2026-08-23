const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const path = require("path");

// ========================================
// ROUTES
// ========================================

const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");
const deletedTaskRoutes = require("./routes/deletedTaskRoutes");
const classRoutes = require("./routes/classRoutes");
const parentRoutes = require("./routes/parentRoutes");

// ========================================
// APP
// ========================================

const app = express();

// ========================================
// MIDDLEWARE
// ========================================

// CORS
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);



// JSON
app.use(express.json());

// ========================================
// STATIC FILES
// ========================================

// Uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========================================
// API ROUTES
// ========================================

// Authentication
app.use("/api/auth", authRoutes);

// Tasks
app.use("/api/tasks", taskRoutes);

// Deleted task history
app.use("/api/deleted-tasks", deletedTaskRoutes);

// Classes
app.use("/api/classes", classRoutes);

// Parents
app.use("/api/parent", parentRoutes);

// ========================================
// TEST ROUTE
// ========================================

app.get("/", (req, res) => {
  res.status(200).send("StudyOrbit API Running");
});

// ========================================
// MONGODB + SERVER
// ========================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Error:", error.message);
  });