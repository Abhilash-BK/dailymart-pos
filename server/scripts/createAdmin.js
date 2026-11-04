
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function createAdmin() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!uri || !email || !password || password.length < 12) {
    throw new Error(
      "Check MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD. Password must be at least 12 characters."
    );
  }

  await mongoose.connect(uri);

  const existing = await User.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing && existing.role !== "admin") {
    throw new Error(
      "This email belongs to a non-admin account. Admin setup stopped."
    );
  }

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    existing.isActive = true;
    existing.emailVerified = true;
    existing.approvalStatus = "approved";

    await existing.save();

    console.log("Existing admin account updated successfully.");
  } else {
    await User.create({
      email,
      passwordHash,
      role: "admin",
      isActive: true,
      emailVerified: true,
      approvalStatus: "approved",
    });

    console.log("Admin account created successfully.");
  }
}

createAdmin()
  .catch((error) => {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
