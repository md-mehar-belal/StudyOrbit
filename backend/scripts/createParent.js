require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function createParent() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "parent@gmail.com";
    const password = "Parent@123";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("Parent already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const parent = await User.create({
      name: "Test Parent",
      email,
      password: hashedPassword,
      role: "parent",
      isActive: true,

      teacherId: null,
      parentId: null,
      parentLinkStatus: "none",
      createdBy: null,
    });

    console.log("Parent created successfully");
    console.log("Email:", parent.email);
    console.log("Password:", password);
    console.log("Role:", parent.role);

    process.exit(0);
  } catch (error) {
    console.error("Error creating parent:", error);
    process.exit(1);
  }
}

createParent();