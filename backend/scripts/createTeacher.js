const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");

require("dotenv").config();

const User = require("../models/User");

// ========================================
// READ INPUT
// ========================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ========================================
// QUESTION HELPER
// ========================================

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// ========================================
// MAIN
// ========================================

async function createTeacher() {
  try {
    // ======================================
    // CONNECT MONGODB
    // ======================================

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "\nMongoDB Connected\n"
    );

    // ======================================
    // GET TEACHER DETAILS
    // ======================================

    const name =
      (
        await askQuestion(
          "Teacher name: "
        )
      ).trim();

    const email =
      (
        await askQuestion(
          "Teacher email: "
        )
      )
        .trim()
        .toLowerCase();

    const password =
      await askQuestion(
        "Teacher password: "
      );

    // ======================================
    // VALIDATION
    // ======================================

    if (!name) {
      throw new Error(
        "Teacher name is required."
      );
    }

    if (name.length < 2) {
      throw new Error(
        "Teacher name must be at least 2 characters."
      );
    }

    if (!email) {
      throw new Error(
        "Teacher email is required."
      );
    }

    if (
      !email.includes("@") ||
      !email.includes(".")
    ) {
      throw new Error(
        "Please enter a valid email."
      );
    }

    if (!password) {
      throw new Error(
        "Teacher password is required."
      );
    }

    if (password.length < 8) {
      throw new Error(
        "Password must contain at least 8 characters."
      );
    }

    // ======================================
    // CHECK EXISTING EMAIL
    // ======================================

    const existingUser =
      await User.findOne({
        email,
      });

    if (existingUser) {
      throw new Error(
        "This email is already registered."
      );
    }

    // ======================================
    // HASH PASSWORD
    // ======================================

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    // ======================================
    // CREATE TEACHER
    // ======================================

    const teacher =
      await User.create({
        name,

        email,

        password:
          hashedPassword,

        role: "teacher",

        isActive: true,

        teacherId: null,

        parentId: null,

        parentLinkStatus:
          "none",

        createdBy: null,
      });

    // ======================================
    // SUCCESS
    // ======================================

    console.log(
      "\n========================================"
    );

    console.log(
      "Teacher account created successfully!"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Name: ${teacher.name}`
    );

    console.log(
      `Email: ${teacher.email}`
    );

    console.log(
      `Role: ${teacher.role}`
    );

    console.log(
      "Password: Stored securely as bcrypt hash"
    );

    console.log(
      "========================================\n"
    );

  } catch (error) {
    console.error(
      "\nTeacher creation failed:"
    );

    console.error(
      error.message
    );

  } finally {
    rl.close();

    await mongoose.connection.close();

    process.exit(0);
  }
}

// ========================================
// START
// ========================================

createTeacher();